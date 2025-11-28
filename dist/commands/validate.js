import chalk from "chalk";
import ora from "ora";
import path from "path";
import fs from "fs-extra";
import { glob } from "glob";
import { XMLValidator } from "fast-xml-parser";
export async function validateCommand(options = {}) {
    const cwd = process.cwd();
    // Check if we're in a ClaudeSlide project
    if (!fs.existsSync(path.join(cwd, ".claudeslide.json"))) {
        console.error(chalk.red("Error: Not a ClaudeSlide project"));
        console.error(chalk.yellow("Run this command from a ClaudeSlide project directory"));
        process.exit(1);
    }
    // Work directory contains the OOXML files
    const workDir = path.join(cwd, "work");
    if (!fs.existsSync(workDir)) {
        console.error(chalk.red("Error: work/ directory not found"));
        console.error(chalk.yellow("The OOXML files should be in the work/ subdirectory"));
        process.exit(1);
    }
    const spinner = ora("Validating XML files...").start();
    let result = await validate(workDir);
    spinner.stop();
    // If --fix is enabled and there are fixable errors, attempt to fix them
    if (options.fix && (result.errors.some(e => e.fixable) || result.warnings.some(w => w.fixable))) {
        console.log(chalk.cyan("\nAttempting to fix recoverable errors...\n"));
        let fixedCount = 0;
        let failedCount = 0;
        // Fix errors first
        for (const error of [...result.errors, ...result.warnings]) {
            if (error.fixable && error.fixAction) {
                try {
                    const fixed = error.fixAction();
                    if (fixed) {
                        console.log(chalk.green(`  ✓ Fixed: ${error.message}`));
                        fixedCount++;
                    }
                    else {
                        console.log(chalk.red(`  ✗ Could not fix: ${error.message}`));
                        failedCount++;
                    }
                }
                catch (err) {
                    console.log(chalk.red(`  ✗ Error fixing: ${error.message}`));
                    failedCount++;
                }
            }
        }
        console.log();
        console.log(chalk.cyan(`Fixed ${fixedCount} issue(s), ${failedCount} could not be fixed`));
        // Re-validate after fixes
        if (fixedCount > 0) {
            console.log(chalk.cyan("\nRe-validating after fixes...\n"));
            const revalidateSpinner = ora("Re-validating...").start();
            result = await validate(workDir);
            revalidateSpinner.stop();
        }
    }
    // Display results
    if (result.errors.length === 0 && result.warnings.length === 0) {
        console.log(chalk.green("✓ All validations passed"));
        return;
    }
    // Show errors
    for (const error of result.errors) {
        console.log();
        console.log(chalk.red(`✗ Error: ${error.message}`));
        if (error.file) {
            console.log(chalk.gray(`  File: ${error.file}${error.line ? `:${error.line}` : ""}`));
        }
        if (error.suggestion) {
            console.log(chalk.yellow(`  Suggestion: ${error.suggestion}`));
        }
        if (error.fixable && !options.fix) {
            console.log(chalk.cyan(`  Fixable: Run with --fix to auto-repair`));
        }
    }
    // Show warnings
    for (const warning of result.warnings) {
        console.log();
        console.log(chalk.yellow(`⚠ Warning: ${warning.message}`));
        if (warning.file) {
            console.log(chalk.gray(`  File: ${warning.file}`));
        }
        if (warning.suggestion) {
            console.log(chalk.cyan(`  Suggestion: ${warning.suggestion}`));
        }
        if (warning.fixable && !options.fix) {
            console.log(chalk.cyan(`  Fixable: Run with --fix to auto-repair`));
        }
    }
    // Show info
    for (const info of result.info) {
        console.log();
        console.log(chalk.blue(`ℹ Info: ${info.message}`));
        if (info.file) {
            console.log(chalk.gray(`  File: ${info.file}`));
        }
    }
    // Summary
    console.log();
    if (result.errors.length > 0) {
        const fixableCount = result.errors.filter(e => e.fixable).length + result.warnings.filter(w => w.fixable).length;
        console.log(chalk.red(`Found ${result.errors.length} error(s), ${result.warnings.length} warning(s)`));
        if (fixableCount > 0 && !options.fix) {
            console.log(chalk.cyan(`${fixableCount} issue(s) may be auto-fixable. Run with --fix to attempt repair.`));
        }
        process.exit(1);
    }
    else {
        console.log(chalk.yellow(`Found ${result.warnings.length} warning(s), but no errors`));
    }
}
async function validate(workDir) {
    const errors = [];
    const warnings = [];
    const info = [];
    // Phase 1: Check required files exist
    const requiredFiles = [
        "[Content_Types].xml",
        "_rels/.rels",
        "ppt/presentation.xml",
        "ppt/_rels/presentation.xml.rels",
    ];
    for (const file of requiredFiles) {
        const filePath = path.join(workDir, file);
        if (!fs.existsSync(filePath)) {
            errors.push({
                severity: "error",
                code: "MISSING_REQUIRED_FILE",
                message: `Required file missing: ${file}`,
                file,
                suggestion: "This file is essential for a valid PPTX. Restore from source.pptx if needed.",
            });
        }
    }
    // Phase 2: XML well-formedness for all XML files
    const xmlFiles = await glob("**/*.xml", { cwd: workDir, ignore: ["node_modules/**"] });
    for (const file of xmlFiles) {
        const filePath = path.join(workDir, file);
        try {
            const content = fs.readFileSync(filePath, "utf-8");
            const result = XMLValidator.validate(content, { allowBooleanAttributes: true });
            if (result !== true) {
                const errorMsg = result.err.msg;
                const errorLine = result.err.line;
                // Check if this is an unclosed tag error that we can fix
                const unclosedTagMatch = errorMsg.match(/Expected closing tag '([^']+)'/);
                const isUnclosedTagError = unclosedTagMatch !== null;
                errors.push({
                    severity: "error",
                    code: "MALFORMED_XML",
                    message: `XML syntax error: ${errorMsg}`,
                    file,
                    line: errorLine,
                    suggestion: "Fix the XML syntax error and run validation again.",
                    fixable: isUnclosedTagError,
                    fixAction: isUnclosedTagError ? () => fixUnclosedTag(filePath, unclosedTagMatch[1], errorLine) : undefined,
                });
            }
        }
        catch (err) {
            errors.push({
                severity: "error",
                code: "FILE_READ_ERROR",
                message: `Could not read file: ${err instanceof Error ? err.message : "Unknown error"}`,
                file,
            });
        }
    }
    // Phase 3: Check relationships integrity
    const relsFiles = await glob("**/*.rels", { cwd: workDir });
    for (const relsFile of relsFiles) {
        const relsPath = path.join(workDir, relsFile);
        try {
            const content = fs.readFileSync(relsPath, "utf-8");
            // Extract Relationship elements with their Target attributes
            const relationshipMatches = content.matchAll(/<Relationship[^>]*Target="([^"]+)"[^>]*\/>/g);
            for (const match of relationshipMatches) {
                const target = match[1];
                const fullMatch = match[0];
                // Skip external relationships (URLs)
                if (target.startsWith("http://") || target.startsWith("https://")) {
                    continue;
                }
                // Resolve target path relative to the .rels file location
                const relsDir = path.dirname(relsPath);
                const parentDir = path.dirname(relsDir); // Go up from _rels folder
                const targetPath = path.resolve(parentDir, target);
                if (!fs.existsSync(targetPath)) {
                    errors.push({
                        severity: "error",
                        code: "BROKEN_RELATIONSHIP",
                        message: `Broken relationship: ${target} does not exist`,
                        file: relsFile,
                        suggestion: `Add the missing file or remove the relationship from ${relsFile}`,
                        fixable: true,
                        fixAction: () => removeRelationshipEntry(relsPath, fullMatch),
                    });
                }
            }
        }
        catch {
            // Already handled in XML validation
        }
    }
    // Phase 4: Check Content-Types consistency
    const contentTypesPath = path.join(workDir, "[Content_Types].xml");
    if (fs.existsSync(contentTypesPath)) {
        try {
            const content = fs.readFileSync(contentTypesPath, "utf-8");
            // Check Override entries point to existing files
            const overrideMatches = content.matchAll(/<Override[^>]*PartName="([^"]+)"[^>]*\/>/g);
            for (const match of overrideMatches) {
                const partName = match[1];
                const fullMatch = match[0];
                // PartName starts with /, remove it for file path
                const filePath = partName.startsWith("/") ? partName.slice(1) : partName;
                const fullPath = path.join(workDir, filePath);
                if (!fs.existsSync(fullPath)) {
                    warnings.push({
                        severity: "warning",
                        code: "MISSING_CONTENT_TYPE_TARGET",
                        message: `Content-Types references missing file: ${partName}`,
                        file: "[Content_Types].xml",
                        suggestion: `Remove the Override entry or add the file: ${filePath}`,
                        fixable: true,
                        fixAction: () => removeContentTypeEntry(contentTypesPath, fullMatch),
                    });
                }
            }
        }
        catch {
            // Already handled
        }
    }
    // Phase 5: Check for orphan slides
    const slidesDir = path.join(workDir, "ppt", "slides");
    if (fs.existsSync(slidesDir)) {
        const slideFiles = fs.readdirSync(slidesDir).filter((f) => f.match(/^slide\d+\.xml$/));
        // Check if all slides are referenced in presentation.xml.rels
        const presentationRelsPath = path.join(workDir, "ppt", "_rels", "presentation.xml.rels");
        if (fs.existsSync(presentationRelsPath)) {
            const relsContent = fs.readFileSync(presentationRelsPath, "utf-8");
            for (const slideFile of slideFiles) {
                if (!relsContent.includes(`slides/${slideFile}`)) {
                    const orphanSlidePath = path.join(slidesDir, slideFile);
                    const orphanSlideRelsPath = path.join(slidesDir, "_rels", `${slideFile}.rels`);
                    warnings.push({
                        severity: "warning",
                        code: "ORPHAN_SLIDE",
                        message: `Slide not referenced in presentation: ${slideFile}`,
                        file: `ppt/slides/${slideFile}`,
                        suggestion: "Add a relationship in ppt/_rels/presentation.xml.rels or delete the orphan slide",
                        fixable: true,
                        fixAction: () => deleteOrphanSlide(orphanSlidePath, orphanSlideRelsPath),
                    });
                }
            }
        }
    }
    return {
        valid: errors.length === 0,
        errors,
        warnings,
        info,
    };
}
// Fix helper functions
/**
 * Attempts to fix unclosed XML tags by inserting the closing tag
 */
function fixUnclosedTag(filePath, tagName, errorLine) {
    try {
        const content = fs.readFileSync(filePath, "utf-8");
        const lines = content.split("\n");
        if (errorLine <= 0 || errorLine > lines.length) {
            return false;
        }
        const lineIndex = errorLine - 1;
        const line = lines[lineIndex];
        // Find the opening tag in the line
        const openTagRegex = new RegExp(`<${tagName}[^>]*>`, "g");
        const closeTag = `</${tagName}>`;
        // Check if the tag is opened but not closed on this line
        const openMatches = line.match(openTagRegex);
        const closeMatches = line.match(new RegExp(closeTag, "g"));
        if (openMatches && (!closeMatches || openMatches.length > closeMatches.length)) {
            // Find where to insert the closing tag
            // Look for the next tag start after the open tag
            let fixedLine = line;
            // Strategy: Find unclosed <a:t> and close it before the next < that's not part of it
            // This handles cases like: <a:t>some text<a:r> (missing </a:t>)
            const pattern = new RegExp(`(<${tagName}[^>]*>)([^<]*)(<(?!/${tagName}))`, "g");
            fixedLine = line.replace(pattern, `$1$2${closeTag}$3`);
            // If that didn't work, try closing at end of text content
            if (fixedLine === line) {
                // Try finding text content after the opening tag and close it
                const simplePattern = new RegExp(`(<${tagName}[^>]*>)([^<]+)$`);
                fixedLine = line.replace(simplePattern, `$1$2${closeTag}`);
            }
            if (fixedLine !== line) {
                lines[lineIndex] = fixedLine;
                fs.writeFileSync(filePath, lines.join("\n"));
                return true;
            }
        }
        // Alternative: Try to find and fix across the file
        // Look for opening tag without corresponding close
        const allOpenTags = content.match(new RegExp(`<${tagName}[^/>]*>`, "g")) || [];
        const allCloseTags = content.match(new RegExp(`</${tagName}>`, "g")) || [];
        if (allOpenTags.length > allCloseTags.length) {
            // There's an unclosed tag somewhere - try a more aggressive fix
            // Find text like <a:t>content</ and fix to <a:t>content</a:t></
            const brokenPattern = new RegExp(`(<${tagName}[^>]*>[^<]*)(</(?!${tagName}))`, "g");
            const fixedContent = content.replace(brokenPattern, `$1${closeTag}$2`);
            if (fixedContent !== content) {
                fs.writeFileSync(filePath, fixedContent);
                return true;
            }
        }
        return false;
    }
    catch {
        return false;
    }
}
/**
 * Removes a broken relationship entry from a .rels file
 */
function removeRelationshipEntry(relsPath, entryToRemove) {
    try {
        let content = fs.readFileSync(relsPath, "utf-8");
        // Remove the entry (handle both with and without newlines)
        const escapedEntry = entryToRemove.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const pattern = new RegExp(`\\s*${escapedEntry}\\s*`, "g");
        const newContent = content.replace(pattern, "\n");
        if (newContent !== content) {
            fs.writeFileSync(relsPath, newContent);
            return true;
        }
        return false;
    }
    catch {
        return false;
    }
}
/**
 * Removes a missing content type override entry
 */
function removeContentTypeEntry(contentTypesPath, entryToRemove) {
    try {
        let content = fs.readFileSync(contentTypesPath, "utf-8");
        // Remove the entry
        const escapedEntry = entryToRemove.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const pattern = new RegExp(`\\s*${escapedEntry}\\s*`, "g");
        const newContent = content.replace(pattern, "\n");
        if (newContent !== content) {
            fs.writeFileSync(contentTypesPath, newContent);
            return true;
        }
        return false;
    }
    catch {
        return false;
    }
}
/**
 * Deletes an orphan slide file and its relationship file
 */
function deleteOrphanSlide(slidePath, slideRelsPath) {
    try {
        if (fs.existsSync(slidePath)) {
            fs.unlinkSync(slidePath);
        }
        if (fs.existsSync(slideRelsPath)) {
            fs.unlinkSync(slideRelsPath);
        }
        return true;
    }
    catch {
        return false;
    }
}
export { validate };
//# sourceMappingURL=validate.js.map
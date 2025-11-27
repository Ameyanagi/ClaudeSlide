import chalk from "chalk";
import ora from "ora";
import path from "path";
import fs from "fs-extra";
import AdmZip from "adm-zip";
import { validate } from "./validate.js";
export async function saveCommand(options) {
    const cwd = process.cwd();
    // Check if we're in a ClaudeSlide project
    const metadataPath = path.join(cwd, ".claudeslide.json");
    if (!fs.existsSync(metadataPath)) {
        console.error(chalk.red("Error: Not a ClaudeSlide project"));
        console.error(chalk.yellow("Run this command from a ClaudeSlide project directory"));
        process.exit(1);
    }
    const metadata = fs.readJsonSync(metadataPath);
    const projectName = metadata.projectName;
    // Work directory contains the OOXML files
    const workDir = path.join(cwd, "work");
    if (!fs.existsSync(workDir)) {
        console.error(chalk.red("Error: work/ directory not found"));
        console.error(chalk.yellow("The OOXML files should be in the work/ subdirectory"));
        process.exit(1);
    }
    // Determine output path
    const outputPath = options.output
        ? path.resolve(options.output)
        : path.join(cwd, `${projectName}.pptx`);
    // Run validation first
    console.log(chalk.bold("Step 1: Validating XML files..."));
    console.log();
    const validationResult = await validate(workDir);
    if (!validationResult.valid) {
        console.log();
        console.log(chalk.red("✗ Validation failed"));
        console.log();
        for (const error of validationResult.errors) {
            console.log(chalk.red(`  • ${error.message}`));
            if (error.file) {
                console.log(chalk.gray(`    File: ${error.file}`));
            }
        }
        console.log();
        console.log(chalk.yellow("Fix the errors above and run 'npm run save' again"));
        process.exit(1);
    }
    // Show warnings but continue
    if (validationResult.warnings.length > 0) {
        console.log(chalk.yellow(`⚠ ${validationResult.warnings.length} warning(s) found (continuing anyway)`));
    }
    else {
        console.log(chalk.green("✓ Validation passed"));
    }
    console.log();
    console.log(chalk.bold("Step 2: Packaging PPTX..."));
    const spinner = ora("Creating PPTX file...").start();
    try {
        // Create zip from work/ directory (contains OOXML files only)
        const zip = new AdmZip();
        // No exclusions needed - work/ contains only OOXML files
        addDirectoryToZip(zip, workDir, "", []);
        // Write zip file
        zip.writeZip(outputPath);
        spinner.succeed("Created PPTX file");
        // Get file size
        const stats = fs.statSync(outputPath);
        const sizeKB = Math.round(stats.size / 1024);
        const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        console.log();
        console.log(chalk.green(`✓ Saved to: ${outputPath}`));
        console.log(chalk.gray(`  Size: ${sizeKB > 1024 ? `${sizeMB} MB` : `${sizeKB} KB`}`));
        console.log(chalk.gray(`  Slides: ${metadata.slideCount}`));
        console.log();
        console.log("The presentation is ready to open in PowerPoint.");
    }
    catch (error) {
        spinner.fail("Failed to create PPTX file");
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : "Unknown error"}`));
        process.exit(1);
    }
}
function addDirectoryToZip(zip, basePath, zipPath, excludeFiles) {
    const entries = fs.readdirSync(basePath, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(basePath, entry.name);
        const entryZipPath = zipPath ? `${zipPath}/${entry.name}` : entry.name;
        // Skip excluded files/directories
        if (excludeFiles.includes(entry.name)) {
            continue;
        }
        if (entry.isDirectory()) {
            addDirectoryToZip(zip, fullPath, entryZipPath, excludeFiles);
        }
        else {
            // Read file and add to zip
            const content = fs.readFileSync(fullPath);
            zip.addFile(entryZipPath, content);
        }
    }
}
//# sourceMappingURL=save.js.map
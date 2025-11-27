import chalk from "chalk";
import ora from "ora";
import path from "path";
import fs from "fs-extra";
import { glob } from "glob";
import { XMLValidator } from "fast-xml-parser";

interface ValidationError {
  severity: "error" | "warning" | "info";
  code: string;
  message: string;
  file?: string;
  line?: number;
  suggestion?: string;
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  info: ValidationError[];
}

export async function validateCommand(): Promise<void> {
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

  const result = await validate(workDir);

  spinner.stop();

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
    console.log(
      chalk.red(
        `Found ${result.errors.length} error(s), ${result.warnings.length} warning(s)`
      )
    );
    process.exit(1);
  } else {
    console.log(
      chalk.yellow(`Found ${result.warnings.length} warning(s), but no errors`)
    );
  }
}

async function validate(workDir: string): Promise<ValidationResult> {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const info: ValidationError[] = [];

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
        errors.push({
          severity: "error",
          code: "MALFORMED_XML",
          message: `XML syntax error: ${result.err.msg}`,
          file,
          line: result.err.line,
          suggestion: "Fix the XML syntax error and run validation again.",
        });
      }
    } catch (err) {
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

      // Extract Target attributes from relationships
      const targetMatches = content.matchAll(/Target="([^"]+)"/g);

      for (const match of targetMatches) {
        const target = match[1];

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
          });
        }
      }
    } catch {
      // Already handled in XML validation
    }
  }

  // Phase 4: Check Content-Types consistency
  const contentTypesPath = path.join(workDir, "[Content_Types].xml");
  if (fs.existsSync(contentTypesPath)) {
    try {
      const content = fs.readFileSync(contentTypesPath, "utf-8");

      // Check Override entries point to existing files
      const overrideMatches = content.matchAll(/PartName="([^"]+)"/g);

      for (const match of overrideMatches) {
        const partName = match[1];
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
          });
        }
      }
    } catch {
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
          warnings.push({
            severity: "warning",
            code: "ORPHAN_SLIDE",
            message: `Slide not referenced in presentation: ${slideFile}`,
            file: `ppt/slides/${slideFile}`,
            suggestion: "Add a relationship in ppt/_rels/presentation.xml.rels or delete the orphan slide",
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

export { validate };

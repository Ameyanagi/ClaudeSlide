import chalk from "chalk";
import ora from "ora";
import path from "path";
import fs from "fs-extra";
import { execSync } from "child_process";
import AdmZip from "adm-zip";

interface PreviewOptions {
  slide?: string;
  dpi?: string;
}

interface LibreOfficeInfo {
  available: boolean;
  path?: string;
  version?: string;
}

export async function previewCommand(options: PreviewOptions): Promise<void> {
  const cwd = process.cwd();

  // Check if we're in a ClaudeSlide project
  const metadataPath = path.join(cwd, ".claudeslide.json");
  if (!fs.existsSync(metadataPath)) {
    console.error(chalk.red("Error: Not a ClaudeSlide project"));
    console.error(chalk.yellow("Run this command from a ClaudeSlide project directory"));
    process.exit(1);
  }

  // Check for LibreOffice
  const loInfo = detectLibreOffice();

  if (!loInfo.available) {
    console.error(chalk.red("Error: LibreOffice not found"));
    console.log();
    console.log(chalk.yellow("Preview generation requires LibreOffice (headless mode)."));
    console.log();
    console.log(chalk.bold("Install LibreOffice:"));
    console.log(chalk.cyan("  • macOS: brew install --cask libreoffice"));
    console.log(chalk.cyan("  • Ubuntu/Debian: sudo apt install libreoffice"));
    console.log(chalk.cyan("  • Arch Linux: sudo pacman -S libreoffice-fresh"));
    console.log(chalk.cyan("  • Windows: Download from libreoffice.org"));
    process.exit(1);
  }

  console.log(chalk.gray(`Using LibreOffice ${loInfo.version || ""}`.trim()));

  // Work directory contains the OOXML files
  const workDir = path.join(cwd, "work");
  if (!fs.existsSync(workDir)) {
    console.error(chalk.red("Error: work/ directory not found"));
    console.error(chalk.yellow("The OOXML files should be in the work/ subdirectory"));
    process.exit(1);
  }

  // We need to first save to a temporary PPTX, then convert
  const previewDir = path.join(cwd, "preview");
  fs.ensureDirSync(previewDir);

  // Create a temporary PPTX from current state
  const tempPptxPath = path.join(previewDir, "_temp.pptx");

  const packSpinner = ora("Creating temporary PPTX...").start();

  try {
    const zip = new AdmZip();

    // Package from work/ directory (contains only OOXML files)
    addDirectoryToZip(zip, workDir, "", []);
    zip.writeZip(tempPptxPath);

    packSpinner.succeed("Created temporary PPTX");
  } catch (error) {
    packSpinner.fail("Failed to create temporary PPTX");
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : "Unknown error"}`));
    process.exit(1);
  }

  // Convert to PDF using LibreOffice
  const pdfSpinner = ora("Converting to PDF...").start();

  try {
    execSync(
      `"${loInfo.path}" --headless --convert-to pdf --outdir "${previewDir}" "${tempPptxPath}"`,
      { timeout: 120000, stdio: "pipe" }
    );
    pdfSpinner.succeed("Converted to PDF");
  } catch (error) {
    pdfSpinner.fail("Failed to convert to PDF");
    console.error(chalk.red("LibreOffice conversion failed"));
    fs.removeSync(tempPptxPath);
    process.exit(1);
  }

  // Convert PDF to PNG images
  const pdfPath = path.join(previewDir, "_temp.pdf");
  const dpi = parseInt(options.dpi || "150", 10);

  const pngSpinner = ora("Generating PNG previews...").start();

  try {
    // Try pdftoppm first (from poppler-utils)
    const hasPdftoppm = checkCommand("pdftoppm");

    if (hasPdftoppm) {
      execSync(
        `pdftoppm -png -r ${dpi} "${pdfPath}" "${path.join(previewDir, "slide")}"`,
        { timeout: 120000, stdio: "pipe" }
      );
    } else {
      // Try pdftocairo as alternative
      const hasPdftocairo = checkCommand("pdftocairo");

      if (hasPdftocairo) {
        execSync(
          `pdftocairo -png -r ${dpi} "${pdfPath}" "${path.join(previewDir, "slide")}"`,
          { timeout: 120000, stdio: "pipe" }
        );
      } else {
        pngSpinner.fail("No PDF to PNG converter found");
        console.log();
        console.log(chalk.yellow("Install poppler-utils for PNG generation:"));
        console.log(chalk.cyan("  • macOS: brew install poppler"));
        console.log(chalk.cyan("  • Ubuntu/Debian: sudo apt install poppler-utils"));
        console.log(chalk.cyan("  • Arch Linux: sudo pacman -S poppler"));
        console.log();
        console.log(chalk.gray("PDF saved at: " + pdfPath));

        // Clean up temp files but keep PDF
        fs.removeSync(tempPptxPath);
        process.exit(1);
      }
    }

    pngSpinner.succeed("Generated PNG previews");
  } catch (error) {
    pngSpinner.fail("Failed to generate PNG previews");
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : "Unknown error"}`));
  }

  // Clean up temp files
  fs.removeSync(tempPptxPath);
  fs.removeSync(pdfPath);

  // List generated previews
  const pngFiles = fs.readdirSync(previewDir)
    .filter((f) => f.endsWith(".png"))
    .sort();

  console.log();
  console.log(chalk.green(`✓ Generated ${pngFiles.length} preview(s) in preview/`));
  console.log();

  for (const file of pngFiles) {
    console.log(chalk.cyan(`  • preview/${file}`));
  }

  console.log();
  console.log(chalk.gray("Read these image files to see the slide previews."));
}

function detectLibreOffice(): LibreOfficeInfo {
  const commands = [
    "soffice",
    "libreoffice",
    "/usr/bin/soffice",
    "/usr/bin/libreoffice",
    "/Applications/LibreOffice.app/Contents/MacOS/soffice",
  ];

  for (const cmd of commands) {
    try {
      const result = execSync(`"${cmd}" --version`, { timeout: 5000, stdio: "pipe" });
      const output = result.toString();
      const versionMatch = output.match(/LibreOffice\s+(\d+\.\d+)/);

      return {
        available: true,
        path: cmd,
        version: versionMatch ? versionMatch[1] : undefined,
      };
    } catch {
      // Try next command
    }
  }

  return { available: false };
}

function checkCommand(cmd: string): boolean {
  try {
    execSync(`which ${cmd}`, { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

function addDirectoryToZip(
  zip: AdmZip,
  basePath: string,
  zipPath: string,
  excludeFiles: string[]
): void {
  const entries = fs.readdirSync(basePath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(basePath, entry.name);
    const entryZipPath = zipPath ? `${zipPath}/${entry.name}` : entry.name;

    if (excludeFiles.includes(entry.name)) {
      continue;
    }

    if (entry.isDirectory()) {
      addDirectoryToZip(zip, fullPath, entryZipPath, excludeFiles);
    } else {
      const content = fs.readFileSync(fullPath);
      zip.addFile(entryZipPath, content);
    }
  }
}

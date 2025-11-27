#!/usr/bin/env node

import { Command } from "commander";
import { initCommand } from "./commands/init.js";
import { validateCommand } from "./commands/validate.js";
import { saveCommand } from "./commands/save.js";
import { previewCommand } from "./commands/preview.js";

const program = new Command();

program
  .name("claudeslide")
  .description("CLI tool for editing PowerPoint files with AI assistance")
  .version("1.0.0");

program
  .command("init")
  .description("Extract a PPTX file and initialize a project for editing")
  .argument("[pptx-file]", "Path to the PowerPoint file")
  .option("-n, --name <name>", "Project name (mandatory)")
  .option("-o, --output <dir>", "Output directory")
  .option("-f, --force", "Overwrite existing directory", false)
  .option("--no-git", "Skip git initialization")
  .action(initCommand);

program
  .command("validate")
  .description("Validate XML files in the current project")
  .action(validateCommand);

program
  .command("save")
  .description("Validate and repackage the project to a PPTX file")
  .option("-o, --output <file>", "Output file path")
  .action(saveCommand);

program
  .command("preview")
  .description("Generate PNG previews of slides (requires LibreOffice)")
  .option("-s, --slide <number>", "Generate preview for specific slide only")
  .option("--dpi <number>", "DPI for preview images", "150")
  .action(previewCommand);

program.parse();

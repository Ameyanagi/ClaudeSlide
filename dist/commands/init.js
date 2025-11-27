import { input } from "@inquirer/prompts";
import chalk from "chalk";
import ora from "ora";
import path from "path";
import fs from "fs-extra";
import AdmZip from "adm-zip";
import { execSync } from "child_process";
import { XMLParser } from "fast-xml-parser";
import { generateClaudeMd } from "../templates/claude-md.js";
import { generatePackageJson } from "../templates/package-json.js";
import { generateGitignore } from "../templates/gitignore.js";
import { generateClaudeCommands } from "../templates/claude-commands.js";
import { generatePptxSkill } from "../templates/claude-skill.js";
export async function initCommand(pptxFile, options) {
    try {
        // Get PPTX file path (prompt if not provided)
        let filePath = pptxFile;
        if (!filePath) {
            filePath = await input({
                message: "Path to PowerPoint file:",
                validate: (value) => {
                    if (!value.trim())
                        return "File path is required";
                    if (!fs.existsSync(value))
                        return `File not found: ${value}`;
                    if (!value.toLowerCase().endsWith(".pptx"))
                        return "File must be a .pptx file";
                    return true;
                },
            });
        }
        // Validate file exists
        const absolutePath = path.resolve(filePath);
        if (!fs.existsSync(absolutePath)) {
            console.error(chalk.red(`Error: File not found: ${absolutePath}`));
            process.exit(1);
        }
        if (!absolutePath.toLowerCase().endsWith(".pptx")) {
            console.error(chalk.red("Error: File must be a .pptx file"));
            process.exit(1);
        }
        // Get project name (prompt if not provided - MANDATORY)
        let projectName = options.name;
        if (!projectName) {
            projectName = await input({
                message: "Project name:",
                validate: (value) => {
                    if (!value.trim())
                        return "Project name is required";
                    if (!/^[a-zA-Z0-9_-]+$/.test(value))
                        return "Project name can only contain letters, numbers, hyphens, and underscores";
                    return true;
                },
            });
        }
        // Determine output directory
        const outputDir = options.output
            ? path.resolve(options.output)
            : path.resolve(process.cwd(), projectName);
        // Check if directory exists
        if (fs.existsSync(outputDir)) {
            if (!options.force) {
                console.error(chalk.red(`Error: Directory already exists: ${outputDir}`));
                console.error(chalk.yellow("Use --force to overwrite"));
                process.exit(1);
            }
            fs.removeSync(outputDir);
        }
        // Create output directory and work subdirectory
        fs.ensureDirSync(outputDir);
        const workDir = path.join(outputDir, "work");
        fs.ensureDirSync(workDir);
        // Extract PPTX into work/ subdirectory
        const spinner = ora("Extracting PowerPoint file...").start();
        try {
            const zip = new AdmZip(absolutePath);
            zip.extractAllTo(workDir, true);
            spinner.succeed("Extracted PowerPoint file to work/");
        }
        catch (error) {
            spinner.fail("Failed to extract PowerPoint file");
            console.error(chalk.red(`Error: ${error instanceof Error ? error.message : "Unknown error"}`));
            process.exit(1);
        }
        // Copy original file as backup
        const backupSpinner = ora("Creating backup...").start();
        fs.copyFileSync(absolutePath, path.join(outputDir, "source.pptx"));
        backupSpinner.succeed("Created backup (source.pptx)");
        // Extract presentation info
        const infoSpinner = ora("Extracting presentation info...").start();
        const presentationInfo = extractPresentationInfo(workDir);
        infoSpinner.succeed(`Found ${presentationInfo.slideCount} slides`);
        // Generate project files
        const filesSpinner = ora("Generating project files...").start();
        // Create .claudeslide.json
        const metadata = {
            version: "1.0.0",
            projectName,
            presentationTitle: presentationInfo.title,
            sourceFile: absolutePath,
            createdAt: new Date().toISOString(),
            slideCount: presentationInfo.slideCount,
        };
        fs.writeJsonSync(path.join(outputDir, ".claudeslide.json"), metadata, {
            spaces: 2,
        });
        // Generate CLAUDE.md
        fs.writeFileSync(path.join(outputDir, "CLAUDE.md"), generateClaudeMd(projectName, presentationInfo));
        // Generate .claude/commands/ directory with custom commands
        const commandsDir = path.join(outputDir, ".claude", "commands");
        fs.ensureDirSync(commandsDir);
        const commands = generateClaudeCommands();
        for (const [filename, content] of Object.entries(commands)) {
            fs.writeFileSync(path.join(commandsDir, filename), content);
        }
        // Generate .claude/skills/pptx/ directory with PPTX skill
        const skillDir = path.join(outputDir, ".claude", "skills", "pptx");
        fs.ensureDirSync(skillDir);
        const skillFiles = generatePptxSkill();
        for (const [filename, content] of Object.entries(skillFiles)) {
            fs.writeFileSync(path.join(skillDir, filename), content);
        }
        // Generate package.json
        fs.writeJsonSync(path.join(outputDir, "package.json"), generatePackageJson(projectName), { spaces: 2 });
        // Generate .gitignore
        fs.writeFileSync(path.join(outputDir, ".gitignore"), generateGitignore());
        filesSpinner.succeed("Generated project files");
        // Initialize git (unless --no-git)
        if (options.git !== false) {
            const gitSpinner = ora("Initializing git repository...").start();
            try {
                execSync("git init", { cwd: outputDir, stdio: "pipe" });
                execSync("git add .", { cwd: outputDir, stdio: "pipe" });
                execSync('git commit -m "Initial commit: extracted from PPTX"', {
                    cwd: outputDir,
                    stdio: "pipe",
                });
                gitSpinner.succeed("Initialized git repository");
            }
            catch {
                gitSpinner.warn("Git initialization failed (git may not be installed)");
            }
        }
        // Success message
        console.log();
        console.log(chalk.green(`✓ Created '${projectName}' with ${countFiles(outputDir)} files`));
        console.log();
        console.log(chalk.bold("Next steps:"));
        console.log(chalk.cyan(`  cd ${projectName}`));
        console.log(chalk.cyan("  claude                  # Start editing with Claude"));
        console.log(chalk.gray("  # claude --dangerously-skip-permissions"));
        console.log(chalk.cyan("  npm run validate        # Check XML validity"));
        console.log(chalk.cyan("  npm run save            # Save back to .pptx"));
        console.log();
    }
    catch (error) {
        if (error instanceof Error && error.message.includes("User force closed")) {
            console.log(chalk.yellow("\nCancelled"));
            process.exit(0);
        }
        throw error;
    }
}
function countFiles(dir) {
    let count = 0;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        if (entry.isDirectory()) {
            count += countFiles(path.join(dir, entry.name));
        }
        else {
            count++;
        }
    }
    return count;
}
function extractPresentationInfo(workDir) {
    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
    });
    const info = {
        title: "",
        author: "",
        slideCount: 0,
        slides: [],
    };
    // Extract title and author from docProps/core.xml
    const corePropsPath = path.join(workDir, "docProps", "core.xml");
    if (fs.existsSync(corePropsPath)) {
        try {
            const content = fs.readFileSync(corePropsPath, "utf-8");
            const parsed = parser.parse(content);
            const coreProps = parsed["cp:coreProperties"] || parsed["coreProperties"] || {};
            info.title = coreProps["dc:title"] || coreProps["title"] || "";
            info.author = coreProps["dc:creator"] || coreProps["creator"] || "";
        }
        catch {
            // Ignore parsing errors
        }
    }
    // Count slides and extract slide info
    const slidesDir = path.join(workDir, "ppt", "slides");
    if (fs.existsSync(slidesDir)) {
        const slideFiles = fs.readdirSync(slidesDir)
            .filter((f) => f.match(/^slide\d+\.xml$/))
            .sort((a, b) => {
            const numA = parseInt(a.match(/\d+/)?.[0] || "0");
            const numB = parseInt(b.match(/\d+/)?.[0] || "0");
            return numA - numB;
        });
        info.slideCount = slideFiles.length;
        // Extract text from each slide
        for (const slideFile of slideFiles) {
            const slideNum = parseInt(slideFile.match(/\d+/)?.[0] || "0");
            const slidePath = path.join(slidesDir, slideFile);
            try {
                const content = fs.readFileSync(slidePath, "utf-8");
                // Extract all text content (simple regex approach)
                const textMatches = content.match(/<a:t>([^<]*)<\/a:t>/g) || [];
                const texts = textMatches
                    .map((m) => m.replace(/<\/?a:t>/g, "").trim())
                    .filter((t) => t.length > 0);
                // First significant text is likely the title
                const slideTitle = texts[0] || `Slide ${slideNum}`;
                const slideContent = texts.slice(1).join(" ").substring(0, 200);
                info.slides.push({
                    number: slideNum,
                    title: slideTitle,
                    contentPreview: slideContent,
                });
            }
            catch {
                info.slides.push({
                    number: slideNum,
                    title: `Slide ${slideNum}`,
                    contentPreview: "",
                });
            }
        }
    }
    return info;
}
//# sourceMappingURL=init.js.map
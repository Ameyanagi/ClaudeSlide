# ClaudeSlide

CLI tool for editing PowerPoint files with AI assistance. Extract PPTX to editable XML, make changes with Claude, and save back to PPTX.

## Installation

```bash
npm install -g claudeslide
```

Or use directly with npx:

```bash
npx claudeslide init
```

## Quick Start

```bash
# Initialize a project from a PPTX file
npx claudeslide init presentation.pptx --name my-project

# Navigate to the project
cd my-project

# Edit XML files with Claude, then...

# Validate your changes
npm run validate

# Generate preview images (requires LibreOffice)
npm run preview

# Save back to PPTX
npm run save
```

## Commands

### `claudeslide init [pptx-file]`

Extract a PPTX file and initialize a project for editing.

```bash
# Interactive mode (prompts for file and project name)
claudeslide init

# With arguments
claudeslide init presentation.pptx --name my-project

# Options
-n, --name <name>   Project name (mandatory)
-o, --output <dir>  Output directory
-f, --force         Overwrite existing directory
--no-git            Skip git initialization
```

### `claudeslide validate`

Validate XML files in the current project. Checks for:
- XML well-formedness
- Required files exist
- Relationship integrity
- Content-Types consistency

### `claudeslide save`

Validate and repackage the project to a PPTX file.

```bash
# Save to project root (default: <project-name>.pptx)
claudeslide save

# Save to custom path
claudeslide save --output custom-name.pptx
```

### `claudeslide preview`

Generate PNG previews of slides (requires LibreOffice and poppler-utils).

```bash
# Generate all previews
claudeslide preview

# Custom DPI
claudeslide preview --dpi 300
```

## Project Structure

After running `init`, your project will look like:

```
my-project/
├── CLAUDE.md              # Instructions for Claude
├── package.json           # npm scripts
├── .claudeslide.json      # Project metadata
├── source.pptx            # Original backup
├── [Content_Types].xml    # OOXML manifest
├── ppt/
│   ├── slides/            # Slide XML files
│   ├── slideLayouts/      # Layout templates
│   ├── slideMasters/      # Master slides
│   ├── theme/             # Theme definitions
│   └── media/             # Images and media
└── preview/               # Generated PNG previews
```

## Requirements

- Node.js >= 18.0.0
- Git (optional, for version control)
- LibreOffice (optional, for preview generation)
- poppler-utils (optional, for PNG conversion)

### Installing Optional Dependencies

**LibreOffice:**
```bash
# macOS
brew install --cask libreoffice

# Ubuntu/Debian
sudo apt install libreoffice

# Arch Linux
sudo pacman -S libreoffice-fresh
```

**poppler-utils:**
```bash
# macOS
brew install poppler

# Ubuntu/Debian
sudo apt install poppler-utils

# Arch Linux
sudo pacman -S poppler
```

## How It Works

1. PPTX files are ZIP archives containing XML files
2. ClaudeSlide extracts the XML structure for direct editing
3. Claude can read and modify the XML files
4. Changes are validated and repackaged into a valid PPTX

## License

MIT
# ClaudeSlide

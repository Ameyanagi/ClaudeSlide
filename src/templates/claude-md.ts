export interface SlideInfo {
  number: number;
  title: string;
  contentPreview: string;
}

export interface PresentationInfo {
  title: string;
  author: string;
  slideCount: number;
  slides: SlideInfo[];
}

export function generateClaudeMd(projectName: string, info: PresentationInfo, language: string = "English"): string {
  const title = info.title || projectName;
  const slidesList = info.slides
    .map((s) => `| ${s.number} | ${s.title} | ${s.contentPreview ? s.contentPreview.substring(0, 50) + "..." : ""} |`)
    .join("\n");

  return `# ${title}

This is a ClaudeSlide project. The PowerPoint has been extracted to editable XML files in the \`work/\` directory.

## Project Info

- **Project Name**: ${projectName}
- **Presentation Title**: ${info.title || "(No title)"}
- **Author**: ${info.author || "(Unknown)"}
- **Slide Count**: ${info.slideCount} slides
- **Created**: ${new Date().toISOString().split("T")[0]}

## Slide Overview

| # | Title | Content Preview |
|---|-------|-----------------|
${slidesList}

## Creative Vision

**Your goal: Create a visually stunning, memorable presentation.**

Use your full creativity. Think like a professional designer:
- What would make someone stop and look at this slide?
- How can the visual tell the story without walls of text?
- What unexpected layout or visual approach would be most impactful?

Don't follow rigid rules. Instead, ask yourself: *Is this slide beautiful? Is it memorable? Does it communicate clearly?*

### Your Superpowers for Visuals

**SVG for Diagrams & Illustrations** - Write SVG code directly to create:
- Flowcharts and process diagrams
- Architectural diagrams and system maps
- Icons and illustrations
- Infographics and layouts
- Timeline visualizations
- Mind maps and concept diagrams

Save SVGs to \`work/ppt/media/\` and embed in slides. Be ambitious - you have full control over every element!

**Seaborn/Matplotlib for Data Charts** - Use Python via \`uv\` for data-driven visualizations.

Always write scripts to a file first, then run:
1. Write script to \`scripts/chart_name.py\`
2. Run: \`uv run --with matplotlib --with seaborn --with numpy python scripts/chart_name.py\`
3. Output to \`work/ppt/media/\`

Use seaborn for: bar charts, line graphs, scatter plots, heatmaps, statistical visualizations. See DESIGN-GUIDE.md for examples.

## Process

1. **Think deeply first**: Before editing, envision the final presentation. What visual style would best serve this content? What's the emotional journey?

2. **Plan your approach**: Write a brief outline in \`outlines/\` with your creative vision for key slides.

3. **Create boldly**: Use diagrams, shapes, interesting layouts. Avoid the trap of bullet points. Each slide should have visual impact.

4. **Validate often**: Run \`npm run validate\` after changes. Use \`npm run fix\` if there are XML errors.

5. **Review visually**: Run \`npm run preview\` and look at the slides. Trust your judgment - if it looks boring, make it better.

## Design Freedom

You have **complete creative freedom** over:
- Colors - choose what looks best, not what's "safe"
- Layouts - asymmetric, bold, unconventional layouts often work better than centered text
- Visual elements - diagrams, shapes, icons, images
- Structure - add, remove, reorder slides as needed

**For design inspiration and XML examples, see DESIGN-GUIDE.md**

## Technical Essentials

### File Structure
| Location | Purpose |
|----------|---------|
| \`work/ppt/slides/slide*.xml\` | Individual slide content |
| \`work/ppt/theme/theme1.xml\` | Colors and fonts |
| \`work/ppt/media/\` | Images and SVG files |
| \`work/ppt/_rels/\` | Relationships between files |

### Adding Images/SVGs
1. Save file to \`work/ppt/media/\`
2. Add relationship in the slide's \`_rels/slideN.xml.rels\`
3. Reference in slide XML with \`<a:blip r:embed="rIdX"/>\`
4. Update \`[Content_Types].xml\` for new formats

### Language
All slide content must be in **${language}**

## Quality Workflow

Before delivering:

1. \`npm run validate\` - Check for XML errors
2. \`npm run fix\` - Auto-fix recoverable errors if needed
3. \`npm run preview\` - Generate slide images
4. **Visual review** - Look at the previews. Are they stunning?
5. \`npm run save\` - Create the final PPTX

### Design Review (Optional)

For important presentations, spawn a Design Review subagent before final delivery:

\`\`\`
Task: Review this presentation for visual impact and professionalism
Context: Preview images in preview/, slide XML in work/ppt/slides/
Evaluate: Is each slide visually engaging? Is the overall flow coherent? Any slides that look boring or cluttered?
Output: List specific slides that need improvement and why
\`\`\`

## Important Rules

1. **Validate before saving**: Always run \`npm run validate\` before \`npm run save\`
2. **Preserve relationship IDs**: Each \`rId\` links files together
3. **Maintain XML validity**: Ensure all tags are properly closed

## Commands

\`\`\`bash
npm run validate  # Check XML validity
npm run fix       # Auto-fix recoverable errors
npm run preview   # Generate slide images
npm run save      # Create .pptx file
\`\`\`

---

*Trust your creativity. Make something beautiful.*
`;
}

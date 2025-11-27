export function generateClaudeCommands(): Record<string, string> {
  return {
    "save.md": `# Save Presentation

Validate and save the presentation to a PPTX file.

## Instructions

1. First run validation: \`npm run validate\`
2. If validation passes, run: \`npm run save\`
3. Report the result to the user

If there are validation errors, list them and offer to help fix them.
`,

    "validate.md": `# Validate Presentation

Check all XML files for validity.

## Instructions

Run: \`npm run validate\`

Report the results:
- If all validations pass, confirm success
- If there are errors, list each error with its file location
- If there are warnings, list them but note they won't prevent saving
- Offer to help fix any issues found
`,

    "preview.md": `# Generate Preview

Generate PNG preview images of the slides.

## Instructions

1. Run: \`npm run preview\`
2. If successful, the previews will be in the \`preview/\` folder
3. Read the preview images to see the current state of slides

Note: This requires LibreOffice to be installed. If not available, inform the user how to install it.
`,

    "add-slide.md": `# Add New Slide

Add a new slide to the presentation.

## Instructions

1. Determine the next slide number by checking existing slides in \`work/ppt/slides/\`
2. Create a new slide XML file based on an existing slide structure
3. Add the slide relationship to \`work/ppt/_rels/presentation.xml.rels\`
4. Update \`work/ppt/presentation.xml\` to include the new slide in the slide list
5. Run validation to ensure everything is correct

Ask the user what content they want on the new slide.
`,

    "edit-slide.md": `# Edit Slide

Edit the content of a specific slide.

## Instructions

1. Ask the user which slide number to edit (or they may have specified it)
2. Read the slide XML from \`work/ppt/slides/slideN.xml\`
3. Locate the text elements (\`<a:t>\` tags) and shapes
4. Make the requested changes
5. Run validation after editing

Common edits:
- Change text content in \`<a:t>\` tags
- Modify shape positions in \`<a:xfrm>\` elements
- Update colors and styles
`,
  };
}

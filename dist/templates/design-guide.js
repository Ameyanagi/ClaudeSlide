export function generateDesignGuide() {
    return `# Design Inspiration & XML Reference

This guide provides inspiration and practical XML examples. Use your creativity - these are starting points, not rules.

## What Makes a Slide Memorable?

Ask yourself:
- **Would I screenshot this?** Great slides are worth sharing
- **Can I get the message in 3 seconds?** If not, simplify
- **Is there a clear focal point?** The eye should know where to go
- **Does it feel fresh?** Avoid the "corporate template" look

## Layout Inspiration

### Break Free from Center-Alignment
Instead of centering everything, try:
- **Bold asymmetry**: Large element on left, supporting content on right
- **Dramatic white space**: Let one powerful element breathe
- **Diagonal flow**: Guide the eye from top-left to bottom-right
- **Full-bleed images**: Let visuals dominate

### Transform Bullet Points Into:
- Diagrams showing relationships
- Icon grids with minimal text
- Process flows with connected shapes
- Large numbers/stats with context below
- Split-screen comparisons

## Color Ideas

**Bold & Modern**: Dark backgrounds (#1a1a2e, #16213e) with bright accents (#e94560, #0f3460)

**Clean & Professional**: White/light gray with one strong accent color

**Warm & Inviting**: Cream backgrounds with terracotta, forest green, or navy

**High Contrast**: Black and white with a single pop of color

Trust your eye - if colors clash or feel dated, change them.

## XML Quick Reference

### Positioning (EMU units)
1 inch = 914400 EMU | Standard slide: 9144000 x 6858000 EMU

### Text with Style
\`\`\`xml
<a:r>
  <a:rPr lang="en-US" sz="4800" b="1">
    <a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill>
  </a:rPr>
  <a:t>Bold 48pt white text</a:t>
</a:r>
\`\`\`

### Shape with Color Fill
\`\`\`xml
<p:sp>
  <p:nvSpPr>
    <p:cNvPr id="4" name="Rectangle"/>
    <p:cNvSpPr/>
    <p:nvPr/>
  </p:nvSpPr>
  <p:spPr>
    <a:xfrm>
      <a:off x="0" y="0"/>
      <a:ext cx="4572000" cy="6858000"/>
    </a:xfrm>
    <a:prstGeom prst="rect"/>
    <a:solidFill>
      <a:srgbClr val="1a1a2e"/>
    </a:solidFill>
  </p:spPr>
</p:sp>
\`\`\`

### Semi-Transparent Overlay
\`\`\`xml
<a:solidFill>
  <a:srgbClr val="000000">
    <a:alpha val="50000"/>  <!-- 50% opacity -->
  </a:srgbClr>
</a:solidFill>
\`\`\`

### Large Impact Number
\`\`\`xml
<p:txBody>
  <a:bodyPr anchor="ctr"/>
  <a:p>
    <a:pPr algn="l"/>
    <a:r>
      <a:rPr lang="en-US" sz="14400" b="1">
        <a:solidFill><a:srgbClr val="e94560"/></a:solidFill>
      </a:rPr>
      <a:t>73%</a:t>
    </a:r>
  </a:p>
</p:txBody>
\`\`\`

### Rotated Accent Shape
\`\`\`xml
<a:xfrm rot="2700000">  <!-- 45 degrees = 2700000 -->
  <a:off x="7620000" y="0"/>
  <a:ext cx="2743200" cy="457200"/>
</a:xfrm>
\`\`\`

## SVG for Diagrams & Illustrations

Write SVG code directly for flowcharts, diagrams, icons, and illustrations.

### SVG Basics
\`\`\`xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
  <!-- Your graphics here -->
</svg>
\`\`\`

### Example: Flowchart with Arrows
\`\`\`xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 200">
  <!-- Boxes -->
  <rect x="50" y="60" width="150" height="80" rx="10" fill="#3b82f6"/>
  <rect x="325" y="60" width="150" height="80" rx="10" fill="#8b5cf6"/>
  <rect x="600" y="60" width="150" height="80" rx="10" fill="#10b981"/>

  <!-- Arrows -->
  <path d="M200 100 L325 100" stroke="#64748b" stroke-width="3" marker-end="url(#arrow)"/>
  <path d="M475 100 L600 100" stroke="#64748b" stroke-width="3" marker-end="url(#arrow)"/>

  <!-- Arrow marker -->
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b"/>
    </marker>
  </defs>

  <!-- Labels -->
  <text x="125" y="108" text-anchor="middle" fill="white" font-size="16" font-weight="bold">Step 1</text>
  <text x="400" y="108" text-anchor="middle" fill="white" font-size="16" font-weight="bold">Step 2</text>
  <text x="675" y="108" text-anchor="middle" fill="white" font-size="16" font-weight="bold">Step 3</text>
</svg>
\`\`\`

### Example: Custom Icon
\`\`\`xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="45" fill="#3b82f6"/>
  <path d="M30 50 L45 65 L70 35" stroke="white" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
\`\`\`

### SVG Tips
- Use \`viewBox\` for scalable graphics
- \`rx\` on rectangles creates rounded corners
- Gradients: \`<linearGradient>\` and \`<radialGradient>\`
- Groups: \`<g>\` to organize and transform elements

### Embedding SVG
1. Save to \`work/ppt/media/imageN.svg\`
2. Add to \`[Content_Types].xml\`: \`<Default Extension="svg" ContentType="image/svg+xml"/>\`
3. Add relationship in slide's \`_rels/slideN.xml.rels\`
4. Reference in slide XML

---

## Seaborn/Matplotlib for Data Charts

For data-driven charts, use Python with seaborn. **Always write the script to a file first**, then run it.

### Workflow
1. Write Python script to \`scripts/chart_name.py\`
2. Run: \`uv run --with matplotlib --with seaborn --with numpy python scripts/chart_name.py\`
3. Output goes to \`work/ppt/media/\`

### Example: Bar Chart

Write to \`scripts/bar_chart.py\`:
\`\`\`python
import seaborn as sns
import matplotlib.pyplot as plt

sns.set_style('whitegrid')
plt.figure(figsize=(10, 6))
sns.barplot(x=['Q1', 'Q2', 'Q3', 'Q4'], y=[25, 40, 35, 55], palette='viridis')
plt.title('Quarterly Revenue', fontsize=18, fontweight='bold')
plt.ylabel('Revenue (M)')
plt.savefig('work/ppt/media/bar_chart.png', dpi=300, bbox_inches='tight', transparent=True)
plt.close()
\`\`\`

Then run: \`uv run --with matplotlib --with seaborn --with numpy python scripts/bar_chart.py\`

### Example: Line Chart

Write to \`scripts/line_chart.py\`:
\`\`\`python
import seaborn as sns
import matplotlib.pyplot as plt
import numpy as np

sns.set_style('whitegrid')
plt.figure(figsize=(10, 6))
x = np.arange(1, 13)
y = [10, 15, 13, 18, 22, 25, 28, 32, 30, 35, 40, 45]
plt.plot(x, y, marker='o', linewidth=2, color='#3b82f6')
plt.title('Monthly Growth', fontsize=18, fontweight='bold')
plt.xlabel('Month')
plt.ylabel('Users (K)')
plt.savefig('work/ppt/media/line_chart.png', dpi=300, bbox_inches='tight', transparent=True)
plt.close()
\`\`\`

### Example: Pie Chart

Write to \`scripts/pie_chart.py\`:
\`\`\`python
import matplotlib.pyplot as plt

plt.figure(figsize=(8, 8))
sizes = [35, 25, 20, 20]
labels = ['Product A', 'Product B', 'Product C', 'Other']
colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b']
plt.pie(sizes, labels=labels, colors=colors, autopct='%1.0f%%', startangle=90)
plt.title('Market Share', fontsize=18, fontweight='bold')
plt.savefig('work/ppt/media/pie_chart.png', dpi=300, bbox_inches='tight', transparent=True)
plt.close()
\`\`\`

### Tips for Great Charts
- **Always \`plt.close()\`** at the end to free memory
- Use \`transparent=True\` for clean slide integration
- \`dpi=300\` ensures crisp quality
- \`bbox_inches='tight'\` removes excess whitespace
- Seaborn palettes: 'viridis', 'Blues', 'husl', 'Set2'

## Quick Wins for Better Slides

1. **Increase font size** - If in doubt, go bigger
2. **Reduce text** - Cut half, then cut half again
3. **Add white space** - Don't fill every corner
4. **One idea per slide** - Split complex slides
5. **Use contrast** - Make important things stand out

---

*These are tools, not rules. Trust your creative instincts.*
`;
}
//# sourceMappingURL=design-guide.js.map
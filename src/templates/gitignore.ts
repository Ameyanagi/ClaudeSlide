export function generateGitignore(): string {
  return `# ClaudeSlide
*.pptx
!source.pptx
preview/

# Node
node_modules/

# OS
.DS_Store
Thumbs.db
`;
}

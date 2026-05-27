const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const outputFile = path.join(__dirname, 'project_code.md');

function getTsxFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const itemPath = path.join(dir, item);
    if (fs.statSync(itemPath).isDirectory()) {
      getTsxFiles(itemPath, files);
    } else if (item.endsWith('.tsx')) {
      files.push(itemPath);
    }
  }
  return files;
}

const tsxFiles = getTsxFiles(srcDir);
let markdownContent = '# Project Code Dump\n\n';

for (const file of tsxFiles) {
  const relativePath = path.relative(srcDir, file);
  const content = fs.readFileSync(file, 'utf8');
  markdownContent += `## ${relativePath}\n\n\`\`\`tsx\n${content}\n\`\`\`\n\n`;
}

fs.writeFileSync(outputFile, markdownContent);
console.log(`Saved all tsx files to ${outputFile}`);

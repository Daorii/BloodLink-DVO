const fs = require('fs');
const path = require('path');
const dir = path.join(process.cwd(), 'src/pages');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  let newContent = content.replace(/<button[^>]+>/gi, (match) => {
    return match.replace(/rounded-(lg|xl|md|sm|2xl)/g, 'rounded-full');
  });

  newContent = newContent.replace(/<Link[^>]+>/gi, (match) => {
    if (match.includes('bg-') || match.includes('border') || match.includes('hover:bg-')) {
      return match.replace(/rounded-(lg|xl|md|sm|2xl)/g, 'rounded-full');
    }
    return match;
  });

  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log('Updated buttons in', file);
  }
});

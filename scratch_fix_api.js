const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const original = content;

      content = content.replace(/process\.env\.REACT_APP_API_URL/g, "import.meta.env.VITE_API_URL");
      
      content = content.replace(/(['"\`])http:\/\/localhost:3000(.*?)\1/g, (match, quote, pathPart) => {
        return "\`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}" + pathPart + "\`";
      });

      if (content !== original) {
        fs.writeFileSync(fullPath, content);
        console.log('Updated', fullPath);
      }
    }
  }
}
processDir('c:/Guidewire_Devtrails/PayMigo_Final/Paymigo_Frontend/web/src');
console.log("Done");

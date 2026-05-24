const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        if (file === 'node_modules' || file === '.git' || file === 'utils') return;
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(filePath));
        } else if (file.endsWith('.js')) {
            results.push(filePath);
        }
    });
    return results;
}

const jsFiles = walk(__dirname);
let totalReplacements = 0;

jsFiles.forEach(file => {
    // Skip external libraries if any
    if (file.includes('purify.min.js') || file.includes('update_html.js') || file.includes('security.js')) return;

    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;

    // Match cases like: element.innerHTML = Security.sanitizeHTML(`<div>${user}</div>`);
    // We want to wrap the right hand side in Security.sanitizeHTML(...)
    // Regex matches .innerHTML = Security.sanitizeHTML(`something`)
    // We have to be careful with template literals that might contain nested backticks, though JS doesn't support them easily.
    // A simpler approach is to use the TypeScript compiler API or Babel, but a regex for backticks might work if they are balanced.
    // Let's use a simpler approach for known patterns.
    
    // Pattern for template literals
    const regexTemplate = /\.innerHTML\s*=\s*(`[^`]*`)/g;
    content = content.replace(regexTemplate, '.innerHTML = Security.sanitizeHTML($1)');

    // Pattern for single/double quotes, simple cases
    // .innerHTML = "string" or .innerHTML = 'string'
    // Actually, simple static strings are mostly safe, but DOMPurify is fast enough.
    // Let's also wrap string concatenations if possible, or just ignore for now since the prompt specifically mentions:
    // "Los campos de texto libre... son el vector. Un atacante inyecta <script>..."
    // In our codebase, most HTML templates are built with template literals `...`.

    if (content !== originalContent) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Sanitized innerHTML in ${file}`);
        totalReplacements++;
    }
});

console.log(`Total JS files sanitized: ${totalReplacements}`);

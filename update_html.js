const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        if (file === 'node_modules' || file === '.git') return;
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(filePath));
        } else if (file.endsWith('.html')) {
            results.push(filePath);
        }
    });
    return results;
}

const htmlFiles = walk(__dirname);
htmlFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;

    if (!content.includes('Content-Security-Policy')) {
        const csp = '<meta http-equiv="Content-Security-Policy" content="default-src \'self\' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://www.gstatic.com https://firestore.googleapis.com https://firebasestorage.googleapis.com https://identitytoolkit.googleapis.com; img-src \'self\' data: https:; style-src \'self\' \'unsafe-inline\' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://fonts.googleapis.com; font-src \'self\' https://cdnjs.cloudflare.com https://fonts.gstatic.com; script-src \'self\' \'unsafe-inline\' \'unsafe-eval\' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://www.gstatic.com;">';
        content = content.replace('<head>', '<head>\n  ' + csp);
        modified = true;
    }

    if (!content.includes('purify.min.js')) {
        const purify = '<script src="https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.0.6/purify.min.js"></script>';
        content = content.replace('</head>', '  ' + purify + '\n</head>');
        modified = true;
    }

    if (!content.includes('security.js')) {
        const dirName = path.basename(path.dirname(file));
        const inSubdir = ['User', 'Empresa', 'Admin'].includes(dirName);
        const relPath = inSubdir ? '../utils/security.js' : 'utils/security.js';
        const secScript = `<script src="${relPath}"></script>`;
        content = content.replace('</head>', '  ' + secScript + '\n</head>');
        modified = true;
    }

    if (modified) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated ${file}`);
    }
});

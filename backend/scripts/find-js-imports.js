const fs = require('fs');
const path = require('path');

function walk(dir) {
  fs.readdirSync(dir).forEach(f => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      walk(p);
    } else if (p.endsWith('.ts')) {
      const c = fs.readFileSync(p, 'utf8');
      const lines = c.split('\n');
      lines.forEach((line, i) => {
        const fromMatch = line.match(/from\s+['"]([^'"]+\.js)['"]/);
        const requireMatch = line.match(/require\s*\(\s*['"]([^'"]+\.js)['"]\s*\)/);
        if (fromMatch) {
          console.log(p + ':' + (i+1) + ' - ' + fromMatch[0]);
        }
        if (requireMatch) {
          console.log(p + ':' + (i+1) + ' - ' + requireMatch[0]);
        }
      });
    }
  });
}

walk(path.join(__dirname, '..', 'src'));
console.log('VERIFICACAO_CONCLUIDA');
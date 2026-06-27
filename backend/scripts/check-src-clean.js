/**
 * check-src-clean.js
 * 
 * Verifica se existem arquivos compilados (.js, .d.ts, .js.map)
 * dentro de backend/src/. Deve falhar (exit code 1) se encontrar.
 * 
 * Uso: node scripts/check-src-clean.js
 */

const fs = require('fs');
const path = require('path');
const SRC_DIR = path.join(__dirname, '..', 'src');
const FORBIDDEN_EXTENSIONS = ['.js', '.d.ts', '.js.map'];

const found = [];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
    } else if (entry.isFile()) {
      const ext = FORBIDDEN_EXTENSIONS.find(e => entry.name.endsWith(e));
      if (ext) {
        found.push(fullPath);
      }
    }
  }
}

if (!fs.existsSync(SRC_DIR)) {
  console.error('ERRO: Diretório src/ não encontrado em', SRC_DIR);
  process.exit(1);
}

walk(SRC_DIR);

if (found.length > 0) {
  console.error('============================================');
  console.error('  ERRO: Arquivos compilados encontrados em src/');
  console.error('  Eles NÃO deveriam estar versionados.');
  console.error('============================================');
  console.error('');
  found.forEach(f => {
    const relative = path.relative(path.join(__dirname, '..'), f);
    console.error('  - ' + relative);
  });
  console.error('');
  console.error('Execute: node scripts/clean-src.js  (para removê-los)');
  console.error('============================================');
  process.exit(1);
} else {
  console.log('✅ src/ está limpo — nenhum arquivo compilado encontrado.');
  process.exit(0);
}
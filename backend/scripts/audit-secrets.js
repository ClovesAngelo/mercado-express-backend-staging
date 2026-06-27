/**
 * audit-secrets.js
 * 
 * Auditoria de segredos no repositório.
 * Busca por padrões de secrets em arquivos-chave.
 * Mascara valores encontrados (mostra apenas primeiros 4 + últimos 4 caracteres).
 */
const fs = require('fs');
const path = require('path');

const patterns = [
  { name: 'JWT_SECRET', re: /JWT_SECRET\s*=\s*['"]?([^'"\n]+)/gi },
  { name: 'SUPABASE_SERVICE_ROLE_KEY', re: /SUPABASE_SERVICE_ROLE_KEY\s*=\s*['"]?([^'"\n]+)/gi },
  { name: 'SUPABASE_ANON_KEY', re: /SUPABASE_ANON_KEY\s*=\s*['"]?([^'"\n]+)/gi },
  { name: 'DATABASE_URL', re: /DATABASE_URL\s*=\s*['"]?([^'"\n]+)/gi },
  { name: 'SUPABASE_URL', re: /SUPABASE_URL\s*=\s*['"]?([^'"\n]+)/gi },
  { name: 'postgresql_url', re: /(postgresql?:\/\/[^\s'"#]+)/gi },
  { name: 'jwt_token_eyJ', re: /(eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+)/gi },
  { name: 'senha_password', re: /(?:password|senha)\s*[:=]\s*['"]?([^'"\n,;]+)/gi },
  { name: 'secret_key', re: /(?:secret|key|token)\s*[:=]\s*['"]?([^'"\n,;]{10,})/gi },
];

function maskValue(val) {
  if (!val || val.length < 8) return '***';
  return val.substring(0, 4) + '...' + val.substring(val.length - 4);
}

const rootDir = path.join(__dirname, '..');
const filesToAudit = [
  'backend/.env',
  'frontend/.env',
  'backend/.env.example',
  'frontend/.env.example',
  '.env.staging.example',
  'backend/prisma/seed.ts',
  'backend/src/main.ts',
  'backend/src/auth/auth.module.ts',
  'backend/src/auth/jwt.strategy.ts',
  'backend/src/upload/upload.service.ts',
  'frontend/src/services/api.ts',
  'frontend/src/services/supabase.ts',
  'backend/src/upload/upload.module.ts',
  'FIXES_APPLIED.md',
  'RELATORIO_ANALISE_ERROS.md',
  'AUDITORIA_INDEPENDENTE.md',
  'RELATORIO_PRE_STAGING.md',
];

console.log('=== AUDITORIA DE SEGREDOS ===\n');

filesToAudit.forEach(relPath => {
  const fullPath = path.join(rootDir, relPath);
  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    patterns.forEach(pattern => {
      let match;
      // Reset regex
      pattern.re.lastIndex = 0;
      while ((match = pattern.re.exec(content)) !== null) {
        const lineNum = content.substring(0, match.index).split('\n').length;
        const value = match[1] || match[0];
        const masked = maskValue(value);
        console.log(`${relPath}:${lineNum} | ${pattern.name} = ${masked}`);
      }
    });
  } catch (e) {
    // file not found or unreadable, skip
  }
});

console.log('\n=== AUDITORIA_CONCLUIDA ===');
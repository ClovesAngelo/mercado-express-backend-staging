# SECURITY_ENV_GUIDE — Guia de Segurança de Variáveis de Ambiente

**Data:** 25/06/2026
**Projeto:** Mercado Express

---

## 1. GERANDO SECRETS FORTES

### JWT_SECRET

Use um dos comandos abaixo para gerar uma chave forte (64 bytes hex):

**Node.js:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**OpenSSL:**
```bash
openssl rand -hex 64
```

**PowerShell:**
```powershell
[System.Convert]::ToHexString((1..64|%{[byte](Get-Random -Min 0 -Max 256)}))
```

**Exemplo de saída:**
```
a1b2c3d4e5f6789012345678abcdef0123456789abcdef0123456789abcdef0123
```

### Regras para JWT_SECRET:
- ✅ Mínimo **32 caracteres** (recomendado: 64+)
- ✅ **Diferente por ambiente** (dev, staging, production)
- ✅ Gerada com `crypto.randomBytes` ou `openssl rand`
- ❌ **Nunca** usar valor fixo, conhecido ou adivinhável
- ❌ **Nunca** commitar em repositório

---

## 2. SUPABASE — SERVICE ROLE KEY

### ⚠️ ATENÇÃO: SE EXPOSA, PRECISA ROTACIONAR

Se a `SUPABASE_SERVICE_ROLE_KEY` foi exposta em commit, siga:

#### Procedimento de Rotação:

1. **Acessar Supabase Dashboard:**
   - https://supabase.com/dashboard/project/[SEU_PROJECT_ID]/settings/api

2. **Localizar "Project API keys":**
   - `anon public` — chave pública (pode ficar no frontend)
   - `service_role` — **chave privada** (NUNCA no frontend)

3. **Clicar em "Reveal" e depois "Reset":**
   - Gere uma nova chave
   - A chave antiga será **imediatamente invalidada**

4. **Atualizar ambientes:**
   - `backend/.env` local
   - Dashboard de deploy (Railway, Render, Fly.io, etc.)
   - Arquivo `.env.staging` (NUNCA commitar)

5. **Verificar:**
   - Upload de imagens continua funcionando
   - Autenticação Supabase continua funcionando
   - Logs de erro mostram novo token

### Service Role Key NUNCA deve:
- ❌ Estar no frontend (`VITE_*`)
- ❌ Ser commitada no repositório
- ❌ Estar em arquivos de exemplo
- ❌ Ser compartilhada em chats ou issues

---

## 3. VARIÁVEIS DE AMBIENTE — BACKEND

### Obrigatórias (app não inicia sem elas):

| Variável | Onde obter | Exemplo (placeholder) |
|----------|-----------|----------------------|
| `DATABASE_URL` | Supabase > Project Settings > Database | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | Gerar localmente (ver seção 1) | `a1b2c3d4...` (64 chars hex) |
| `SUPABASE_URL` | Supabase > Project Settings > API | `https://xxxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase > Project Settings > API > service_role | `eyJhbGciOiJ...` |

### Opcionais:

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `PORT` | `3000` | Porta do servidor |
| `CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Origens permitidas (CORS) |
| `NODE_ENV` | `development` | Ambiente (`development`, `staging`, `production`) |

---

## 4. VARIÁVEIS DE AMBIENTE — FRONTEND (Vite)

### Regras:
- ✅ Variáveis públicas: prefixo `VITE_`
- ❌ **Nunca** colocar `SUPABASE_SERVICE_ROLE_KEY` no frontend
- ✅ `SUPABASE_ANON_KEY` é **pública** e pode ficar no frontend

### Variáveis:

| Variável | Obrigatória? | Descrição |
|----------|-------------|-----------|
| `VITE_API_URL` | ✅ Sim | URL da API backend (ex: `http://localhost:3000`) |
| `VITE_SUPABASE_URL` | ✅ Sim | URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | ✅ Sim | Chave anônima Supabase (pública) |

---

## 5. BOAS PRÁTICAS

### Nunca commitar:
- ❌ `.env` (arquivo real com secrets)
- ❌ `*.env.local`
- ❌ `*.env.staging` (com valores reais)
- ❌ Chaves de API
- ❌ Tokens de acesso
- ❌ Senhas de banco de dados

### Sempre commitar:
- ✅ `.env.example` (com placeholders seguros)
- ✅ `.env.staging.example` (com placeholders ou vazio)

### Fluxo seguro:
1. Copiar `.env.example` → `.env`
2. Preencher valores reais
3. **Nunca** commitar o `.env`
4. Em deploy, configurar secrets no painel da plataforma

### Rotacionar se vazar:
- JWT_SECRET → gerar novo, todos os tokens existentes perdem validade
- SUPABASE_SERVICE_ROLE_KEY → resetar no dashboard Supabase
- DATABASE_URL → resetar senha no banco

---

## 6. VERIFICAÇÃO RÁPIDA

```bash
# Verificar se .env tem valores reais (vs placeholders)
grep -n "SECRET\|KEY\|PASSWORD\|DATABASE_URL" .env

# Verificar se .env está no .gitignore
grep ".env" .gitignore

# Verificar se há secrets commitados
grep -r "eyJh\|postgresql://" --include="*.ts" --include="*.md" src/
```

---

## 7. CHECKLIST DE SEGURANÇA PARA STAGING/PRODUÇÃO

- [ ] `JWT_SECRET` forte e diferente por ambiente
- [ ] `SUPABASE_SERVICE_ROLE_KEY` protegida e não commitada
- [ ] `DATABASE_URL` com senha forte
- [ ] `CORS_ORIGINS` configurado com domínios reais
- [ ] `.env` no `.gitignore`
- [ ] Variáveis configuradas como secrets no deploy
- [ ] Service role key NÃO está no frontend
- [ ] Nenhum secret real em arquivos versionados
- [ ] Logs não expõem secrets
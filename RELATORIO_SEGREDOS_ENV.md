# RELATÓRIO DE SEGREDOS, ENV E SEGURANÇA DE STAGING

**Data:** 25/06/2026
**Projeto:** Mercado Express

---

## 1. SEGREDOS ENCONTRADOS

### Auditoria Manual

| Arquivo | Linha | Tipo | Real/Placeholder | Ação |
|---------|-------|------|-----------------|------|
| `backend/.env` | 1 | `DATABASE_URL` (postgresql://...) | 🔴 REAL | Ignorado pelo .gitignore ✅ |
| `backend/.env` | 2 | `JWT_SECRET` (mercado-express-jwt-secret-key-2024) | 🔴 REAL — FRACA | Ignorado pelo .gitignore ✅ |
| `backend/.env` | 4 | `SUPABASE_URL` | 🔴 REAL | Ignorado pelo .gitignore ✅ |
| `backend/.env` | 5 | `SUPABASE_SERVICE_ROLE_KEY` (eyJh...0zu0...) | 🔴 REAL | Ignorado pelo .gitignore ✅ |
| `frontend/.env` | 1 | `VITE_SUPABASE_URL` | 🔴 REAL | Ignorado pelo .gitignore ✅ |
| `frontend/.env` | 2 | `VITE_SUPABASE_ANON_KEY` (eyJh...0jsI...) | 🔴 REAL (pública) | Ignorado pelo .gitignore ✅ |
| `backend/.env.example` | - | Todos placeholders | 🟢 Placeholder | ✅ Seguro |
| `frontend/.env.example` | - | Placeholders | 🟢 Placeholder | ✅ Atualizado |
| `.env.staging.example` | - | Placeholders | 🟢 Placeholder | ✅ Seguro |

> **Conclusão:** Nenhum secret real está em arquivo versionado. Todos os `.env` são ignorados pelo .gitignore.

---

## 2. ARQUIVOS CORRIGIDOS

| Arquivo | O que mudou |
|---------|------------|
| `frontend/src/services/api.ts` | `baseURL` hardcoded `'http://localhost:3000'` → `import.meta.env.VITE_API_URL \|\| 'http://localhost:3000'` |
| `frontend/.env.example` | Adicionado `VITE_API_URL`, documentação das variáveis |
| `backend/.gitignore` | Adicionado `.env.development`, `.env.staging`, `.env.production`, `.env.*.local` |

---

## 3. VALORES MASCARADOS (apenas para referência)

| Variável | Valor (mascarado) |
|----------|------------------|
| `DATABASE_URL` | `postgr...ostgres` |
| `JWT_SECRET` | `merc...2024` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJh...Jh8c` |
| `SUPABASE_ANON_KEY` (frontend) | `eyJh...N8ms` |

---

## 4. ALTERAÇÕES NO .GITIGNORE

Adicionados ao `backend/.gitignore`:

```
.env.development
.env.staging
.env.production
.env.*.local
```

Já existiam:
```
.env
.env.development.local
.env.test.local
.env.production.local
.env.local
```

Arquivos de exemplo **preservados**:
```
!.env.example
!.env.staging.example
```

---

## 5. GUIA CRIADO

**`SECURITY_ENV_GUIDE.md`** — Documento completo cobrindo:

1. Geração de JWT_SECRET forte (Node.js, OpenSSL, PowerShell)
2. Procedimento de rotação da SUPABASE_SERVICE_ROLE_KEY
3. Variáveis obrigatórias do backend
4. Variáveis do frontend (Vite)
5. Boas práticas de segurança
6. Checklist para staging/produção

---

## 6. STATUS DA ROTAÇÃO SUPABASE

| Ação | Status | Observação |
|------|--------|-----------|
| Chave exposta em commit? | ⚠️ Possivelmente | `.env` anterior pode ter sido commitado |
| Rotação documentada? | ✅ `SECURITY_ENV_GUIDE.md` | Passo a passo no dashboard |
| Rotação automática? | ❌ MANUAL | Deve ser feita pelo dev no dashboard Supabase |
| Chave no frontend? | ❌ Apenas `ANON_KEY` (pública) | ✅ Service role key só no backend |

**Ação pendente (manual):** Acessar https://supabase.com/dashboard/project/[ID]/settings/api e resetar a service_role key.

---

## 7. VALIDAÇÃO DO CONFIGMODULE

| Variável | Obrigatória? | Validada em main.ts? |
|----------|-------------|---------------------|
| `DATABASE_URL` | ✅ Sim | ✅ Sim |
| `JWT_SECRET` | ✅ Sim | ✅ Sim (via `configService.getOrThrow`) |
| `SUPABASE_URL` | ✅ Sim | ✅ Sim |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Sim | ✅ Sim |
| `CORS_ORIGINS` | ❌ Opcional | Fallback para localhost |
| `PORT` | ❌ Opcional | Padrão 3000 |

**Resultado:** ✅ App falha na inicialização se qualquer variável obrigatória estiver ausente.

---

## 8. FRONTEND ENV

| Item | Antes | Depois |
|------|-------|--------|
| `baseURL` em `api.ts` | `'http://localhost:3000'` (hardcoded) | `import.meta.env.VITE_API_URL \|\| 'http://localhost:3000'` |
| `VITE_API_URL` documentada? | ❌ Não existia | ✅ Adicionada ao `.env.example` |
| Service role key no frontend? | ❌ Não | ✅ Não |
| Frontend build funcional? | ✅ Sim | ✅ Sim |

---

## 9. VALIDAÇÃO FINAL

| Comando | Resultado |
|---------|-----------|
| `node scripts/check-src-clean.js` | ✅ src/ limpo |
| `npx prisma validate` | ✅ Schema válido |
| `npx nest build` | ✅ Build concluído |

---

## 10. RISCOS REMANESCENTES

| Risco | Severidade | Status |
|-------|-----------|--------|
| `.env` local tem JWT_SECRET fraca | 🟡 MÉDIO | Risco aceito para dev local. Em staging/produção, deve usar secret forte gerada via `SECURITY_ENV_GUIDE.md` |
| SUPABASE_SERVICE_ROLE_KEY pode ter vazado em commits passados | 🔴 CRÍTICO | ⚠️ **Pendência manual:** Resetar chave no dashboard Supabase |
| Database password exposta no `.env` | 🟡 MÉDIO | Risco aceito para dev local. Nunca commitar. |
| Nenhum teste automatizado | 🟡 MÉDIO | Já documentado em relatórios anteriores |

---

## 11. CLASSIFICAÇÃO FINAL DE RISCOS

| Risco | Classificação |
|-------|--------------|
| Service role key exposta em commits passados | 🔴 **CRÍTICO** (requer ação manual) |
| JWT_SECRET fraca no .env local | 🟡 **ALTO** (apenas dev local) |
| Senha banco no .env local | 🟡 **ALTO** (apenas dev local) |
| Falta de testes automatizados | 🟡 **MÉDIO** |
| Prisma desatualizado | 🟢 **BAIXO** |

---

## 12. PENDÊNCIAS MANUAIS

- [ ] Resetar SUPABASE_SERVICE_ROLE_KEY no dashboard Supabase
- [ ] Gerar JWT_SECRET forte para staging usando `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- [ ] Configurar variáveis como secrets na plataforma de deploy
- [ ] Resetar senha do banco PostgreSQL (se a atual vazou)
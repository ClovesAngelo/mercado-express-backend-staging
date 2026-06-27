# MERCADO EXPRESS — DEPLOY STAGING CLOUD

## FASE 1 — PLATAFORMAS ESCOLHIDAS

**Backend:** Render
**Frontend:** Vercel
**Banco/Storage:** Supabase

Justificativa: Opções mais simples e com bom suporte a Node.js/NestJS.

---

## FASE 2 — BACKEND: CONFIGURAÇÃO ATUAL

O `backend/package.json` já contém todos os scripts necessários:

```json
{
  "build": "tsc --project tsconfig.build.json",
  "start:prod": "node dist/main",
  "prisma:generate": "prisma generate",
  "prisma:migrate:deploy": "prisma migrate deploy"
}
```

Nenhuma alteração necessária no package.json.

---

## FASE 3 — VARIÁVEIS DE AMBIENTE DO BACKEND (RENDER)

Configurar no Render (Settings → Environment):

```env
# Banco de dados Supabase
DATABASE_URL=postgresql://usuario:senha@host:5432/postgres?schema=public

# JWT
JWT_SECRET=<chave-secreta-forte-32-caracteres-minimo>

# Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=<anon-key-publica>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key-privada>

# CORS
CORS_ORIGINS=https://seu-frontend.vercel.app

# Servidor
NODE_ENV=staging
PORT=10000
```

**Regras:**
- `DATABASE_URL` deve apontar para o banco Supabase de staging
- `JWT_SECRET` deve ser forte (mínimo 32 caracteres)
- `SUPABASE_SERVICE_ROLE_KEY` deve ser rotacionada se já foi exposta
- `CORS_ORIGINS` deve incluir a URL real do frontend staging
- NÃO commitar `.env`
- NÃO imprimir secrets em relatórios

---

## FASE 4 — DEPLOY BACKEND NO RENDER

### Passo 1: Criar novo Web Service no Render

1. Acesse https://dashboard.render.com
2. Clique em "New +" → "Web Service"
3. Conecte seu repositório GitHub/GitLab
4. Selecione o repositório `Mercado_Express`

### Passo 2: Configurar o serviço

**Nome:** `mercado-express-backend-staging`

**Região:** Escolha a mais próxima (ex: São Paulo)

**Branch:** `main` (ou branch de staging)

**Root Directory:** `backend`

**Runtime:** `Node`

**Build Command:**
```bash
npm install && npx prisma generate && npx prisma migrate deploy && npm run build
```

**Start Command:**
```bash
npm run start:prod
```

**Plan:** Free ou Starter (para staging)

### Passo 3: Configurar variáveis de ambiente

Adicionar todas as variáveis listadas na Fase 3.

**IMPORTANTE:** A variável `DATABASE_URL` deve usar a connection string do Supabase.

### Passo 4: Deploy

1. Clique em "Create Web Service"
2. Aguarde o build completar
3. Monitore os logs

### Passo 5: Validar health checks

Após deploy, testar:

```bash
# Health live
curl https://mercado-express-backend-staging.onrender.com/health/live

# Health ready
curl https://mercado-express-backend-staging.onrender.com/health/ready
```

**Critério de sucesso:**
- Ambos retornam HTTP 200
- Logs não mostram senha/token/secret
- `migrate deploy` executou sem erro
- Backend não aponta para localhost

---

## FASE 5 — CONFIGURAR FRONTEND

### Arquivo `.env.staging` no frontend

Criar `frontend/.env.staging`:

```env
# URL do backend staging (será preenchida após deploy do backend)
VITE_API_URL=https://mercado-express-backend-staging.onrender.com
```

**Regras:**
- NÃO usar localhost
- NÃO colocar `DATABASE_URL`
- NÃO colocar `JWT_SECRET`
- NÃO colocar `SUPABASE_SERVICE_ROLE_KEY`
- NÃO colocar secrets privados

---

## FASE 6 — DEPLOY FRONTEND NO VERCEL

### Passo 1: Instalar Vercel CLI (opcional)

```bash
npm install -g vercel
```

### Passo 2: Deploy via Vercel Dashboard

1. Acesse https://vercel.com
2. Clique em "Add New..." → "Project"
3. Importe o repositório `Mercado_Express`

### Passo 3: Configurar o projeto

**Project Name:** `mercado-express-frontend-staging`

**Framework Preset:** Vite

**Root Directory:** `frontend`

**Build Command:**
```bash
npm run build
```

**Output Directory:** `dist`

### Passo 4: Configurar variáveis de ambiente

Em Settings → Environment Variables:

```
VITE_API_URL = https://mercado-express-backend-staging.onrender.com
```

**IMPORTANTE:** Apenas variáveis com prefixo `VITE_` são expostas ao frontend.

### Passo 5: Deploy

1. Clique em "Deploy"
2. Aguarde o build completar
3. Anote a URL do frontend (ex: `https://mercado-express-frontend-staging.vercel.app`)

### Passo 6: Validar frontend

1. Acesse a URL do Vercel
2. Abra o DevTools (F12)
3. Verifique:
   - Frontend abre sem erro crítico
   - Network chama `VITE_API_URL` (não localhost)
   - Não há erro de CORS
   - Login admin funciona

---

## FASE 7 — CONFIGURAR CORS FINAL

Após obter a URL real do frontend, atualizar no backend:

### Atualizar variável no Render

```env
CORS_ORIGINS=https://mercado-express-frontend-staging.vercel.app
```

Se quiser manter acesso local para desenvolvimento:

```env
CORS_ORIGINS=https://mercado-express-frontend-staging.vercel.app,http://localhost:5173
```

### Redeployar backend

1. No Render, clique em "Manual Deploy" → "Deploy latest commit"
2. Aguarde conclusão
3. Valide novamente os health checks

---

## FASE 8 — SMOKE TEST CLOUD

Executar o arquivo `STAGING_SMOKE_TEST_REAL.md` e preencher os 25 itens.

**Critério mínimo:**
- 22/25 aprovados
- 0 falhas críticas
- 0 vazamento de senha/token/secret

### Validações obrigatórias:

1. Health checks respondem 200
2. Login admin funciona
3. Página de gestores carrega
4. Mercado vinculado aparece
5. Dois gestores no mesmo mercado aparecem
6. Edição de gestor não desvincula outro
7. Gestão de mercados mostra múltiplos gestores
8. Upload de imagem funciona
9. Carrinho funciona
10. Checkout funciona
11. Pedido é criado
12. Status do pedido é alterado
13. `GET /markets` não retorna 429
14. Logs não expõem secrets

---

## FASE 9 — RELATÓRIO DE DEPLOY CLOUD

Criar `RELATORIO_DEPLOY_STAGING_CLOUD.md` com:

1. Plataforma backend usada
2. URL backend
3. Plataforma frontend usada
4. URL frontend
5. Resultado de `migrate deploy`
6. Resultado de `/health/live`
7. Resultado de `/health/ready`
8. Resultado do build backend
9. Resultado do build frontend
10. Resultado do smoke test
11. Bugs encontrados
12. Logs relevantes sem secrets
13. Decisão final:
   - APROVADO PARA TESTES DE USUÁRIO
   - APROVADO COM RESTRIÇÕES
   - REPROVADO

---

## PRÓXIMOS PASSOS

1. **Provisionar banco Supabase** (se ainda não existir)
2. **Executar Fase 4** (Deploy backend no Render)
3. **Executar Fase 6** (Deploy frontend no Vercel)
4. **Executar Fase 7** (Atualizar CORS)
5. **Executar Fase 8** (Smoke test)
6. **Executar Fase 9** (Relatório final)

---

## NOTAS IMPORTANTES

- NUNCA usar `prisma db push`
- NUNCA usar `migrate reset`
- NUNCA commitar `.env`
- NUNCA imprimir secrets
- NUNCA colocar service role key no frontend
- NUNCA deixar frontend chamando localhost
- NUNCA ignorar erro de CORS
- NUNCA marcar aprovado sem smoke test
- NUNCA chamar staging de produção

---

## CONTATOS E SUPORTE

- Render Docs: https://render.com/docs
- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
- Prisma Docs: https://www.prisma.io/docs
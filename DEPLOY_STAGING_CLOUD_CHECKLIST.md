# CHECKLIST EXECUTÁVEL — DEPLOY STAGING CLOUD

Use este checklist para executar o deploy passo a passo.

---

## ✅ PRÉ-REQUISITOS

- [ ] Conta no Render criada
- [ ] Conta no Vercel criada
- [ ] Conta no Supabase criada
- [ ] Código commitado no Git
- [ ] Node.js 18+ instalado

---

## 📋 FASE 1 — SUPABASE (5 min)

### 1.1 Criar projeto
- [ ] Acessei https://app.supabase.com
- [ ] Criei novo projeto `mercado-express-staging`
- [ ] Aguardei provisionamento (~2 min)

### 1.2 Obter credenciais
- [ ] Copiei `SUPABASE_URL`
- [ ] Copiei `SUPABASE_ANON_KEY`
- [ ] Copiei `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Copiei `DATABASE_URL` (connection string)

### 1.3 Criar bucket
- [ ] Acessei Storage no Supabase
- [ ] Criei bucket `market-images`
- [ ] Marquei como Public

### 1.4 Configurar RLS
- [ ] Abri SQL Editor no Supabase
- [ ] Executei os comandos SQL de RLS (ver DEPLOY_STAGING_CLOUD_GUIA.md)
- [ ] Verifiquei que não houve erro

### 1.5 Aplicar migrations (opcional)
```bash
cd backend
npx prisma migrate deploy
```
- [ ] Executei migrations
- [ ] Vi mensagem "5 migrations applied"

---

## 📋 FASE 2 — RENDER: BACKEND (10 min)

### 2.1 Criar Web Service
- [ ] Acessei https://dashboard.render.com
- [ ] Cliquei "New +" → "Web Service"
- [ ] Conectei repositório Git
- [ ] Selecionei `Mercado_Express`

### 2.2 Configurar serviço
- [ ] Name: `mercado-express-backend-staging`
- [ ] Region: São Paulo
- [ ] Branch: `main`
- [ ] Root Directory: `backend`
- [ ] Runtime: `Node`
- [ ] Build Command: `npm install && npx prisma generate && npx prisma migrate deploy && npm run build`
- [ ] Start Command: `npm run start:prod`
- [ ] Plan: Free

### 2.3 Configurar variáveis
Adicionei no Render (Settings → Environment Variables):

- [ ] `DATABASE_URL` = postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
- [ ] `JWT_SECRET` = [chave-forte-32+chars]
- [ ] `SUPABASE_URL` = https://[PROJECT_REF].supabase.co
- [ ] `SUPABASE_ANON_KEY` = [anon-key]
- [ ] `SUPABASE_SERVICE_ROLE_KEY` = [service-role-key]
- [ ] `CORS_ORIGINS` = http://localhost:5173,https://mercado-express-frontend-staging.vercel.app
- [ ] `NODE_ENV` = staging
- [ ] `PORT` = 10000

### 2.4 Deploy
- [ ] Cliquei "Create Web Service"
- [ ] Aguardei build (~3-5 min)
- [ ] Monitorei logs

**Logs esperados:**
```
✓ npm install OK
✓ prisma generate OK
✓ prisma migrate deploy OK (5 migrations applied)
✓ npm run build OK
✓ Application is running on port 10000
```

### 2.5 Validar health checks
```bash
curl https://mercado-express-backend-staging.onrender.com/health/live
curl https://mercado-express-backend-staging.onrender.com/health/ready
```

- [ ] Health live retornou 200
- [ ] Health ready retornou 200

### 2.6 Anotar URL
```
URL_BACKEND = https://mercado-express-backend-staging.onrender.com
```

---

## 📋 FASE 3 — VERCEL: FRONTEND (5 min)

### 3.1 Atualizar .env.staging
Editei `frontend/.env.staging`:
- [ ] `VITE_API_URL` = https://mercado-express-backend-staging.onrender.com

### 3.2 Criar projeto
- [ ] Acessei https://vercel.com
- [ ] Cliquei "Add New..." → "Project"
- [ ] Importei repositório `Mercado_Express`

### 3.3 Configurar projeto
- [ ] Project Name: `mercado-express-frontend-staging`
- [ ] Framework Preset: `Vite`
- [ ] Root Directory: `frontend`
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `dist`

### 3.4 Configurar variáveis
Adicionei no Vercel (Settings → Environment Variables):

- [ ] `VITE_API_URL` = https://mercado-express-backend-staging.onrender.com
- [ ] `VITE_SUPABASE_URL` = https://wlusqcxwqxdffeqegmiy.supabase.co
- [ ] `VITE_SUPABASE_ANON_KEY` = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

### 3.5 Deploy
- [ ] Cliquei "Deploy"
- [ ] Aguardei build (~2-3 min)
- [ ] Build concluído com sucesso

**Logs esperados:**
```
✓ npm install OK
✓ tsc -b OK
✓ vite build OK
✓ Build completed
```

### 3.6 Anotar URL
```
URL_FRONTEND = https://mercado-express-frontend-staging.vercel.app
```

### 3.7 Validar frontend
- [ ] Acessei URL do frontend
- [ ] Abri DevTools (F12)
- [ ] Frontend abre sem erro crítico
- [ ] Network chama `mercado-express-backend-staging.onrender.com` (NÃO localhost)
- [ ] Não há erro de CORS no console
- [ ] Testei login admin

---

## 📋 FASE 4 — CORS (2 min)

### 4.1 Atualizar CORS no Render
- [ ] Acessei Render Dashboard
- [ ] Abri `mercado-express-backend-staging`
- [ ] Fui em Settings → Environment Variables
- [ ] Editei `CORS_ORIGINS`
- [ ] Alterei para: `https://mercado-express-frontend-staging.vercel.app,http://localhost:5173`
- [ ] Cliquei "Save Changes"
- [ ] Aguardei redeploy automático (~2 min)

### 4.2 Validar CORS
```bash
curl -X OPTIONS https://mercado-express-backend-staging.onrender.com/api/auth/login \
  -H "Origin: https://mercado-express-frontend-staging.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

- [ ] Teste retornou HTTP 200
- [ ] Headers CORS corretos presentes

### 4.3 Testar login
- [ ] Acessei frontend novamente
- [ ] Fiz login com admin
- [ ] Sem erro de CORS

---

## 📋 FASE 5 — SMOKE TEST (15 min)

Abri `STAGING_SMOKE_TEST_REAL.md` e executei todos os 25 testes.

### Health Checks
- [ ] 1. GET /health/live retorna 200
- [ ] 2. GET /health/ready retorna 200

### Autenticação
- [ ] 3. Login admin funciona
- [ ] 4. Token JWT é recebido
- [ ] 5. Logout funciona

### Gestores
- [ ] 6. Página de gestores carrega
- [ ] 7. Mercado vinculado aparece
- [ ] 8. Dois gestores no mesmo mercado aparecem
- [ ] 9. Edição de gestor não desvincula outro
- [ ] 10. Gestão de mercados mostra múltiplos gestores

### Produtos
- [ ] 11. Lista de produtos carrega
- [ ] 12. Detalhe do produto carrega
- [ ] 13. Upload de imagem funciona

### Carrinho
- [ ] 14. Carrinho inicia vazio
- [ ] 15. Adicionar produto funciona
- [ ] 16. Quantidade é atualizada
- [ ] 17. Remover produto funciona
- [ ] 18. Total é calculado corretamente

### Checkout
- [ ] 19. Checkout carrega
- [ ] 20. Criar pedido funciona
- [ ] 21. Pedido é criado no banco

### Pedidos
- [ ] 22. Lista de pedidos carrega
- [ ] 23. Status do pedido é alterado
- [ ] 24. Detalhe do pedido carrega

### Performance
- [ ] 25. GET /markets não retorna 429

**Resultado:**
- [ ] 22/25 ou mais aprovados
- [ ] 0 falhas críticas
- [ ] 0 vazamento de secrets

---

## 📋 FASE 6 — VERIFICAÇÕES FINAIS (5 min)

### Segurança
- [ ] Logs do backend NÃO mostram senhas
- [ ] Logs do backend NÃO mostram tokens JWT
- [ ] Logs do backend NÃO mostram API keys
- [ ] Frontend NÃO chama localhost
- [ ] `.env` NÃO está commitado no git
- [ ] `SUPABASE_SERVICE_ROLE_KEY` NÃO está no frontend

### Funcionalidade
- [ ] Health checks respondem 200
- [ ] Login admin funciona
- [ ] Páginas carregam sem erro
- [ ] CORS não apresenta erros
- [ ] Banco de dados conecta
- [ ] Upload de imagens funciona
- [ ] Carrinho e checkout funcionam

---

## 📋 FASE 7 — RELATÓRIO (5 min)

Criei `RELATORIO_DEPLOY_STAGING_CLOUD.md` com:

- [ ] 1. Plataforma backend usada
- [ ] 2. URL backend
- [ ] 3. Plataforma frontend usada
- [ ] 4. URL frontend
- [ ] 5. Resultado de migrate deploy
- [ ] 6. Resultado de /health/live
- [ ] 7. Resultado de /health/ready
- [ ] 8. Resultado do build backend
- [ ] 9. Resultado do build frontend
- [ ] 10. Resultado do smoke test
- [ ] 11. Bugs encontrados
- [ ] 12. Logs relevantes sem secrets
- [ ] 13. Decisão final marcada

**Decisão:**
- [ ] APROVADO PARA TESTES DE USUÁRIO
- [ ] APROVADO COM RESTRIÇÕES
- [ ] REPROVADO

---

## 🎯 CRITÉRIO FINAL

O deploy só é considerado completo se TODOS os itens abaixo estiverem marcados:

- [ ] Backend publicado em cloud (Render)
- [ ] Frontend publicado em cloud (Vercel)
- [ ] Frontend chama backend cloud (não localhost)
- [ ] CORS funcionando
- [ ] Health checks públicos respondendo 200
- [ ] Migrations aplicadas com migrate deploy (5/5)
- [ ] Smoke test real executado (22/25+ aprovados)
- [ ] Relatório `RELATORIO_DEPLOY_STAGING_CLOUD.md` criado

---

## 🚨 AÇÕES OBRIGATÓRIAS ANTES DE MARCAR COMO APROVADO

1. **Rotacionar SUPABASE_SERVICE_ROLE_KEY** que foi exposta no backend/.env
2. **Verificar que .env não foi commitado** no git
3. **Confirmar que não há secrets nos logs**
4. **Testar login pelo menos 1 vez**
5. **Testar fluxo completo de compra pelo menos 1 vez**

---

## 📝 NOTAS

Adicione observações relevantes aqui:

```
[Data]: [Observação]
```

---

**Iniciado em:** ___/___/______
**Concluído em:** ___/___/______
**Responsável:** _________________
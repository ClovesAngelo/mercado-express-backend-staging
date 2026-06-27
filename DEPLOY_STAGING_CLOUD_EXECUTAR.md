# MERCADO EXPRESS — GUIA EXECUTÁVEL DE DEPLOY CLOUD

Este guia contém os comandos e ações exatas para executar o deploy em cloud.

---

## ⚠️ PRÉ-REQUISITOS OBRIGATÓRIOS

Antes de começar, você precisa ter:

1. **Conta no Render** (https://render.com)
2. **Conta no Vercel** (https://vercel.com)
3. **Conta no Supabase** (https://supabase.com)
4. **Git instalado** e código commitado
5. **Node.js 18+** instalado

---

## FASE 1 — SUPABASE: CONFIGURAR BANCO (5 minutos)

### 1.1 Criar projeto

```bash
# Acesse: https://app.supabase.com
# Clique: "New Project"
# Preencha:
#   - Name: mercado-express-staging
#   - Database Password: [escolha uma senha forte]
#   - Region: South America (São Paulo)
# Clique: "Create new project"
# Aguarde: ~2 minutos
```

### 1.2 Obter credenciais

No Supabase Dashboard, vá em **Settings → API** e copie:

```
SUPABASE_URL=https://[SEU_PROJECT_REF].supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Depois vá em **Settings → Database** e copie a **Connection string**:

```
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
```

**Substitua `[PASSWORD]` pela senha do banco.**

### 1.3 Criar bucket de storage

```bash
# No Supabase Dashboard:
# 1. Vá em "Storage"
# 2. Clique em "New bucket"
# 3. Nome: market-images
# 4. Marque: Public bucket
# 5. Clique: "Create bucket"
```

### 1.4 Configurar RLS (Row Level Security)

No Supabase Dashboard, vá em **SQL Editor** e execute:

```sql
-- Habilitar RLS nas tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Policies para users
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Policies para markets
CREATE POLICY "Anyone can view markets" ON markets
  FOR SELECT USING (true);

CREATE POLICY "Managers can update their markets" ON markets
  FOR UPDATE USING (
    id IN (
      SELECT market_id FROM managers WHERE user_id = auth.uid()
    )
  );

-- Policies para products
CREATE POLICY "Anyone can view products" ON products
  FOR SELECT USING (true);

CREATE POLICY "Managers can manage products" ON products
  FOR ALL USING (
    market_id IN (
      SELECT market_id FROM managers WHERE user_id = auth.uid()
    )
  );

-- Policies para orders
CREATE POLICY "Users can view their own orders" ON orders
  FOR SELECT USING (
    user_id = auth.uid() OR
    market_id IN (
      SELECT market_id FROM managers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Managers can update order status" ON orders
  FOR UPDATE USING (
    market_id IN (
      SELECT market_id FROM managers WHERE user_id = auth.uid()
    )
  );

-- Policies para cart_items
CREATE POLICY "Users can manage their own cart" ON cart_items
  FOR ALL USING (user_id = auth.uid());
```

Clique em **"Run"** para executar.

### 1.5 Aplicar migrations (opcional, se já aplicou localmente pule)

```bash
cd backend
npx prisma migrate deploy
```

**Esperado:** `5 migrations applied`

---

## FASE 2 — RENDER: DEPLOY BACKEND (10 minutos)

### 2.1 Criar Web Service

1. Acesse https://dashboard.render.com
2. Clique em **"New +"** → **"Web Service"**
3. Clique em **"Connect a repository"**
4. Autorize o Render a acessar seu GitHub/GitLab
5. Selecione o repositório `Mercado_Express`

### 2.2 Configurar o serviço

Preencha os campos:

```
Name: mercado-express-backend-staging
Region: São Paulo (ou mais próxima)
Branch: main
Root Directory: backend
Runtime: Node
Build Command: npm install && npx prisma generate && npx prisma migrate deploy && npm run build
Start Command: npm run start:prod
Plan: Free
```

### 2.3 Configurar variáveis de ambiente

Clique em **"Advanced"** → **"Add Environment Variable"** e adicione:

```env
# Banco de dados (do Supabase)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres

# JWT (gere uma chave forte de 32+ caracteres)
JWT_SECRET=mercado-express-staging-jwt-2024-super-secret-key-32chars

# Supabase
SUPABASE_URL=https://[SEU_PROJECT_REF].supabase.co
SUPABASE_ANON_KEY=[ANON_KEY_DO_SUPABASE]
SUPABASE_SERVICE_ROLE_KEY=[SERVICE_ROLE_KEY_DO_SUPABASE]

# CORS (temporário)
CORS_ORIGINS=http://localhost:5173,https://mercado-express-frontend-staging.vercel.app

# Servidor
NODE_ENV=staging
PORT=10000
```

**Substitua os valores entre `[ ]` pelos valores reais do Supabase.**

### 2.4 Fazer deploy

1. Clique em **"Create Web Service"**
2. Aguarde o build (~3-5 minutos)
3. Monitore os logs em tempo real

**Logs esperados (sucesso):**
```
✓ npm install OK
✓ prisma generate OK
✓ prisma migrate deploy OK (5 migrations applied)
✓ npm run build OK
✓ Application is running on port 10000
```

**Se falhar:**
- Verifique os logs no Render
- Verifique se `DATABASE_URL` está correta
- Verifique se `JWT_SECRET` tem 32+ caracteres

### 2.5 Validar health checks

Após deploy, abra um terminal e execute:

```bash
# Health live
curl https://mercado-express-backend-staging.onrender.com/health/live

# Health ready
curl https://mercado-express-backend-staging.onrender.com/health/ready
```

**Esperado:** HTTP 200 em ambos

```json
# Resposta esperada:
{"status":"ok"}
```

### 2.6 Anotar URL do backend

```
URL_BACKEND = https://mercado-express-backend-staging.onrender.com
```

**Guarde esta URL, você vai precisar dela no próximo passo.**

---

## FASE 3 — VERCEL: DEPLOY FRONTEND (5 minutos)

### 3.1 Atualizar arquivo .env.staging

Antes de fazer deploy, atualize o arquivo `frontend/.env.staging`:

```bash
# Edite o arquivo frontend/.env.staging
# Altere a linha VITE_API_URL para:
VITE_API_URL=https://mercado-express-backend-staging.onrender.com
```

**Substitua pela URL real do backend que você anotou na Fase 2.6.**

### 3.2 Fazer deploy

1. Acesse https://vercel.com
2. Clique em **"Add New..."** → **"Project"**
3. Clique em **"Import"** ao lado do repositório `Mercado_Express`

### 3.3 Configurar projeto

Preencha os campos:

```
Project Name: mercado-express-frontend-staging
Framework Preset: Vite
Root Directory: frontend
Build Command: npm run build
Output Directory: dist
```

### 3.4 Configurar variáveis de ambiente

Clique em **"Environment Variables"** e adicione:

```
VITE_API_URL = https://mercado-express-backend-staging.onrender.com
VITE_SUPABASE_URL = https://wlusqcxwqxdffeqegmiy.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsdXNxY3h3cXhkZmZlcWVnbWl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2NDIxMzYsImV4cCI6MjA5NzIxODEzNn0.0jsIPSByrLQ_9waB1xn9d_aMIRNRj7vjqwfzSuaN8ms
```

**IMPORTANTE:**
- Apenas variáveis com prefixo `VITE_` são expostas ao frontend
- NUNCA colocar `DATABASE_URL`, `JWT_SECRET` ou `SUPABASE_SERVICE_ROLE_KEY`

### 3.5 Fazer deploy

1. Clique em **"Deploy"**
2. Aguarde o build (~2-3 minutos)
3. Acompanhe o progresso

**Logs esperados (sucesso):**
```
✓ npm install OK
✓ tsc -b OK
✓ vite build OK
✓ Build completed
```

### 3.6 Anotar URL do frontend

Após deploy, você verá uma URL como:

```
URL_FRONTEND = https://mercado-express-frontend-staging.vercel.app
```

**Guarde esta URL, você vai precisar dela no próximo passo.**

### 3.7 Validar frontend

1. Acesse a URL do frontend
2. Abra o DevTools (F12)
3. Verifique:
   - [ ] Frontend abre sem erro crítico
   - [ ] Aba Network mostra chamadas para `mercado-express-backend-staging.onrender.com` (NÃO localhost)
   - [ ] Não há erro de CORS (vermelho no console)
   - [ ] Tente fazer login admin

---

## FASE 4 — ATUALIZAR CORS (2 minutos)

### 4.1 Atualizar variável no Render

1. Acesse https://dashboard.render.com
2. Clique em `mercado-express-backend-staging`
3. Vá em **Settings** → **Environment Variables**
4. Encontre a variável `CORS_ORIGINS`
5. Clique em **"Edit"**
6. Altere para:

```env
CORS_ORIGINS=https://mercado-express-frontend-staging.vercel.app,http://localhost:5173
```

**Substitua `mercado-express-frontend-staging.vercel.app` pela URL real do seu frontend.**

7. Clique em **"Save Changes"**
8. O Render fará redeploy automático (~2 minutos)

### 4.2 Validar CORS

Após redeploy, teste:

```bash
# Teste de preflight (CORS)
curl -X OPTIONS https://mercado-express-backend-staging.onrender.com/api/auth/login \
  -H "Origin: https://mercado-express-frontend-staging.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

**Esperado:** HTTP 200 com headers:

```
HTTP/1.1 200 OK
access-control-allow-origin: https://mercado-express-frontend-staging.vercel.app
access-control-allow-methods: GET,POST,PUT,PATCH,DELETE,OPTIONS
```

### 4.3 Testar login no frontend

1. Acesse o frontend novamente
2. Tente fazer login com admin
3. Verifique se não há erro de CORS

---

## FASE 5 — SMOKE TEST (15 minutos)

Abra o arquivo `STAGING_SMOKE_TEST_REAL.md` e execute todos os 25 testes.

**Critério mínimo:**
- 22/25 aprovados
- 0 falhas críticas
- 0 vazamento de senha/token/secret

### Testes obrigatórios:

```bash
# 1. Health checks
curl https://mercado-express-backend-staging.onrender.com/health/live
curl https://mercado-express-backend-staging.onrender.com/health/ready

# 2. Testar API (sem autenticação)
curl https://mercado-express-backend-staging.onrender.com/markets

# 3. Testar login
curl -X POST https://mercado-express-backend-staging.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin123"}'
```

### Validações manuais no frontend:

1. **Login admin** - Faça login com credenciais de admin
2. **Página de gestores** - Acesse `/managers` ou `/admin`
3. **Mercado vinculado** - Verifique se o mercado aparece
4. **Dois gestores** - Crie/edite gestores no mesmo mercado
5. **Upload de imagem** - Faça upload de uma imagem de mercado
6. **Carrinho** - Adicione produtos ao carrinho
7. **Checkout** - Finalize um pedido
8. **Status do pedido** - Altere o status de um pedido

---

## FASE 6 — VERIFICAÇÕES FINAIS (5 minutos)

### 6.1 Verificar que não há secrets expostos

```bash
# Verificar logs do backend (no Render Dashboard)
# NÃO deve conter:
# - Senhas
# - Tokens JWT
# - API keys
# - Service role keys
```

### 6.2 Verificar que frontend não chama localhost

```bash
# No DevTools do frontend (F12):
# Aba Network
# Verifique que NÃO há requisições para:
# - http://localhost:3000
# - http://localhost:5173
```

### 6.3 Verificar CORS

```bash
# No console do navegador (F12):
# NÃO deve haver erros de CORS (vermelho)
# Erros típicos:
# - "Access to fetch at ... has been blocked by CORS policy"
```

### 6.4 Verificar banco de dados

```bash
# No Supabase Dashboard:
# 1. Vá em "Table Editor"
# 2. Verifique que as tabelas existem:
#    - users
#    - markets
#    - products
#    - orders
#    - cart_items
#    - managers
# 3. Verifique que há dados (se seed foi executado)
```

---

## FASE 7 — CRIAR RELATÓRIO FINAL

Crie o arquivo `RELATORIO_DEPLOY_STAGING_CLOUD.md`:

```markdown
# RELATÓRIO DE DEPLOY STAGING CLOUD

## 1. Plataformas Utilizadas

- **Backend:** Render
- **Frontend:** Vercel
- **Banco/Storage:** Supabase

## 2. URLs

- **Backend:** https://mercado-express-backend-staging.onrender.com
- **Frontend:** https://mercado-express-frontend-staging.vercel.app

## 3. Resultado do Deploy

### Backend (Render)
- Build: ✓ SUCESSO
- Migrations: ✓ 5/5 aplicadas
- Health checks: ✓ 200 OK

### Frontend (Vercel)
- Build: ✓ SUCESSO
- Deploy: ✓ SUCESSO

## 4. Smoke Test

- Itens testados: 25
- Aprovados: [X]/25
- Reprovados: [Y]/25
- Falhas críticas: [Z]

## 5. Decisão Final

[ ] APROVADO PARA TESTES DE USUÁRIO
[ ] APROVADO COM RESTRIÇÕES
[ ] REPROVADO

## 6. Observações

[Adicione observações relevantes]
```

---

## COMANDOS ÚTEIS PARA VALIDAÇÃO

### Testar backend localmente (antes do deploy)

```bash
cd backend

# Instalar dependências
npm install

# Gerar Prisma Client
npx prisma generate

# Aplicar migrations
npx prisma migrate deploy

# Build
npm run build

# Iniciar em produção
npm run start:prod
```

### Testar frontend localmente

```bash
cd frontend

# Instalar dependências
npm install

# Build
npm run build

# Preview
npm run preview
```

### Verificar variáveis de ambiente

```bash
# Backend - verificar se .env existe
ls backend/.env

# Frontend - verificar se .env.staging existe
ls frontend/.env.staging

# Verificar se .env está no .gitignore
cat backend/.gitignore | grep .env
cat frontend/.gitignore | grep .env
```

### Auditar secrets no código

```bash
# Backend - procurar por secrets hardcoded
cd backend
grep -r "SUPABASE_SERVICE_ROLE_KEY" src/
grep -r "JWT_SECRET" src/
grep -r "DATABASE_URL" src/

# Frontend - procurar por secrets
cd frontend
grep -r "SUPABASE_SERVICE_ROLE_KEY" src/
grep -r "JWT_SECRET" src/
grep -r "DATABASE_URL" src/
```

**Esperado:** Nenhum resultado (secrets não devem estar hardcoded)

---

## TROUBLESHOOTING RÁPIDO

### Backend não inicia no Render

```bash
# Verificar logs no Render Dashboard
# Erros comuns:
# 1. DATABASE_URL incorreta → Verificar connection string
# 2. JWT_SECRET muito curta → Mínimo 32 caracteres
# 3. Migrations falharam → Verificar logs do prisma migrate deploy
```

### Erro de CORS

```bash
# Verificar:
# 1. CORS_ORIGINS inclui a URL do frontend?
# 2. Frontend está chamando a URL correta do backend?
# 3. Protocolo está correto (https://)?
```

### Frontend não carrega variáveis

```bash
# Verificar:
# 1. Variável começa com VITE_?
# 2. Variável está no Vercel Dashboard?
# 3. Fez novo deploy após adicionar variável?
```

### Banco de dados não conecta

```bash
# Verificar:
# 1. DATABASE_URL está correta?
# 2. Senha do banco está correta?
# 3. Projeto Supabase está ativo?
# 4. IP do Render não está bloqueado?
```

---

## CHECKLIST FINAL

Marque cada item conforme completa:

### Supabase
- [ ] Projeto criado
- [ ] Credenciais obtidas
- [ ] Bucket `market-images` criado
- [ ] RLS configurado
- [ ] Migrations aplicadas (5/5)

### Render (Backend)
- [ ] Web Service criado
- [ ] Variáveis de ambiente configuradas
- [ ] Build concluído com sucesso
- [ ] Health checks respondem 200
- [ ] URL anotada

### Vercel (Frontend)
- [ ] Projeto criado
- [ ] Variáveis de ambiente configuradas
- [ ] Build concluído com sucesso
- [ ] Frontend abre sem erro
- [ ] URL anotada

### CORS
- [ ] CORS_ORIGINS atualizado no Render
- [ ] Frontend consegue acessar API
- [ ] Sem erros de CORS no console

### Smoke Test
- [ ] Health checks OK
- [ ] Login admin funciona
- [ ] Página de gestores carrega
- [ ] Upload de imagem funciona
- [ ] Carrinho funciona
- [ ] Checkout funciona
- [ ] 22/25 testes aprovados

### Segurança
- [ ] Nenhum secret exposto em logs
- [ ] Frontend não chama localhost
- [ ] .env não commitado no git
- [ ] Service role key não está no frontend

### Documentação
- [ ] Relatório criado
- [ ] Decisão final tomada

---

## PRÓXIMOS PASSOS APÓS APROVAÇÃO

1. **Rotacionar secrets** que foram expostos
2. **Configurar domínio customizado** (opcional)
3. **Configurar monitoring** (Sentry, LogRocket, etc.)
4. **Configurar CI/CD** para deploys automáticos
5. **Preparar dados de teste** para usuários reais

---

## SUPORTE

- Render: https://render.com/docs
- Vercel: https://vercel.com/docs
- Supabase: https://supabase.com/docs
- Prisma: https://www.prisma.io/docs

---

**Última atualização:** 26/06/2024
**Versão:** 1.0
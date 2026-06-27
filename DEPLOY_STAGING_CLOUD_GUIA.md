# GUIA DE DEPLOY STAGING CLOUD — MERCADO EXPRESS

Este guia contém instruções passo a passo para publicar o staging em cloud.

---

## ⚠️ AVISO DE SEGURANÇA

**O arquivo `backend/.env` contém a `SUPABASE_SERVICE_ROLE_KEY` exposta.**

Esta chave NÃO deve ser commitada no git. Verifique se está no `.gitignore`.

**Ação necessária:**
1. Rotacionar a `SUPABASE_SERVICE_ROLE_KEY` no Supabase Dashboard
2. Atualizar a variável no Render após deploy
3. NUNCA commitar este arquivo

---

## PRÉ-REQUISITOS

- [ ] Conta no Render (https://render.com)
- [ ] Conta no Vercel (https://vercel.com)
- [ ] Conta no Supabase (https://supabase.com)
- [ ] Repositório Git com código atualizado
- [ ] Migrations do Prisma aplicadas localmente (5/5)

---

## FASE 1 — SUPABASE: PREPARAR BANCO

### 1.1 Criar projeto no Supabase (se não existir)

1. Acesse https://app.supabase.com
2. Clique em "New Project"
3. Preencha:
   - **Name:** `mercado-express-staging`
   - **Database Password:** (escolha uma senha forte)
   - **Region:** South America (São Paulo)
4. Clique em "Create new project"
5. Aguarde ~2 minutos para provisionamento

### 1.2 Obter credenciais do Supabase

No Supabase Dashboard:

1. Vá em **Settings** → **API**
2. Copie:
   - **Project URL** → `SUPABASE_URL`
   - **anon/public key** → `SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (NUNCA exponha)

3. Vá em **Settings** → **Database**
4. Copie a **Connection string** (modo Transaction):
   ```
   postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
   ```
5. Substitua `[PASSWORD]` pela senha do banco

### 1.3 Criar bucket de storage

1. Vá em **Storage**
2. Clique em "New bucket"
3. Nome: `market-images`
4. Marque como **Public**
5. Clique em "Create bucket"

### 1.4 Configurar RLS (Row Level Security)

Execute no SQL Editor do Supabase:

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

### 1.5 Aplicar migrations locais (se necessário)

```bash
cd backend
npx prisma migrate deploy
```

---

## FASE 2 — RENDER: DEPLOY BACKEND

### 2.1 Criar Web Service

1. Acesse https://dashboard.render.com
2. Clique em **"New +"** → **"Web Service"**
3. Conecte seu repositório Git
4. Selecione o repositório `Mercado_Express`

### 2.2 Configurar serviço

**Configurações básicas:**

| Campo | Valor |
|-------|-------|
| **Name** | `mercado-express-backend-staging` |
| **Region** | São Paulo (ou mais próxima) |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npx prisma generate && npx prisma migrate deploy && npm run build` |
| **Start Command** | `npm run start:prod` |
| **Plan** | Free (para staging) |

**IMPORTANTE:** O Build Command já inclui `prisma migrate deploy`.

### 2.3 Configurar variáveis de ambiente

Em **Settings** → **Environment Variables**, adicione:

```env
# Banco de dados (do Supabase)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres

# JWT (gere uma chave forte de 32+ caracteres)
JWT_SECRET=sua-chave-jwt-super-secreta-com-pelo-menos-32-caracteres-aqui

# Supabase
SUPABASE_URL=https://[PROJECT_REF].supabase.co
SUPABASE_ANON_KEY=[ANON_KEY_DO_SUPABASE]
SUPABASE_SERVICE_ROLE_KEY=[SERVICE_ROLE_KEY_DO_SUPABASE]

# CORS (deixe temporário, atualizaremos depois)
CORS_ORIGINS=http://localhost:5173,https://mercado-express-frontend-staging.vercel.app

# Servidor
NODE_ENV=staging
PORT=10000
```

**Regras:**
- NÃO usar aspas nos valores
- NÃO commitar secrets
- `DATABASE_URL` deve apontar para o Supabase
- `JWT_SECRET` deve ser forte (mínimo 32 caracteres)

### 2.4 Deploy

1. Clique em **"Create Web Service"**
2. Aguarde o build (~3-5 minutos)
3. Monitore os logs em tempo real

**Logs esperados:**
```
✓ Prisma generate OK
✓ Prisma migrate deploy OK (5 migrations applied)
✓ Build OK
✓ Application is running on port 10000
```

### 2.5 Validar health checks

Após deploy, teste:

```bash
# Health live
curl https://mercado-express-backend-staging.onrender.com/health/live

# Health ready
curl https://mercado-express-backend-staging.onrender.com/health/ready
```

**Esperado:** HTTP 200 em ambos

**Se falhar:**
- Verifique os logs no Render
- Verifique se `DATABASE_URL` está correta
- Verifique se migrations aplicaram com sucesso

### 2.6 Anotar URL do backend

```
URL_BACKEND = https://mercado-express-backend-staging.onrender.com
```

---

## FASE 3 — VERCEL: DEPLOY FRONTEND

### 3.1 Preparar frontend

O arquivo `frontend/.env.staging` já foi criado com:
- `VITE_API_URL` (placeholder)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### 3.2 Deploy via Vercel Dashboard

1. Acesse https://vercel.com
2. Clique em **"Add New..."** → **"Project"**
3. Importe o repositório `Mercado_Express`

### 3.3 Configurar projeto

**Configurações:**

| Campo | Valor |
|-------|-------|
| **Project Name** | `mercado-express-frontend-staging` |
| **Framework Preset** | Vite |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

### 3.4 Configurar variáveis de ambiente

Em **Settings** → **Environment Variables**:

```
VITE_API_URL = https://mercado-express-backend-staging.onrender.com
VITE_SUPABASE_URL = https://wlusqcxwqxdffeqegmiy.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**IMPORTANTE:**
- Apenas variáveis com prefixo `VITE_` são expostas ao frontend
- NUNCA colocar `DATABASE_URL`, `JWT_SECRET` ou `SUPABASE_SERVICE_ROLE_KEY`

### 3.5 Deploy

1. Clique em **"Deploy"**
2. Aguarde o build (~2-3 minutos)
3. Anote a URL do frontend

**URL esperada:** `https://mercado-express-frontend-staging.vercel.app`

### 3.6 Validar frontend

1. Acesse a URL do Vercel
2. Abra DevTools (F12)
3. Verifique:
   - [ ] Frontend abre sem erro crítico
   - [ ] Network chama `VITE_API_URL` (não localhost)
   - [ ] Não há erro de CORS
   - [ ] Login admin funciona

---

## FASE 4 — ATUALIZAR CORS

### 4.1 Atualizar variável no Render

1. Acesse o Render Dashboard
2. Vá em `mercado-express-backend-staging`
3. Clique em **Settings** → **Environment Variables**
4. Atualize `CORS_ORIGINS`:

```env
CORS_ORIGINS=https://mercado-express-frontend-staging.vercel.app,http://localhost:5173
```

5. Clique em **"Save Changes"**
6. O Render fará redeploy automático

### 4.2 Validar CORS

Após redeploy:

```bash
# Teste de preflight
curl -X OPTIONS https://mercado-express-backend-staging.onrender.com/api/auth/login \
  -H "Origin: https://mercado-express-frontend-staging.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

**Esperado:** HTTP 200 com headers CORS corretos

---

## FASE 5 — SMOKE TEST

Execute o arquivo `STAGING_SMOKE_TEST_REAL.md` e preencha os 25 itens.

**Critério mínimo:**
- 22/25 aprovados
- 0 falhas críticas
- 0 vazamento de senha/token/secret

### Validações obrigatórias:

1. **Health checks** respondem 200
2. **Login admin** funciona
3. **Página de gestores** carrega
4. **Mercado vinculado** aparece
5. **Dois gestores no mesmo mercado** aparecem
6. **Edição de gestor** não desvincula outro
7. **Gestão de mercados** mostra múltiplos gestores
8. **Upload de imagem** funciona
9. **Carrinho** funciona
10. **Checkout** funciona
11. **Pedido é criado**
12. **Status do pedido** é alterado
13. `GET /markets` não retorna 429
14. **Logs não expõem secrets**

---

## FASE 6 — RELATÓRIO FINAL

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
13. Decisão final

---

## TROUBLESHOOTING

### Backend não inicia

**Sintoma:** Build falha ou app não sobe

**Verificar:**
1. Logs do Render (Dashboard → Service → Logs)
2. `DATABASE_URL` está correta?
3. `JWT_SECRET` tem 32+ caracteres?
4. `prisma migrate deploy` executou sem erro?

### Erro de CORS

**Sintoma:** Frontend não consegue acessar API

**Verificar:**
1. `CORS_ORIGINS` inclui a URL do frontend?
2. Frontend está chamando a URL correta do backend?
3. Não há erro de HTTPS/HTTP misturado?

### Erro de conexão com banco

**Sintoma:** `Can't reach database server`

**Verificar:**
1. `DATABASE_URL` está correta?
2. Senha do banco está correta?
3. IP do Render está liberado no Supabase?

### Frontend não carrega variáveis

**Sintoma:** `VITE_API_URL` é undefined

**Verificar:**
1. Variável está no Vercel Dashboard?
2. Nome começa com `VITE_`?
3. Fez novo deploy após adicionar variável?

---

## CHECKLIST FINAL

- [ ] Supabase provisionado
- [ ] Bucket `market-images` criado
- [ ] RLS configurado
- [ ] Backend deployado no Render
- [ ] Health checks respondem 200
- [ ] Migrations aplicadas (5/5)
- [ ] Frontend deployado no Vercel
- [ ] Frontend chama backend cloud (não localhost)
- [ ] CORS configurado
- [ ] Login admin funciona
- [ ] Smoke test executado (22/25+ aprovados)
- [ ] Relatório criado
- [ ] Decisão final tomada

---

## CONTATOS E SUPORTE

- Render Docs: https://render.com/docs
- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
- Prisma Docs: https://www.prisma.io/docs
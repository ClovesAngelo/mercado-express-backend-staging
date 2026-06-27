# Mercado Express - Análise Completa do Projeto

> **Data:** 23/06/2026
> **Autor:** Revisão Técnica
> **Objetivo:** Mapear o estado atual, riscos e traçar um plano para produção

---

## 1. DIAGNÓSTICO - Arquitetura Atual

### 1.1 Stack Tecnológica

| Camada     | Tecnologia                     | Versão   |
|------------|--------------------------------|----------|
| Backend    | NestJS                        | ^11.0.1  |
| ORM        | Prisma                        | ^5.22.0  |
| Banco      | PostgreSQL (Supabase)         | -        |
| Auth       | Passport + JWT + Bcrypt       | -        |
| Storage    | Supabase Storage              | -        |
| Frontend   | React + Vite + TypeScript     | -        |
| CSS        | Tailwind CSS                  | -        |
| HTTP       | Axios                         | -        |

### 1.2 Estrutura do Backend (NestJS)

```
backend/src/
├── main.ts               # Bootstrap, CORS, Swagger, ValidationPipe
├── app.module.ts         # Módulo raiz (importa todos os módulos)
├── app.controller.ts
├── app.service.ts
├── auth/                 # Autenticação (JWT + LocalStrategy)
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── jwt.strategy.ts
│   ├── local.strategy.ts
│   ├── jwt-auth.guard.ts
│   ├── roles.guard.ts
│   ├── roles.decorator.ts
│   ├── current-user.decorator.ts
│   └── dto/ (login.dto.ts, register.dto.ts)
├── prisma/               # PrismaService (conexão com banco)
├── users/                # CRUD de usuários
├── markets/              # CRUD de mercados
├── catalog/              # Catálogo de produtos e categorias
├── cart/                 # Carrinho de compras
├── orders/               # Pedidos
├── managers/             # CRUD de gestores
├── admin/                # Dashboard admin
└── upload/               # Upload de imagens (Supabase Storage)
```

### 1.3 Estrutura do Frontend (React + Vite)

```
frontend/src/
├── App.tsx               # Rotas (React Router v6)
├── main.tsx              # Entrypoint
├── contexts/
│   └── AuthContext.tsx   # Contexto de autenticação
├── components/
│   ├── Layout.tsx        # Layout principal com navegação
│   ├── ProtectedRoute.tsx
│   ├── ErrorBoundary.tsx
│   ├── ImageUpload.tsx
│   └── SupabaseAudit.tsx
├── pages/
│   ├── Home.tsx          # Lista de mercados
│   ├── MarketPage.tsx    # Produtos de um mercado
│   ├── Cart.tsx          # Carrinho
│   ├── Checkout.tsx      # Finalizar pedido
│   ├── Orders.tsx        # Meus pedidos
│   ├── Login.tsx / Register.tsx
│   ├── Admin.tsx         # Dashboard admin
│   ├── Manager.tsx       # Dashboard gestor
│   ├── ManagersAdmin.tsx # CRUD de gestores
│   └── CreateProduct.tsx
├── services/
│   ├── api.ts            # Axios instance (usada pelo Home)
│   ├── apiClient.ts      # Axios instance (usada pelos services)
│   ├── auth.service.ts
│   ├── product.service.ts
│   ├── upload.service.ts
│   └── supabase.ts
```

### 1.4 Modelo de Dados (Prisma)

```
User (Cliente, Gestor, Admin)
  └── role: ADMIN_GERAL | GESTOR_MERCADO | CLIENTE
  └── marketId? -> Market (se for gestor)
  └── carts, orders

Market
  └── managerId? -> User (gestor vinculado)
  └── products, orders, deliveryAreas, ratings

Product
  └── marketId -> Market
  └── categoryId -> Category

Cart -> CartItem -> Product
Order -> OrderItem -> Product
Rating (marketId + userId unique)
DeliveryArea
Category
AuditLog
ProductImage
```

---

## 2. O QUE JÁ FOI FEITO - Funcionalidades Implementadas

### 2.1 Backend (NestJS)

| # | Funcionalidade | Status | Arquivos |
|---|----------------|--------|----------|
| 1 | Autenticação JWT (login/register) | ✅ Completo | auth.module, auth.service, jwt.strategy |
| 2 | Controle de Roles (Admin, Gestor, Cliente) | ✅ Completo | roles.guard, roles.decorator |
| 3 | CRUD de Mercados | ✅ Completo | markets.service, markets.controller |
| 4 | Criação de Mercado + Gestor (transação) | ✅ Completo | markets.service.createWithManager |
| 5 | CRUD de Produtos (Catálogo) | ✅ Completo | catalog.service, catalog.controller |
| 6 | CRUD de Categorias | ✅ Completo | catalog.service |
| 7 | Carrinho de Compras | ✅ Completo | cart.service, cart.controller |
| 8 | Pedidos (CRUD + Update Status) | ✅ Completo | orders.service, orders.controller |
| 9 | Dashboard Admin (estatísticas) | ✅ Completo | admin/ |
| 10 | CRUD de Gestores | ✅ Completo | managers/ |
| 11 | Upload de Imagens (Supabase) | ✅ Completo | upload/ |
| 12 | Soft Delete (deletedAt) | ✅ Parcial | Alguns models têm, nem todos validam |
| 13 | Auditoria (AuditLog) | ⚠️ Model criado, não utilizado | schema.prisma |
| 14 | Swagger/OpenAPI | ✅ Completo | main.ts configurado |
| 15 | Validação com class-validator | ✅ Parcial | DTOs básicos, mas sem decorators |
| 16 | Cache no Dashboard | ✅ Parcial | Cache em memória (30s TTL) |

### 2.2 Frontend (React)

| # | Funcionalidade | Status |
|---|----------------|--------|
| 1 | Login/Registro | ✅ Completo |
| 2 | Lista de Mercados (Home) | ✅ Completo |
| 3 | Página do Mercado com Produtos | ✅ Completo |
| 4 | Carrinho de Compras | ✅ Completo |
| 5 | Checkout | ✅ Completo |
| 6 | Meus Pedidos | ✅ Completo |
| 7 | Admin Dashboard | ✅ Completo |
| 8 | Gestão de Gestores (Admin) | ✅ Completo |
| 9 | Dashboard do Gestor | ✅ Completo |
| 10 | Criar Produto (Gestor) | ✅ Completo |
| 11 | Proteção de Rotas (Roles) | ✅ Completo |
| 12 | ErrorBoundary | ✅ Completo |
| 13 | Tratamento de Sessão (token validation) | ✅ Completo |
| 14 | Upload de Imagem | ✅ Completo |

---

## 3. RISCOS CRÍTICOS IDENTIFICADOS

### 🔴 CRÍTICOS (Impedem Produção)

#### R1 - Duas Instâncias Axios (api.ts e apiClient.ts) ← ALTA PRIORIDADE
**Problema:** Existem DOIS arquivos de instância Axios que fazem EXATAMENTE a mesma coisa (`api.ts` e `apiClient.ts`). O `Home.tsx` usa `api.ts` enquanto os services usam `apiClient.ts`. Isso é confuso e propenso a erros.

**Impacto:** Manutenção duplicada, risco de configurações inconsistentes.

---

#### R2 - JWT Secret Hardcoded no Código ← ALTA PRIORIDADE
**Problema:** `process.env.JWT_SECRET || 'mercado-express-jwt-secret-key-2024'` aparece em:
- `auth.module.ts` (linha 17)
- `jwt.strategy.ts` (linha 12)

**Impacto:** Em produção, se a env `JWT_SECRET` não estiver definida, a aplicação funcionará com uma secret fixa e conhecida - **gravíssimo risco de segurança**.

---

#### R3 - Supabase Service Role Key no .env
**Problema:** A chave `SUPABASE_SERVICE_ROLE_KEY` está exposta no `.env` que foi commitado.

**Impacto:** Essa chave dá acesso administrativo total ao Supabase. Alguém com acesso ao repositório pode assumir o controle do storage.

---

#### R4 - Nenhum Teste Implementado ← ALTA PRIORIDADE
**Problema:**
- `backend/test/` contém apenas boilerplate
- Nenhum teste unitário (.spec.ts) implementado
- Nenhum teste e2e funcional

**Impacto:** Qualquer alteração pode quebrar funcionalidades sem detecção.

---

#### R5 - Tratamento de Erros Genérico ← MÉDIA PRIORIDADE
**Problema:** Em muitos lugares, erros são capturados como `(error as Error)?.message` e lançados como `HttpException` genérico com status 500. A perda de tipos e stack traces dificulta debugging.

**Impacto:** Dificuldade para diagnosticar problemas em produção.

---

#### R6 - Cache do Dashboard em Memória ← MÉDIA PRIORIDADE
**Problema:** `DashboardService` usa cache em memória local (instância da classe). Em múltiplas instâncias (horizontal scaling), cada uma terá seu próprio cache inconsistente.

**Impacto:** Dados inconsistentes entre réplicas.

---

#### R7 - CORS Hardcoded para Localhost ← MÉDIA PRIORIDADE
**Problema:** Em `main.ts`, as origens permitidas são apenas `localhost:5173` e `127.0.0.1:5173`.

**Impacto:** Em produção, o frontend em outro domínio será bloqueado pelo CORS.

---

#### R8 - Senha do Gestor sem Hash ← MÉDIA PRIORIDADE
**Problema:** Em `managers.service.ts` (linha 72-79), o gestor é criado com `password: data.password` **sem hash**. A senha é armazenada em texto puro.

```typescript
const manager = await this.prisma.user.create({
  data: {
    password: data.password, // sem hash!
    role: 'GESTOR_MERCADO',
  },
});
```

**Impacto:** Senhas de gestores armazenadas em texto puro - violação de segurança grave.

---

### 🟡 MÉDIOS (Melhorias Recomendadas)

#### R9 - Variáveis de Ambiente Não Validadas
**Problema:** Não há validação na inicialização se as envs obrigatórias (`DATABASE_URL`, `JWT_SECRET`, etc.) estão presentes.

**Impacto:** A aplicação pode iniciar com configurações inválidas.

---

#### R10 - Soft Delete Implementado Parcialmente
**Problema:** Alguns models (User, Market, Product, Category, Order) têm `deletedAt`, mas nem todos os serviços verificam `deletedAt: null` nas queries. Exemplo: `markets.service.findAll()` não filtra deletados, `catalog.service.findAllCategories()` também não.

---

#### R11 - DTOs sem class-validator
**Problema:** Embora o `ValidationPipe` esteja configurado com `whitelist: true`, os DTOs não usam decorators como `@IsString()`, `@IsEmail()`, etc. A validação depende de verificações manuais nos controllers.

---

#### R12 - ConfigModule não Importado
**Problema:** `@nestjs/config` está no `package.json` mas não é importado em `app.module.ts`. As variáveis de ambiente são lidas diretamente via `process.env`.

**Impacto:** Perde-se recursos como validação de schema, defaults tipados, etc.

---

#### R13 - orders.service.ts Usa Casting Inseguro
**Problema:** Na linha 43, `(item as any).productName` - o método `create` recebe um tipo que não inclui `productName`, forçando cast para `any`.

---

#### R14 - Frontend sem Tratamento de Erro Global
**Problema:** Não há um provider de notificações/toast para erros de API. Cada página trata erro de forma isolada.

---

### 🟢 BAIXOS (Opcionais)

#### R15 - Arquivos .js e .d.ts Compilados no Source
**Problema:** Há arquivos `.js`, `.d.ts`, `.js.map` misturados com os `.ts` na pasta `src/`.

**Solução:** Adicionar `backend/src/**/*.js` e `backend/src/**/*.d.ts` no `.gitignore`.

---

#### R16 - Console.log em Produção
**Problema:** Múltiplos `console.log` espalhados pelos serviços (auth, orders, cart). Em produção, deveria usar Logger do NestJS.

---

#### R17 - Nenhum Rate Limiting
**Problema:** Endpoints de login/register não têm proteção contra brute force.

---

## 4. PLANO DE AÇÃO PARA PRODUÇÃO

### Fase 1: Correções Críticas (Segurança) - 1-2 dias

| # | Ação | Arquivos | Esforço |
|---|------|----------|---------|
| 1 | Unificar `api.ts` e `apiClient.ts` em um único arquivo | `frontend/src/services/` | 30 min |
| 2 | Remover hardcoded JWT secret, validar env obrigatória | `auth.module.ts`, `jwt.strategy.ts` | 15 min |
| 3 | Fazer hash da senha ao criar gestor via `managers.service.ts` | `managers.service.ts` | 15 min |
| 4 | Rotacionar chaves SUPABASE_SERVICE_ROLE_KEY expostas | Supabase Console | 30 min |
| 5 | Tornar CORS configurável via env | `main.ts` | 15 min |

### Fase 2: Qualidade e Testes - 3-5 dias

| # | Ação | Esforço |
|---|------|---------|
| 1 | Implementar testes unitários para auth.service | 1 dia |
| 2 | Implementar testes unitários para orders.service | 1 dia |
| 3 | Implementar testes e2e para fluxo completo (login → mercado → produto → carrinho → pedido) | 2 dias |
| 4 | Adicionar validação com class-validator nos DTOs | 1 dia |

### Fase 3: Resiliência e Produção - 2-3 dias

| # | Ação | Esforço |
|---|------|---------|
| 1 | Substituir cache local do Dashboard por Redis ou remover cache | 1 dia |
| 2 | Importar `@nestjs/config` e config validations | 30 min |
| 3 | Implementar soft delete consistente em todas as queries | 1 dia |
| 4 | Substituir `console.log` por Logger do NestJS | 1 dia |
| 5 | Adicionar rate limiting (`@nestjs/throttler`) | 30 min |

### Fase 4: DevOps e Deploy - 2-3 dias

| # | Ação | Esforço |
|---|------|---------|
| 1 | Dockerizar backend e frontend | 1 dia |
| 2 | Configurar CI/CD (GitHub Actions) | 1 dia |
| 3 | Configurar variáveis de ambiente seguras (secrets) | 30 min |
| 4 | Health check endpoint | 30 min |

### Fase 5: Melhorias Pós-Produção - 1-2 semanas

| # | Ação |
|---|------|
| 1 | Implementar recuperação de senha (forgot password) |
| 2 | Integração com gateway de pagamento (Stripe, Mercado Pago) |
| 3 | Adicionar notificações em tempo real (WebSockets) |
| 4 | Implementar audit log funcional |
| 5 | Melhorar acessibilidade (a11y) |
| 6 | SEO (SSR/SSG - Next.js) |

---

## 5. IMPACTOS ESPERADOS DAS CORREÇÕES

### Positivos
- ✅ Segurança: senhas com hash, JWT com secret forte, CORS configurável
- ✅ Manutenibilidade: código unificado, testes, tipagem forte
- ✅ Resiliência: deployável em múltiplas instâncias
- ✅ Qualidade: validação consistente, tratamento de erros adequado

### Riscos das Correções
- ⚠️ Hash de senha no `managers.service.ts`: pode quebrar seeds existentes se a senha já veio hasheada (verificar `prisma/seed.ts`)
- ⚠️ Mudança de CORS: frontend existente pode parar de funcionar se a env não for configurada
- ⚠️ Soft delete consistente: pode expor dados que antes estavam escondidos acidentalmente (ou vice-versa)

---

## 6. TESTES RECOMENDADOS

### Testes Unitários
1. `auth.service.spec.ts` - validação de usuário, login, registro
2. `orders.service.spec.ts` - criação de pedido, cálculo de total, permissionamento
3. `cart.service.spec.ts` - add/remove/update items
4. `markets.service.spec.ts` - CRUD, transação com gestor
5. `managers.service.spec.ts` - criação com hash de senha

### Testes de Integração
1. Fluxo: Registro → Login → Token válido
2. Fluxo: Admin cria mercado com gestor → Gestor faz login
3. Fluxo: Cliente vê produtos → Adiciona ao carrinho → Finaliza pedido
4. Fluxo: Gestor atualiza status do pedido
5. Upload de imagem → URL pública válida

### Testes de Segurança
1. Acesso sem token retorna 401
2. Cliente não acessa rota de admin (403)
3. Gestor não acessa pedidos de outro mercado (403)
4. Rate limiting em login (429 após N tentativas)

---

## 7. CONCLUSÃO

O projeto **Mercado Express** tem uma base sólida com arquitetura NestJS + React bem estruturada, 
seguindo boas práticas como modularização, guards de autorização, e separação de responsabilidades.

**Pontos fortes:**
- Arquitetura limpa e organizada
- Controle de acesso por roles funcional
- Código legível e comentado

**Porém, existem 8 riscos que PRECISAM ser resolvidos ANTES de ir para produção,**
sendo os mais críticos:
1. Senha de gestor sem hash (R8)
2. JWT secret hardcoded (R2)
3. Duas instâncias Axios (R1)
4. Ausência de testes (R4)

**Recomendação:** Iniciar pela Fase 1 (correções de segurança) que pode ser concluída em 
1-2 dias e já elimina os riscos mais graves. Em paralelo, implementar testes (Fase 2) 
para garantir que as correções não introduzam regressões.
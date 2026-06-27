# DIAGNÓSTICO PRÉ-DEPLOY — MERCADO EXPRESS STAGING

**Data:** 25/06/2026  
**Engenheiro:** DevOps/SRE  
**Objetivo:** Preparar primeiro deploy real de staging

---

## 1. O QUE JÁ ESTÁ PRONTO PARA STAGING

### Backend
- ✅ Estrutura NestJS montada com módulos organizados
- ✅ Prisma schema válido (`npx prisma validate` passou)
- ✅ Health checks implementados (`/health/live` e `/health/ready`)
- ✅ Validação de env vars obrigatórias em `main.ts`
- ✅ CORS configurável via `CORS_ORIGINS`
- ✅ Rate limiting configurado (10 req/min global)
- ✅ Módulo de upload com Supabase Storage implementado
- ✅ Módulo de audit log implementado
- ✅ JWT configurado com expiração de 24h
- ✅ Validação de entrada com class-validator
- ✅ Swagger documentado em `/api`
- ✅ Scripts de build e start funcionais
- ✅ `.gitignore` blindado contra arquivos compilados em `src`
- ✅ `.gitignore` ignora `.env.staging` corretamente
- ✅ `.env.staging.example` documentado com todas as variáveis

### Frontend
- ✅ React + Vite + TypeScript configurado
- ✅ `VITE_API_URL` utilizada em `src/services/api.ts`
- ✅ Scripts de build e preview existem
- ✅ `.env.example` documentado

### Documentação
- ✅ `DEPLOY_CHECKLIST.md` existe
- ✅ `STAGING_SMOKE_TEST.md` existe
- ✅ `SECURITY_ENV_GUIDE.md` existe
- ✅ `.env.staging.example` existe

---

## 2. O QUE AINDA BLOQUEIA STAGING

### 🔴 BLOQUEADOR CRÍTICO — Migrations Versionadas Ausentes

**Problema:**
- Pasta `backend/prisma/migrations/` está VAZIA
- Banco de dados já possui schema completo (4 migrations aplicadas)
- Migrations existem no banco mas não no repositório local:
  - `20260622170213_add_multi_market_roles`
  - `20260622170959_add_user_market_id`
  - `20260622180337_add_new_fields`
  - `20260622181851_add_final_features`

**Impacto:**
- NÃO é possível fazer deploy em staging sem migrations versionadas
- `npx prisma migrate deploy` não funcionará (não há migrations para aplicar)
- `npx prisma migrate status` mostra "No migration found"
- Rollback de migration não é possível
- Rastreabilidade de alterações de schema está quebrada

**Solução Necessária:**
1. Recuperar as migrations do histórico do banco OU
2. Criar migration inicial versionada que represente o schema atual
3. NUNCA usar `prisma db push` em staging
4. NUNCA resetar o banco

**Status:** ❌ **NO-GO até resolver**

---

## 3. O QUE É RISCO ACEITO

### Cobertura de Testes Baixa
- **Situação:** Testes unitários foram removidos (incompatibilidade com implementação real)
- **Cobertura estimada:** < 10%
- **Testes E2E:** Apenas 1 suite (health check)
- **Risco:** Bugs podem passar despercebidos
- **Mitigação:** Smoke test manual obrigatório antes de considerar staging estável
- **Aceitação:** Risco aceito para primeiro deploy, mas deve ser endereçado em sprint futura

### Prisma Desatualizado
- **Situação:** Prisma 5.22.0 instalado, versão 7.8.0 disponível
- **Risco:** Possíveis bugs de segurança e performance
- **Mitigação:** Upgrade planejado para sprint futura
- **Aceitação:** Risco aceito para primeiro deploy

### Service Role Key
- **Situação:** `SUPABASE_SERVICE_ROLE_KEY` está configurada
- **Risco:** Se exposta, permite bypass de RLS no Supabase
- **Mitigação:** 
  - Nunca commitar no git
  - Rotacionar se já foi exposta
  - Usar apenas no backend
- **Aceitação:** Risco aceito se key for rotacionada ou confirmada como não exposta

---

## 4. O QUE PRECISA SER CORRIGIDO OBRIGATORIAMENTE ANTES DE SUBIR

### 4.1 🔴 CRÍTICO — Recriar Migrations Versionadas

**Ação:**
1. Criar pasta `backend/prisma/migrations/` (se não existir)
2. Gerar migration inicial a partir do schema atual do banco
3. Garantir que `User.marketId` NÃO tem `@unique` (permite múltiplos gestores)
4. Garantir que `Market.managerId` é legado e `Market.managers` é a relação correta
5. Testar `npx prisma migrate deploy` em ambiente de teste

**Comando seguro (NÃO resetar banco):**
```bash
# Opção 1: Se tiver backup das migrations
# Restaurar migrations na pasta prisma/migrations/

# Opção 2: Criar migration inicial a partir do schema existente
# (Requer ferramenta externa ou recriação manual)
```

**Validação:**
```bash
npx prisma migrate status  # Deve mostrar migrations aplicadas
npx prisma validate        # Deve passar
```

### 4.2 🟡 IMPORTANTE — Adicionar Scripts Faltantes no Backend

**Problema:** Faltam scripts úteis no `package.json`

**Adicionar:**
```json
{
  "prisma:generate": "prisma generate",
  "prisma:migrate:deploy": "prisma migrate deploy",
  "prisma:validate": "prisma validate"
}
```

**Motivo:** Facilitar deploy e validação em CI/CD

### 4.3 🟡 IMPORTANTE — Criar `.env.staging` no Frontend

**Problema:** Frontend tem `.env.example` mas não `.env.staging.example`

**Solução:** Criar `frontend/.env.staging.example` com:
```env
VITE_API_URL=https://api-staging.seudominio.com
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
```

### 4.4 🟢 NICE TO HAVE — Adicionar `.gitignore` no Frontend

**Problema:** Frontend não tem `.gitignore`

**Solução:** Criar `frontend/.gitignore` com:
```gitignore
node_modules
dist
build
.env
.env.local
.env.staging
.env.production
.env.*.local
```

### 4.5 🟢 NICE TO HAVE — Documentar Plataforma de Deploy

**Problema:** Falta documento com instruções específicas de deploy

**Solução:** Criar documentos:
- `DEPLOY_STAGING_BACKEND.md`
- `DEPLOY_STAGING_FRONTEND.md`

---

## 5. ANÁLISE DO SCHEMA PRISMA

### 5.1 Múltiplos Gestores por Mercado

**Situação:** ✅ CORRETO

```prisma
model User {
  marketId  String?
  market    Market?   @relation("MarketManagers", fields: [marketId], references: [id])
}

model Market {
  managerId  String?   // Campo legado - manter para compatibilidade
  managers    User[]    @relation("MarketManagers")
}
```

**Análise:**
- `User.marketId` NÃO tem `@unique` ✓
- Permite múltiplos usuários com `marketId` igual ✓
- `Market.managers` é array de Users ✓
- Relação `MarketManagers` está correta ✓
- `Market.managerId` é legado (comentário no schema) ✓

**Conclusão:** Modelo está correto para múltiplos gestores

### 5.2 Health Checks

**Situação:** ✅ IMPLEMENTADO

```typescript
@Get('live')
async checkLiveness() {
  return { status: 'ok', timestamp: new Date().toISOString() };
}

@Get('ready')
async checkReadiness() {
  try {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'ready', database: 'connected', timestamp: new Date().toISOString() };
  } catch (error) {
    return { status: 'error', database: 'disconnected', timestamp: new Date().toISOString() };
  }
}
```

**Análise:**
- Liveness check não depende de banco ✓
- Readiness check valida conexão com banco ✓
- Retorno JSON padronizado ✓

### 5.3 Upload/Supabase

**Situação:** ✅ IMPLEMENTADO

```typescript
this.supabase = createClient(
  configService.getOrThrow<string>('SUPABASE_URL'),
  configService.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY'),
);
```

**Análise:**
- Usa `SUPABASE_SERVICE_ROLE_KEY` (backend only) ✓
- Valida tipo de arquivo (JPG, PNG, WEBP) ✓
- Valida tamanho (5MB) ✓
- Gera nome único com UUID ✓
- Bucket: `market-images` ✓

### 5.4 CORS

**Situação:** ✅ CONFIGURÁVEL

```typescript
const corsOrigins = configService.get<string>('CORS_ORIGINS');
const allowedOrigins = corsOrigins
  ? corsOrigins.split(',').map((origin) => origin.trim())
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];
```

**Análise:**
- Dinâmico via env var ✓
- Fallback para localhost em dev ✓
- Credentials habilitado ✓

### 5.5 Rate Limiting

**Situação:** ✅ GLOBAL

```typescript
ThrottlerModule.forRoot([
  {
    ttl: 60000,
    limit: 10,
  },
])
```

**Análise:**
- 10 requisições por minuto global ✓
- Proteção contra DDoS ✓
- **Nota:** Segundo relatórios, rate limiting seletivo em auth foi implementado

---

## 6. VALIDAÇÕES EXECUTADAS

### 6.1 Prisma Validate
```bash
cd backend; npx prisma validate
```
**Resultado:** ✅ PASSOU  
**Saída:** "The schema at prisma\schema.prisma is valid 🚀"

### 6.2 Prisma Migrate Status
```bash
cd backend; npx prisma migrate status
```
**Resultado:** ❌ BLOQUEADOR  
**Saída:** "No migration found in prisma/migrations"  
**Banco:** Schema está atualizado (4 migrations aplicadas)  
**Problema:** Migrations não existem localmente

### 6.3 Estrutura de Arquivos

**Backend:**
- ✅ `package.json` com scripts básicos
- ✅ `tsconfig.json` e `tsconfig.build.json`
- ✅ `nest-cli.json`
- ✅ `prisma/schema.prisma` válido
- ❌ `prisma/migrations/` VAZIA
- ✅ `main.ts` com validação de env
- ✅ `app.module.ts` com todos os módulos
- ✅ `health/health.controller.ts` implementado
- ✅ `.gitignore` configurado
- ✅ `.env.staging.example` documentado

**Frontend:**
- ✅ `package.json` com build e preview
- ✅ `src/services/api.ts` usa `VITE_API_URL`
- ✅ `.env.example` documentado
- ❌ `.gitignore` AUSENTE
- ❌ `.env.staging.example` AUSENTE

---

## 7. DECISÃO: GO ou NO-GO?

### ❌ NO-GO PARA DEPLOY DE STAGING

**Motivo Principal:**
- Migrations versionadas estão ausentes na pasta local
- Banco de dados já foi alterado diretamente (sem versionamento)
- `npx prisma migrate deploy` não funcionará
- Rollback de schema não é possível

**Riscos se Deploy Forçado:**
1. Deploy em novo ambiente falhará (sem migrations)
2. Impossibilidade de recriar banco em caso de desastre
3. Perda de rastreabilidade de alterações
4. Dificuldade de sincronizar ambientes (dev/staging/prod)

---

## 8. PRÓXIMOS PASSOS OBRIGATÓRIOS

1. **Recuperar migrations** do histórico ou banco
2. **Criar migration inicial** versionada representando schema atual
3. **Validar** `npx prisma migrate status` mostra migrations
4. **Testar** `npx prisma migrate deploy` em ambiente limpo
5. **Adicionar scripts** faltantes no `package.json`
6. **Criar** `frontend/.env.staging.example`
7. **Criar** `frontend/.gitignore`
8. **Documentar** deploy em `DEPLOY_STAGING_BACKEND.md` e `DEPLOY_STAGING_FRONTEND.md`
9. **Executar** build local (backend + frontend)
10. **Executar** smoke test completo
11. **Reavaliar** GO/NO-GO

---

## 9. RISCOS ACEITOS FORMALMENTE

1. **Cobertura de testes < 10%** — Aceito para primeiro deploy, com smoke test manual obrigatório
2. **Prisma 5.22.0 (desatualizado)** — Aceito, upgrade planejado para próxima sprint
3. **Service Role Key em uso** — Aceito se rotacionada ou confirmada como não exposta

---

## 10. CONCLUSÃO

**Status Atual:** ❌ **NO-GO**

**Bloqueador Principal:** Ausência de migrations versionadas em `prisma/migrations/`

**Tempo Estimado para Corrigir:** 2-4 horas (recuperar/criar migrations + validar)

**Ação Imediata:** Recuperar histórico de migrations ou criar migration inicial a partir do schema atual do banco.

---

**Elaborado por:** DevOps/SRE  
**Data:** 25/06/2026  
**Próxima revisão:** Após correção do bloqueador de migrations
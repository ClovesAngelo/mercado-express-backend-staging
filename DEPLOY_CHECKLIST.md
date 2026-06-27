# DEPLOY CHECKLIST — MERCADO EXPRESS STAGING

**Data:** 24/06/2026  
**Status:** APROVADO COM RISCO CONTROLADO

---

## AVISO PRÉVIO

**Build passando não significa sistema validado funcionalmente.**

Cobertura automatizada atual:
- Testes unitários: **REMOVIDOS** (incompatibilidade com implementação real)
- Testes E2E: **1 suite apenas** (health check)
- Cobertura estimada: **< 10%**

**Validação principal:** Smoke test manual (`STAGING_SMOKE_TEST.md`)

---

## ANTES DO DEPLOY

### 1. Preparação do Ambiente
- [ ] Clonar repositório ou atualizar código
- [ ] Verificar versão do Node.js (>= 18.x)
- [ ] Verificar versão do npm (>= 9.x)
- [ ] Instalar dependências: `npm install --production`
- [ ] Gerar Prisma Client: `npx prisma generate`

### 2. Validação de Código
- [ ] Executar `npx prisma validate` — **OBRIGATÓRIO**
- [ ] Executar `npx nest build` — **OBRIGATÓRIO**
- [ ] Verificar ausência de erros TypeScript
- [ ] Verificar ausência de warnings críticos

### 3. Banco de Dados
- [ ] Executar migrations: `npx prisma migrate deploy`
- [ ] Verificar status das migrations: `npx prisma migrate status`
- [ ] Executar seed de staging: `npm run prisma:seed`
- [ ] Confirmar tabelas criadas: users, markets, products, orders, audit_log
- [ ] Confirmar índices aplicados

### 4. Variáveis de Ambiente
- [ ] Copiar `.env.staging.example` para `.env.staging`
- [ ] Preencher `DATABASE_URL` (PostgreSQL/Supabase)
- [ ] Preencher `JWT_SECRET` (mínimo 32 caracteres)
- [ ] Preencher `SUPABASE_URL`
- [ ] Preencher `SUPABASE_ANON_KEY`
- [ ] Preencher `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Preencher `CORS_ORIGINS` (domínios de staging)
- [ ] Definir `NODE_ENV=staging`
- [ ] Definir `PORT=3000` (ou outra porta)

### 5. Segurança
- [ ] Rotacionar chaves Supabase se necessário
- [ ] Verificar que `JWT_SECRET` não é hardcoded
- [ ] Verificar que CORS está configurado para domínios de staging
- [ ] Confirmar que senhas no seed estão hasheadas
- [ ] Verificar que `.env.staging` não está commitado no git

### 6. Frontend (se aplicável)
- [ ] Atualizar `VITE_API_URL` para URL de staging
- [ ] Atualizar `VITE_SUPABASE_URL`
- [ ] Atualizar `VITE_SUPABASE_ANON_KEY`
- [ ] Executar build: `npm run build`
- [ ] Verificar build sem erros

---

## DEPLOY

### 7. Execução
- [ ] Fazer backup do banco de dados (se existir dados)
- [ ] Parar aplicação anterior (se existir)
- [ ] Iniciar nova aplicação: `npm run start:prod`
- [ ] Verificar logs de inicialização
- [ ] Confirmar "Application is running"

---

## DEPOIS DO DEPLOY

### 8. Health Checks
- [ ] Testar `GET /health/live` — esperado: `{"status":"ok"}`
- [ ] Testar `GET /health/ready` — esperado: `{"status":"ready","database":"connected"}`
- [ ] Verificar timeout < 5s em ambos

### 9. Smoke Test Manual
- [ ] Executar checklist completo: `STAGING_SMOKE_TEST.md`
- [ ] Mínimo 14/16 itens aprovados
- [ ] Todos os fluxos críticos funcionando (1-10)
- [ ] Documentar resultado no arquivo de smoke test

### 10. Verificação de Logs
- [ ] Verificar logs de inicialização (sem erros)
- [ ] Verificar logs de auditoria (AuditLog)
- [ ] Confirmar que `console.log` não está vazando dados sensíveis
- [ ] Verificar rate limiting ativo (10 req/min)

### 11. Funcionalidades Críticas
- [ ] Testar registro de usuário
- [ ] Testar login/logout
- [ ] Testar listagem de mercados
- [ ] Testar criação de mercado (admin)
- [ ] Testar criação de gestor
- [ ] Testar criação de produto
- [ ] Testar upload de imagem
- [ ] Testar carrinho e checkout
- [ ] Testar atualização de status de pedido

### 12. Monitoramento
- [ ] Configurar alerta para health check failing
- [ ] Configurar alerta para taxa de erro > 5%
- [ ] Configurar alerta para rate limit atingido
- [ ] Configurar backup automático do banco (daily)

---

## ROLLBACK

### 13. Se algo der errado

#### Rollback Rápido
- [ ] Parar aplicação atual: `Ctrl+C` ou `kill <pid>`
- [ ] Restaurar versão anterior do código (git checkout <tag>)
- [ ] Restaurar `.env` anterior
- [ ] Rebuild: `npm run build`
- [ ] Restart: `npm run start:prod`

#### Rollback de Banco
- [ ] Restaurar backup: `psql -U postgres -d banco < backup.sql`
- [ ] Ou reverter migration: `npx prisma migrate resolve --rolled-back <migration_name>`
- [ ] Verificar integridade dos dados

#### Validação Pós-Rollback
- [ ] Testar health check
- [ ] Testar login
- [ ] Verificar logs
- [ ] Confirmar estabilidade

---

## COMANDOS ÚTEIS

```bash
# Instalar dependências
npm install --production

# Gerar Prisma Client
npx prisma generate

# Validar schema
npx prisma validate

# Aplicar migrations
npx prisma migrate deploy

# Status das migrations
npx prisma migrate status

# Executar seed
npm run prisma:seed

# Build
npm run build

# Iniciar produção
npm run start:prod

# Health checks
curl http://localhost:3000/health/live
curl http://localhost:3000/health/ready

# Ver logs
tail -f logs/app.log
```

---

## CONTATOS DE EMERGÊNCIA

| Role | Contato |
|------|---------|
| DevOps | ___ |
| Backend | ___ |
| Frontend | ___ |
| DBA | ___ |

---

## HISTÓRICO DE DEPLOY

| Data | Versão | Deploy | Rollback | Observação |
|------|--------|--------|----------|------------|
| ___/___/___ | ___ | ☐ | ☐ | ___ |

---

**Última atualização:** 24/06/2026  
**Próxima revisão:** Após smoke test
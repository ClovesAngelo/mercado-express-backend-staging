# RELATÓRIO DE EXECUÇÃO DE STAGING — MERCADO EXPRESS

**Data/Hora:** ___/___/___ ___:___  
**Executado por:** _________________  
**Ambiente:** Staging  
**Branch/Commit:** _________________

---

## FASE 1 — PRÉ-DEPLOY

### Validações de Ambiente

| Item | Status | Observação |
|------|--------|------------|
| Variáveis de ambiente configuradas | ☐ | |
| DATABASE_URL aponta para banco de staging | ☐ | |
| JWT_SECRET forte (32+ caracteres) | ☐ | |
| CORS_ORIGINS com domínio correto | ☐ | |
| Supabase keys configuradas | ☐ | |
| Prisma Client gerado | ☐ | |
| Prisma validate passando | ☐ | |
| Build backend passando | ☐ | |
| Build frontend passando | ☐ | |

**Resultado:** ☐ APROVADO  ☐ REPROVADO

---

## FASE 2 — BANCO DE STAGING

### Execução de Migrations

```bash
npx prisma migrate deploy
```

**Status:** ☐ SUCESSO  ☐ FALHOU  
**Output:** _________________

### Status das Migrations

```bash
npx prisma migrate status
```

**Status:** ☐ APLICADAS  ☐ PENDENTES  
**Output:** _________________

### Seed de Staging

```bash
npm run prisma:seed
```

**Status:** ☐ EXECUTADO  ☐ NÃO NECESSÁRIO  ☐ FALHOU

### Dados Confirmados

| Item | Status | Observação |
|------|--------|------------|
| Admin criado | ☐ | |
| Cliente criado | ☐ | |
| Mercado criado | ☐ | |
| Gestor criado | ☐ | |
| Categorias criadas (3) | ☐ | |
| Produtos criados (5+) | ☐ | |

**Resultado:** ☐ APROVADO  ☐ REPROVADO

---

## FASE 3 — HEALTH CHECKS

### GET /health/live

```bash
curl http://localhost:3000/health/live
```

**Status HTTP:** ___  
**Response:** _________________  
**Critério:** `{"status":"ok"}`  
**Resultado:** ☐ APROVADO  ☐ FALHOU

### GET /health/ready

```bash
curl http://localhost:3000/health/ready
```

**Status HTTP:** ___  
**Response:** _________________  
**Critério:** `{"status":"ready","database":"connected"}`  
**Resultado:** ☐ APROVADO  ☐ FALHOU

**Tempo de resposta:** ___ms

---

## FASE 4 — SMOKE TEST MANUAL

### Resultado por Item

| # | Item | Status | Observação |
|---|------|--------|------------|
| 1 | Health check live | ☐ | |
| 2 | Health check ready | ☐ | |
| 3 | Registro | ☐ | |
| 4 | Login válido | ☐ | |
| 5 | Login inválido | ☐ | |
| 6 | Listagem de mercados | ☐ | |
| 7 | Criação de mercado | ☐ | |
| 8 | Criação de gestor | ☐ | |
| 9 | Login de gestor | ☐ | |
| 10 | Criação de produto | ☐ | |
| 11 | Upload de imagem | ☐ | |
| 12 | Listagem de produtos | ☐ | |
| 13 | Carrinho | ☐ | |
| 14 | Checkout | ☐ | |
| 15 | Atualização de status | ☐ | |
| 16 | Logs de auditoria | ☐ | |

**Total:** ___/16 aprovados

### Itens com Falha

| # | Item | Falha | Severidade |
|---|------|-------|------------|
| ___ | ___ | ___ | ☐ BAIXA  ☐ MÉDIA  ☐ ALTA  ☐ CRÍTICA |

### Itens Bloqueados

| # | Item | Motivo do Bloqueio |
|---|------|-------------------|
| ___ | ___ | ___ |

**Resultado:** ☐ APROVADO (≥14/16)  ☐ APROVADO COM RESTRIÇÕES (10-13)  ☐ REPROVADO (<10)

---

## FASE 5 — LOGS E AUDITORIA

### Validação de Logs

| Item | Status | Observação |
|------|--------|------------|
| Nenhum log contém senha | ☐ | |
| Nenhum log contém JWT | ☐ | |
| Erros possuem contexto suficiente | ☐ | |
| AuditLog registra ações críticas | ☐ | |
| Upload não expõe service role key | ☐ | |

### Registros de Auditoria Encontrados

| Ação | Entidade | Qtd |
|------|----------|-----|
| ___ | ___ | ___ |
| ___ | ___ | ___ |

**Resultado:** ☐ APROVADO  ☐ REPROVADO

---

## FASE 6 — BUGS ENCONTRADOS

### Bugs Críticos (bloqueiam deploy)

| # | Bug | Passos para Reproduzir | Impacto |
|---|-----|------------------------|---------|
| ___ | ___ | ___ | ___ |

### Bugs Altos (não bloqueiam mas devem ser corrigidos)

| # | Bug | Passos para Reproduzir | Impacto |
|---|-----|------------------------|---------|
| ___ | ___ | ___ | ___ |

### Bugs Médios/Baixos

| # | Bug | Passos para Reproduzir | Impacto |
|---|-----|------------------------|---------|
| ___ | ___ | ___ | ___ |

---

## DECISÃO FINAL

### Opções:

- [ ] **APROVADO PARA TESTES DE USUÁRIO**
  - Todos os health checks passaram
  - Smoke test: ___/16 aprovados (mínimo 14)
  - Nenhum bug crítico
  - Logs limpos

- [ ] **APROVADO COM RESTRIÇÕES**
  - Health checks passaram
  - Smoke test: ___/16 aprovados
  - Bugs altos identificados
  - Restrições documentadas abaixo

- [ ] **REPROVADO PARA STAGING**
  - Motivo: _________________
  - Ações necessárias: _________________

### Restrições (se aplicável)

| # | Restrição | Prazo para Correção |
|---|-----------|---------------------|
| ___ | ___ | ___ |

### Ações Imediatas Necessárias

| # | Ação | Responsável | Prazo |
|---|------|-------------|-------|
| ___ | ___ | ___ | ___ |

---

## PRÓXIMOS PASSOS

### Se Aprovado:
- [ ] Monitorar logs por 48h
- [ ] Coletar feedback de usuários teste
- [ ] Corrigir bugs encontrados
- [ ] Recrear testes automatizados
- [ ] Preparar para produção

### Se Reprovado:
- [ ] Corrigir bugs críticos
- [ ] Reexecutar smoke test
- [ ] Reavaliar decisão

---

## ASSINATURAS

**Executado por:** _________________  
**Data:** ___/___/___  
**Hora:** ___:___

**Revisado por:** _________________  
**Data:** ___/___/___  
**Hora:** ___:___

---

**Anexos:**
- [ ] Screenshots de health checks
- [ ] Logs de inicialização
- [ ] Logs de auditoria
- [ ] Evidências de bugs (se houver)
# Staging GO/NO-GO

Documento que define os critérios objetivos para liberar ou bloquear o deploy de staging do Mercado Express.

**Importante:**
- build passando sozinho não significa GO;
- documentação criada não significa GO;
- staging só é GO se os critérios técnicos e funcionais forem atendidos.

---

## 1. Objetivo

Este documento define critérios objetivos para a decisão de deploy em staging, garantindo que apenas ambientes validados e funcionais sejam publicados.

---

## 2. Estado atual conhecido

| Área | Estado | Observação |
|------|--------|------------|
| Backend | NÃO VALIDADO | Aguardando deploy e smoke test |
| Frontend | NÃO VALIDADO | Aguardando deploy e smoke test |
| Banco/migrations | NÃO VALIDADO | Aguardando aplicação em staging |
| Secrets/envs | NÃO VALIDADO | Aguardando configuração em staging |
| Supabase Storage | NÃO VALIDADO | Aguardando teste de upload |
| Testes unitários | NÃO VALIDADO | Aguardando execução |
| Testes E2E | NÃO VALIDADO | Aguardando execução |
| Smoke test | NÃO VALIDADO | Aguardando execução |
| Múltiplos gestores | NÃO VALIDADO | Aguardando validação funcional |
| Vínculo gestor/mercado | NÃO VALIDADO | Aguardando validação funcional |
| Rate limiting | NÃO VALIDADO | Aguardando teste em staging |
| Health checks | NÃO VALIDADO | Aguardando deploy |

**Estados possíveis:**
- PRONTO: validado e funcionando
- PENDENTE: aguardando ação
- RISCO ACEITO: problema conhecido com mitigação
- BLOQUEADO: impede deploy
- NÃO VALIDADO: ainda não testado

---

## 3. Critérios obrigatórios para GO

O staging só pode ser GO se TODOS os itens abaixo estiverem verdadeiros:

- [ ] Backend build passa
- [ ] Frontend build passa
- [ ] `npm run test` passa
- [ ] `npx prisma validate` passa
- [ ] `npx prisma migrate status` verificado
- [ ] Migration versionada dos múltiplos gestores existe ou está formalmente marcada como bloqueador resolvido
- [ ] `prisma db push` não é usado para staging
- [ ] Backend inicia em modo produção
- [ ] `/health/live` responde
- [ ] `/health/ready` responde
- [ ] Env vars de staging configuradas
- [ ] Nenhum secret real em arquivo versionado
- [ ] `SUPABASE_SERVICE_ROLE_KEY` rotacionada ou risco aceito formalmente
- [ ] Frontend usa `VITE_API_URL`
- [ ] CORS permite domínio do frontend staging
- [ ] Login admin funciona
- [ ] Página de gestores mostra mercado vinculado
- [ ] Dois gestores no mesmo mercado aparecem corretamente
- [ ] Editar gestor não desvincula outro gestor
- [ ] Gestão de mercados mostra múltiplos gestores
- [ ] Upload de imagem funciona
- [ ] Carrinho/checkout funcionam
- [ ] Rate limiting protege login/register
- [ ] `GET /markets` não retorna 429 em uso normal
- [ ] Logs não expõem senha/token/secret
- [ ] Smoke test real tem pelo menos 22/25 aprovados
- [ ] Smoke test tem 0 falhas críticas

---

## 4. Critérios automáticos de NO-GO

Qualquer item abaixo deve bloquear staging automaticamente:

- [ ] Migration dos múltiplos gestores ainda depende de `prisma db push`
- [ ] Banco precisa de `migrate reset`
- [ ] Backend não inicia
- [ ] `/health/ready` falha
- [ ] Frontend chama localhost em staging
- [ ] CORS bloqueia frontend
- [ ] Login admin falha
- [ ] Vínculo gestor/mercado não aparece
- [ ] Múltiplos gestores não aparecem corretamente
- [ ] Upload de imagem falha
- [ ] Checkout falha
- [ ] Logs exibem senha/token/secret
- [ ] Testes unitários falham
- [ ] Build backend falha
- [ ] Build frontend falha
- [ ] `GET /markets` retorna 429 em uso normal

---

## 5. Riscos aceitos possíveis

Registrar riscos formalmente aceitos:

| Risco | Severidade | Aceito? | Justificativa | Responsável | Data |
|-------|------------|---------|---------------|-------------|------|
| Testes E2E incompletos | MÉDIO | [ ] | | | |
| Service role key já exposta anteriormente, mas rotacionada | ALTO | [ ] | | | |
| Monitoramento ainda manual | BAIXO | [ ] | | | |
| CI/CD ainda não implementado | MÉDIO | [ ] | | | |
| `Market.managerId` legado ainda existe, mas não é fonte de verdade | BAIXO | [ ] | | | |

**Severidades:**
- CRÍTICO: impede deploy, causa perda de dados ou falha de segurança
- ALTO: funcionalidade principal quebrada
- MÉDIO: funcionalidade secundária afetada
- BAIXO: problema visual ou de usabilidade menor

---

## 6. Pendências que não bloqueiam staging

Listar pendências que podem ficar para depois se não afetarem fluxo principal:

- melhorar CI/CD
- ampliar E2E
- monitoramento avançado
- dashboards de observabilidade
- ajustes visuais menores
- documentação comercial
- otimização de performance

**Aviso:** isso só vale se não houver falha crítica.

---

## 7. Pendências que bloqueiam staging

Listar pendências bloqueadoras:

- migration versionada ausente
- vínculo gestor/mercado quebrado
- múltiplos gestores não validados
- envs de staging ausentes
- Supabase Storage não funcional
- backend sem health ready
- frontend sem API staging
- testes unitários falhando
- logs com secrets

---

## 8. Processo de decisão

Fluxo de decisão:

```
1. Executar validações técnicas
   ↓
2. Executar deploy backend staging
   ↓
3. Executar deploy frontend staging
   ↓
4. Executar STAGING_SMOKE_TEST_REAL.md
   ↓
5. Registrar bugs
   ↓
6. Classificar falhas
   ↓
7. Aplicar critérios GO/NO-GO
   ↓
8. Registrar decisão final
```

---

## 9. Registro da decisão

Preencher após avaliação:

```
Data:
Responsável:
Branch:
Commit:
Backend URL:
Frontend URL:

Resultado técnico:
Resultado smoke test:
Falhas críticas:
Riscos aceitos:

Decisão:
[ ] GO
[ ] GO COM RESTRIÇÕES
[ ] NO-GO

Justificativa:
```

---

## 10. Ações pós-decisão

### Se GO:

- liberar testes de usuário
- monitorar logs
- manter rollback pronto
- registrar bugs menores

### Se GO com restrições:

- listar restrições
- definir prazo para correção
- limitar escopo de teste

### Se NO-GO:

- listar bloqueadores
- corrigir bloqueadores
- repetir smoke test
- não avançar para produção

---

## Resumo

**GO requer:**
- Todos os critérios obrigatórios atendidos
- Nenhum critério automático de NO-GO violado
- 0 falhas críticas no smoke test
- 22/25 itens aprovados no smoke test

**NO-GO se:**
- Qualquer critério automático de NO-GO for verdadeiro
- Menos de 22 itens aprovados no smoke test
- Qualquer falha crítica no smoke test
- Riscos não aceitos formalmente
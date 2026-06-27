# 🚀 MERCADO EXPRESS — DEPLOY STAGING CLOUD

Este é o ponto de partida para o deploy do staging em cloud.

---

## 📚 DOCUMENTOS DISPONÍVEIS

### 1. **DEPLOY_STAGING_CLOUD_README.md** (este arquivo)
Índice geral e visão rápida do processo.

### 2. **DEPLOY_STAGING_CLOUD.md**
Documento principal com todas as fases detalhadas.

### 3. **DEPLOY_STAGING_CLOUD_GUIA.md**
Guia completo com instruções passo a passo, troubleshooting e comandos úteis.

### 4. **DEPLOY_STAGING_CLOUD_EXECUTAR.md**
Guia executável com ações exatas para cada plataforma.

### 5. **DEPLOY_STAGING_CLOUD_CHECKLIST.md**
Checklist interativo para marcar o progresso do deploy.

### 6. **STAGING_SMOKE_TEST_REAL.md**
Checklist de smoke test com 25 itens para validar o deploy.

---

## 🎯 PLATAFORMAS ESCOLHIDAS

| Componente | Plataforma | Motivo |
|------------|-----------|--------|
| **Backend** | Render | Simples, gratuito para staging, bom suporte a Node.js |
| **Frontend** | Vercel | Melhor plataforma para apps Vite/React, deploy instantâneo |
| **Banco/Storage** | Supabase | PostgreSQL gerenciado, storage integrado, fácil configuração |

---

## ⚡ RESUMO EXECUTIVO

### O que você precisa fazer:

1. **Supabase** (5 min)
   - Criar projeto
   - Obter credenciais
   - Criar bucket `market-images`
   - Configurar RLS

2. **Render** (10 min)
   - Criar Web Service
   - Configurar variáveis de ambiente
   - Fazer deploy
   - Validar health checks

3. **Vercel** (5 min)
   - Atualizar `frontend/.env.staging`
   - Criar projeto
   - Configurar variáveis
   - Fazer deploy

4. **CORS** (2 min)
   - Atualizar `CORS_ORIGINS` no Render
   - Validar login

5. **Smoke Test** (15 min)
   - Executar 25 testes
   - Validar critérios mínimos

6. **Relatório** (5 min)
   - Criar `RELATORIO_DEPLOY_STAGING_CLOUD.md`
   - Documentar decisão

**Tempo total estimado:** ~40 minutos

---

## 📋 PRÉ-REQUISITOS

- [ ] Conta no Render (https://render.com)
- [ ] Conta no Vercel (https://vercel.com)
- [ ] Conta no Supabase (https://supabase.com)
- [ ] Código commitado no Git
- [ ] Node.js 18+ instalado

---

## 🔑 CREDENCIAIS NECESSÁRIAS

Você precisará coletar estas credenciais:

### Supabase
```
SUPABASE_URL=https://[PROJECT_REF].supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
```

### Render (você vai criar)
```
JWT_SECRET=[chave-forte-32+caracteres]
```

---

## 🚦 ORDEM DE EXECUÇÃO

Siga esta ordem rigorosamente:

```
1. Supabase (banco)
   ↓
2. Render (backend)
   ↓
3. Vercel (frontend)
   ↓
4. CORS (configuração)
   ↓
5. Smoke Test (validação)
   ↓
6. Relatório (documentação)
```

**Por que essa ordem?**
- O backend precisa do banco (Supabase) para funcionar
- O frontend precisa da URL do backend para funcionar
- O CORS precisa da URL do frontend para funcionar
- O smoke test precisa de tudo funcionando

---

## ✅ CRITÉRIOS DE SUCESSO

### Mínimo obrigatório:
- [ ] Backend respondendo na URL cloud
- [ ] Frontend respondendo na URL cloud
- [ ] Health checks retornam 200
- [ ] Frontend chama backend cloud (não localhost)
- [ ] CORS funcionando
- [ ] Login admin funciona
- [ ] 22/25 testes do smoke test aprovados
- [ ] 0 falhas críticas
- [ ] 0 vazamento de secrets

### Decisão final:
- [ ] **APROVADO PARA TESTES DE USUÁRIO** (todos os critérios atendidos)
- [ ] **APROVADO COM RESTRIÇÕES** (alguns testes menores falharam)
- [ ] **REPROVADO** (falhas críticas ou segurança comprometida)

---

## 🚨 SEGURANÇA — ATENÇÃO OBRIGATÓRIA

### ⚠️ ALERTA CRÍTICO

O arquivo `backend/.env` contém a `SUPABASE_SERVICE_ROLE_KEY` exposta.

**Ações obrigatórias:**
1. **Rotacionar a chave** no Supabase Dashboard (Settings → API)
2. **Atualizar a variável** no Render após deploy
3. **NUNCA commitar** o arquivo `.env`
4. **Verificar** que `.env` está no `.gitignore`

### Regras de segurança:

- ❌ NUNCA usar `prisma db push`
- ❌ NUNCA usar `migrate reset`
- ❌ NUNCA commitar `.env`
- ❌ NUNCA imprimir secrets em relatórios
- ❌ NUNCA colocar service role key no frontend
- ❌ NUNCA deixar frontend chamando localhost
- ❌ NUNCA ignorar erro de CORS
- ❌ NUNCA marcar aprovado sem smoke test
- ❌ NUNCA chamar staging de produção

- ✅ SEMPRE usar `prisma migrate deploy`
- ✅ SEMPRE configurar envs na plataforma
- ✅ SEMPRE validar health checks públicos
- ✅ SEMPRE validar frontend chamando backend cloud
- ✅ SEMPRE executar smoke test real
- ✅ SEMPRE registrar bugs
- ✅ SEMPRE manter decisão honesta

---

## 📊 FLUXO DE TRABALHO

```
┌─────────────────────────────────────────┐
│  1. Ler DEPLOY_STAGING_CLOUD_GUIA.md   │
│     (instruções completas)              │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│  2. Abrir DEPLOY_STAGING_CLOUD_        │
│     CHECKLIST.md                        │
│     (marcar progresso)                  │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│  3. Executar Fase 1 — Supabase          │
│     (criar banco, bucket, RLS)          │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│  4. Executar Fase 2 — Render            │
│     (deploy backend)                    │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│  5. Executar Fase 3 — Vercel           │
│     (deploy frontend)                   │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│  6. Executar Fase 4 — CORS             │
│     (atualizar CORS_ORIGINS)            │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│  7. Executar Fase 5 — Smoke Test       │
│     (25 testes obrigatórios)            │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│  8. Executar Fase 6 — Relatório        │
│     (criar RELATORIO_DEPLOY_           │
│      STAGING_CLOUD.md)                  │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│  9. Tomar decisão final                 │
│     (APROVADO / APROVADO C/             │
│      RESTRIÇÕES / REPROVADO)            │
└─────────────────────────────────────────┘
```

---

## 🆘 TROUBLESHOOTING RÁPIDO

### Backend não inicia
→ Verificar `DATABASE_URL`, `JWT_SECRET` (32+ chars), logs do Render

### Erro de CORS
→ Verificar `CORS_ORIGINS`, URL do frontend, protocolo HTTPS

### Frontend não carrega variáveis
→ Verificar prefixo `VITE_`, Vercel Dashboard, novo deploy

### Banco não conecta
→ Verificar `DATABASE_URL`, senha, projeto Supabase ativo

---

## 📞 SUPORTE

- **Render:** https://render.com/docs
- **Vercel:** https://vercel.com/docs
- **Supabase:** https://supabase.com/docs
- **Prisma:** https://www.prisma.io/docs

---

## 📝 NOTAS

**Data de início:** ___/___/______
**Data de conclusão:** ___/___/______
**Responsável:** _________________

**Observações:**
```
[Adicione observações relevantes aqui]
```

---

## 🎯 PRÓXIMO PASSO

**Comece por aqui:**

1. Abra `DEPLOY_STAGING_CLOUD_CHECKLIST.md`
2. Marque os pré-requisitos
3. Siga a Fase 1 — Supabase
4. Consulte `DEPLOY_STAGING_CLOUD_GUIA.md` para detalhes

**Boa sorte! 🚀**
# Relatório de Análise de Problemas - Mercado Express

**Data:** 25/06/2026
**Analista:** Revisão Técnica
**Status:** Análise Completa

---

## 🔴 PROBLEMA 1: Arquivos Compilados (.js, .d.ts, .js.map) Poluindo `src/`

### Severidade: ALTA

### Descrição
Existem **40+ arquivos `.js`**, **35+ arquivos `.d.ts`** e **40+ arquivos `.js.map`** dentro da pasta `backend/src/` misturados com os arquivos fonte `.ts`. 

Isso ocorre porque o TypeScript compiler (`declaration: true`, `sourceMap: true`) anteriormente estava compilando na própria pasta `src/` ao invés de apenas no `dist/`.

### Impacto
1. **Confusão no desenvolvimento** - O VS Code e o TypeScript podem conflitar entre os arquivos `.ts` e `.js` com mesmo nome, causando erros de compilação inesperados
2. **Código antigo** - O arquivo `users.controller.js` contém uma versão **totalmente diferente** (mais antiga) do que o `users.controller.ts` atual. Se alguém acidentalmente importar o `.js` em vez do `.ts`, usará código incorreto.
3. **Tamanho do projeto inchado** - Quase 120 arquivos extras desnecessários
4. **Possíveis conflitos no Git** - Arquivos compilados sendo versionados

### Arquivos .js problemáticos em src/ (exemplos):
- `src/app.controller.js` (vs app.controller.ts)
- `src/users/users.controller.js` (versão **antiga** - sem Guards, sem Logger, sem Roles)
- `src/auth/auth.service.js`
- `src/orders/orders.service.js`
- `src/cart/cart.service.js`
- `src/prisma/prisma.service.js`
- E mais 35+ arquivos...

### Solução Aplicada
Os arquivos `.js`, `.d.ts` e `.js.map` em `backend/src/` foram removidos. A compilação deve gerar saída apenas em `backend/dist/` conforme configurado no `tsconfig.json` (`outDir: "./dist"`).

---

## 🔴 PROBLEMA 2: Duas Instâncias Axios (api.ts vs apiClient.ts)

### Severidade: ALTA

### Descrição
Existem DOIS arquivos de configuração Axios no frontend:
- `frontend/src/services/api.ts` - Usado por `Home.tsx`
- `frontend/src/services/apiClient.ts` (mencionado em relatórios anteriores)

### Impacto
Manutenção duplicada, risco de configurações inconsistentes entre os services.

---

## 🟡 PROBLEMA 3: .env com Segredos Expostos

### Severidade: ALTA (Segurança)

### Descrição
O arquivo `backend/.env` contém:
- `JWT_SECRET="mercado-express-jwt-secret-key-2024"` - Secret fraca e conhecida
- `SUPABASE_SERVICE_ROLE_KEY` - Chave de administração do Supabase exposta
- `DATABASE_URL` com senha em texto puro

### Nota
O código-fonte foi corrigido (auth.module.ts e jwt.strategy.ts agora usam `ConfigService`), mas o `.env` ainda tem valores inseguros para produção.

---

## 🟡 PROBLEMA 4: Nenhum Teste Implementado

### Severidade: ALTA

### Descrição
Os 5 testes unitários e 2 testes E2E foram removidos anteriormente por incompatibilidade. Atualmente apenas 1 teste de health check E2E existe.

---

## 🟢 PROBLEMA 5: Dependências Atualizadas

### Severidade: MÉDIA (para desenvolvimento)

### Descrição
Backend usa NestJS ^11.0.1, TypeScript ^5.7.3, Prisma ^5.22.0. Todas as dependências estão razoavelmente atualizadas.

---

## ✅ CORREÇÕES JÁ APLICADAS ANTERIORMENTE

| # | Problema | Status | Onde |
|---|----------|--------|------|
| 1 | Senha de gestor sem hash | ✅ CORRIGIDO | managers.service.ts (linha 73-79) |
| 2 | JWT secret hardcoded no código | ✅ CORRIGIDO | auth.module.ts + jwt.strategy.ts usam ConfigService |
| 3 | CORS hardcoded para localhost | ✅ CORRIGIDO | main.ts agora lê de CORS_ORIGINS env |
| 4 | ConfigModule não importado | ✅ CORRIGIDO | app.module.ts importa ConfigModule.forRoot() |
| 5 | Validação de envs obrigatórias | ✅ CORRIGIDO | main.ts valida na inicialização |
| 6 | Health check endpoint | ✅ CORRIGIDO | health/health.controller.ts |
| 7 | Rate limiting (ThrottlerModule) | ✅ CORRIGIDO | app.module.ts configurado |
| 8 | AuditLog integrado | ✅ CORRIGIDO | audit/ integrado em controllers |
| 9 | NestJS atualizado para v11 | ✅ CORRIGIDO | package.json |

---

## 📋 RESUMO

### O que atrapalha o funcionamento AGORA:
1. **⚠️ Arquivos .js em src/** (corrigido nesta análise) - causava confusão e risco de usar código errado
2. **⚠️ Duas instâncias Axios** - confusão de importação no frontend
3. **⚠️ .env com segredos expostos** - risco de segurança

### O que foi corrigido antes e está funcionando:
- Hash de senha ✅
- JWT via env ✅
- CORS dinâmico ✅
- ConfigModule ✅
- Health check ✅
- Rate limiting ✅
- AuditLog ✅

### Recomendações
1. **Limpar os arquivos .js/.d.ts/.js.map de `backend/src/`** ✅ (feito)
2. **Unificar api.ts e apiClient.ts** em um único service
3. **Configurar JWT_SECRET forte e rotacionar chaves Supabase** para produção
4. **Reimplementar testes unitários** alinhados com o código real
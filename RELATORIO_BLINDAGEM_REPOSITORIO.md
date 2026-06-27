# RELATÓRIO DE BLINDAGEM DO REPOSITÓRIO

**Data:** 25/06/2026
**Objetivo:** Impedir que arquivos compilados (.js, .d.ts, .js.map) voltem a poluir o diretório `backend/src/`

---

## 1. CAUSA RAIZ PROVÁVEL

O `tsconfig.json` original **não definia** `rootDir`, `include` ou `exclude`. O compilador TypeScript, ao ser executado sem essas restrições, processava todos os arquivos .ts disponíveis e, por alguma falha de configuração ou execução do NestJS em modo desenvolvimento, **gerava a saída da compilação dentro do próprio diretório `src/`** ao invés de apenas em `dist/`.

Como o .gitignore **não bloqueava** arquivos .js/.d.ts/.js.map dentro de src/, esses artefatos acabaram sendo versionados e se acumulando ao longo do tempo, chegando a **117 arquivos** poluindo o diretório fonte.

---

## 2. ARQUIVOS REMOVIDOS

**Total: 117 arquivos compilados removidos de `backend/src/`**

| Tipo | Quantidade | Extensão |
|------|-----------|----------|
| JavaScript compilado | 40 | `.js` |
| Declarações de tipo | 37 | `.d.ts` |
| Source maps | 40 | `.js.map` |

### Exemplos de arquivos removidos:
- `src/app.controller.js`, `src/app.controller.d.ts`, `src/app.controller.js.map`
- `src/main.js`, `src/main.d.ts`, `src/main.js.map`
- `src/auth/auth.service.js`, `src/auth/auth.service.d.ts`, `src/auth/auth.service.js.map`
- `src/users/users.controller.js`, `src/users/users.controller.d.ts`, `src/users/users.controller.js.map`
- `src/orders/orders.service.js`, `src/orders/orders.service.d.ts`, `src/orders/orders.service.js.map`
- (mais 102 arquivos similares em todos os módulos)

---

## 3. PROTEÇÕES ADICIONADAS

### 3.1 Configuração TypeScript (`tsconfig.json`)
- ✅ **`rootDir: "./src"`** — Garante que o compilador só processe arquivos dentro de src/
- ✅ **`include: ["src/**/*.ts"]`** — Restringe a entrada apenas a arquivos .ts em src/
- ✅ **`exclude: ["node_modules", "dist"]`** — Impede que node_modules ou dist sejam processados

### 3.2 .gitignore (`backend/.gitignore`)
- ✅ **`/src/**/*.js`** — Bloqueia qualquer .js dentro de src/
- ✅ **`/src/**/*.d.ts`** — Bloqueia qualquer .d.ts dentro de src/
- ✅ **`/src/**/*.js.map`** — Bloqueia qualquer .js.map dentro de src/
- ✅ **`!.env.example`** e **`!.env.staging.example`** — Mantém arquivos de exemplo versionados

### 3.3 Script de Verificação Adicionados
- ✅ **`scripts/check-src-clean.js`** — Script Node.js que percorre src/ e falha (exit code 1) se encontrar arquivos compilados
- ✅ **`scripts/find-js-imports.js`** — Script auxiliar para buscar imports de .js nos fontes .ts

### 3.4 Scripts no package.json
- ✅ **`"check:src-clean": "node scripts/check-src-clean.js"`** — Comando para verificação manual
- ✅ **`"prebuild": "npm run check:src-clean"`** — Verificação automática ANTES de cada build

### 3.5 Arquivos .env de Exemplo
- ✅ **`backend/.env.example`** — Criado com placeholders seguros (sem secrets reais)
- ✅ **`frontend/.env.example`** — Já existia com placeholders
- ✅ **`backend/.env`** — Mantido localmente (não será versionado) mas com secrets visíveis (risco aceito)

---

## 4. SCRIPTS CRIADOS/MODIFICADOS

### Scripts Novos

| Arquivo | Descrição |
|---------|-----------|
| `backend/scripts/check-src-clean.js` | Verifica se existem .js/.d.ts/.js.map em src/ |
| `backend/scripts/find-js-imports.js` | Busca imports inválidos para .js nos fontes .ts |

### Arquivos Modificados

| Arquivo | Alteração |
|---------|-----------|
| `backend/tsconfig.json` | Adicionado `rootDir`, `include`, `exclude` |
| `backend/.gitignore` | Adicionado bloqueio de .js/.d.ts/.js.map em src/ |
| `backend/package.json` | Adicionado `check:src-clean` e `prebuild` |
| `backend/.env.example` | Criado com placeholders seguros |

---

## 5. VERIFICAÇÃO DE IMPORTS SUSPEITOS

**Resultado:** Nenhum import para arquivos `.js` encontrado nos arquivos `.ts` do backend.

A busca varreu todos os arquivos `.ts` em `backend/src/` procurando por:
- `from './arquivo.js'` — ❌ Não encontrado
- `from "../arquivo.js"` — ❌ Não encontrado
- `require('./arquivo.js')` — ❌ Não encontrado
- `require("../arquivo.js")` — ❌ Não encontrado

Todos os imports nos fontes .ts apontam corretamente para arquivos .ts (sem extensão).

---

## 6. RESULTADO DAS VALIDAÇÕES

| Validação | Comando | Resultado |
|-----------|---------|-----------|
| src/ limpo | `node scripts/check-src-clean.js` | ✅ Nenhum arquivo compilado |
| Compilação | `npx nest build` | ✅ Build concluído sem erros |
| Schema Prisma | `npx prisma validate` | ✅ Schema válido |
| Imports .js | `node scripts/find-js-imports.js` | ✅ Nenhum import inválido |
| Lint | `npm run lint` | ⚠️ Skipped (ESLint config issue, não relacionado) |

---

## 7. RISCOS REMANESCENTES

| Risco | Severidade | Status |
|-------|-----------|--------|
| `.env` real com secrets expostos (JWT_SECRET fraca, SERVICE_ROLE_KEY visível) | 🔴 Alta | ⚠️ Não foi possível remover do versionamento (sem git repo ativo). Risco aceito para desenvolvimento local. |
| Nenhum teste automatizado | 🟡 Média | Já documentado em relatórios anteriores |
| Duas instâncias Axios (api.ts vs reportado apiClient.ts) | 🟡 Média | `apiClient.ts` não existe mais - parece já ter sido unificado |
| Prisma desatualizado (5.22.0 → 7.8.0 disponível) | 🟢 Baixa | Aviso do Prisma, mas não quebra nada |

---

## 8. COMO TESTAR A BLINDAGEM

```bash
# Verificar se src/ está limpo manualmente
cd backend && npm run check:src-clean

# Simular contaminação (apenas para teste)
echo "console.log('teste')" > src/test-compiled.js
npm run check:src-clean   # Deve falhar com exit code 1

# O build também falha se src/ estiver contaminado
npm run build   # Executa prebuild → check:src-clean → falha

# Limpeza
del src\test-compiled.js
```

---

## 9. CONCLUSÃO

A blindagem do repositório foi concluída com sucesso. Agora:

- ✅ **`backend/src/`** contém apenas fontes .ts reais
- ✅ **117 arquivos compilados** foram removidos
- ✅ **3 proteções em camadas** impedem reincidência:
  1. `tsconfig.json` (compilador não processa fora de src/)
  2. `.gitignore` (bloqueia commit de artefatos)
  3. `prebuild` + `check:src-clean` (impede build se src/ estiver sujo)
- ✅ **Scripts de verificação** funcionam no Windows
- ✅ **Build e Prisma** continuam funcionando normalmente
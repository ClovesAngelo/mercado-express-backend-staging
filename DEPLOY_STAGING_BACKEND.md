# Deploy Backend — Staging

Guia prático para subir o backend NestJS em ambiente de staging.

---

## 1. Objetivo

Este documento orienta o deploy real do backend em ambiente de staging, garantindo que todas as etapas de preparação, migração, build e validação sejam executadas de forma segura e reproduzível.

---

## 2. Pré-requisitos

Antes de iniciar o deploy, verifique:

- Node.js compatível com o projeto (versão definida em `backend/package.json`)
- npm instalado
- acesso ao repositório
- acesso ao banco Supabase de staging
- acesso ao Supabase Storage
- variáveis de ambiente configuradas em `.env.staging`
- migration versionada existente antes do deploy
- service role key rotacionada, se já tiver sido exposta

---

## 3. Variáveis de ambiente obrigatórias

O backend utiliza as seguintes variáveis em staging:

```env
# Banco de dados (Supabase/PostgreSQL)
DATABASE_URL=

# Autenticação JWT
JWT_SECRET=

# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# CORS
CORS_ORIGINS=

# Ambiente
NODE_ENV=staging

# Porta
PORT=
```

### Descrição breve

- `DATABASE_URL`: conexão com o banco PostgreSQL/Supabase.
- `JWT_SECRET`: segredo para assinatura de tokens JWT (usar valor forte e único).
- `SUPABASE_URL`: URL do projeto Supabase.
- `SUPABASE_ANON_KEY`: chave anônima para operações públicas.
- `SUPABASE_SERVICE_ROLE_KEY`: chave com privilégios administrativos (nunca expor ao frontend).
- `CORS_ORIGINS`: origens permitidas para requisições cross-origin.
- `NODE_ENV`: ambiente de execução (`staging`).
- `PORT`: porta onde o servidor irá escutar.

### Regras de segurança

- não commitar `.env.staging`
- usar `JWT_SECRET` forte e exclusivo para staging
- não reutilizar secret de dev em staging
- não colocar `SUPABASE_SERVICE_ROLE_KEY` no frontend

---

## 4. Preparação local antes do deploy

Execute na pasta `backend`:

```bash
cd backend
npm install
npm run check:src-clean
npx prisma validate
npm run test
npm run build
```

Se existir script `npm run prisma:validate`, também pode ser utilizado como alternativa.

---

## 5. Aplicação de migrations em staging

Staging deve usar exclusivamente:

```bash
npx prisma migrate deploy
```

### Alertas importantes

- **não usar** `npx prisma db push`
- **não usar** `npx prisma migrate reset`
- fazer backup antes de migrations estruturais
- confirmar `npx prisma migrate status` antes e depois

### Comandos

```bash
cd backend
npx prisma migrate status
npx prisma migrate deploy
npx prisma migrate status
```

---

## 6. Prisma Client

Após migrations, gere o Prisma Client:

```bash
npx prisma generate
```

Executar sempre que o schema for alterado.

---

## 7. Build e start

```bash
npm run build
npm run start:prod
```

`start:prod` depende de `dist/main.js` existir após o build.

---

## 8. Health checks

Endpoints de verificação:

```http
GET /health/live
GET /health/ready
```

### Resultado esperado

- `/health/live`: resposta `200 OK` quando o processo está ativo.
- `/health/ready`: resposta `200 OK` quando banco e dependências estão disponíveis.

---

## 9. Seed de staging

Apenas quando necessário e com dados fictícios:

```bash
npm run prisma:seed
```

### Alertas

- não rodar seed destrutivo em banco com dados reais
- usar apenas dados fictícios
- garantir senhas hasheadas

---

## 10. Logs

Verificar:

- erro de env ausente
- erro de conexão com banco
- erro de Supabase Storage
- erro de CORS
- erro de migration
- erro de JWT

### Regras

- logs não devem conter senha
- logs não devem conter token
- logs não devem conter service role key

---

## 11. Rollback

Procedimento:

1. Reverter deploy para commit anterior.
2. Restaurar variáveis de ambiente anteriores, se necessário.
3. Verificar `/health/live`.
4. Verificar `/health/ready`.
5. Avaliar rollback de migration manualmente.

### Alertas

- rollback de migration pode ser destrutivo
- não resetar banco sem backup
- preferir roll forward quando possível

---

## 12. Checklist rápido

- [ ] envs configuradas
- [ ] service role key rotacionada se necessário
- [ ] `check:src-clean` passou
- [ ] `prisma validate` passou
- [ ] testes passaram
- [ ] build passou
- [ ] migration versionada existe
- [ ] `migrate deploy` executado
- [ ] `/health/live` OK
- [ ] `/health/ready` OK
- [ ] logs sem secrets
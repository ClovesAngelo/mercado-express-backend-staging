# Deploy Frontend — Staging

Guia prático para subir o frontend React/Vite em ambiente de staging.

---

## 1. Objetivo

Este documento orienta o deploy real do frontend em ambiente de staging, garantindo que a aplicação seja buildada, publicada e validada corretamente, consumindo a API de staging.

---

## 2. Pré-requisitos

Antes de iniciar o deploy, verifique:

- Node.js compatível com o projeto (versão definida em `frontend/package.json`)
- npm instalado
- acesso ao repositório
- backend staging já publicado ou URL da API definida
- variável `VITE_API_URL` configurada
- plataforma de hospedagem escolhida
- domínio/subdomínio de staging, se houver

---

## 3. Variáveis de ambiente

O frontend utiliza a seguinte variável em staging:

```env
VITE_API_URL=
```

### Regras

- deve apontar para o backend staging
- exemplo: `https://api-staging.mercadoexpress.com.br`
- somente variáveis com prefixo `VITE_` são expostas pelo Vite
- nunca colocar `DATABASE_URL`
- nunca colocar `JWT_SECRET`
- nunca colocar `SUPABASE_SERVICE_ROLE_KEY`
- nunca colocar segredos privados no frontend

Arquivo de exemplo já existe: `frontend/.env.staging.example`

---

## 4. Preparação local antes do deploy

Execute na pasta `frontend`:

```bash
cd frontend
npm install
npm run build
```

Se existir script de lint/test no `package.json`, execute conforme definido:

```bash
npm run lint
npm run test
```

---

## 5. Teste local do build

Se existir script `preview`:

```bash
npm run preview
```

Verificar:

- aplicação abre corretamente
- chamadas vão para `VITE_API_URL`
- login funciona
- páginas principais carregam
- não há erro de CORS

---

## 6. Deploy em Vercel

Passo a passo:

1. Importar repositório na Vercel.
2. Selecionar pasta do frontend, se for monorepo.
3. Configurar build command.
4. Configurar output directory.
5. Configurar variável `VITE_API_URL`.
6. Executar deploy.
7. Validar URL gerada.

Valores típicos:

```txt
Build command: npm run build
Output directory: dist
```

Se o frontend estiver em subpasta:

```txt
Root directory: frontend
```

---

## 7. Deploy em Netlify

Passo a passo:

1. Importar repositório no Netlify.
2. Definir base directory.
3. Definir build command.
4. Definir publish directory.
5. Configurar env var `VITE_API_URL`.
6. Executar deploy.

Valores típicos:

```txt
Base directory: frontend
Build command: npm run build
Publish directory: frontend/dist
```

Ou, se o root já for frontend:

```txt
Publish directory: dist
```

---

## 8. Deploy em Cloudflare Pages

Passo a passo:

1. Importar repositório no Cloudflare Pages.
2. Framework preset: Vite/React.
3. Build command.
4. Build output directory.
5. Configurar `VITE_API_URL`.
6. Executar deploy.

Valores típicos:

```txt
Build command: npm run build
Build output directory: dist
```

---

## 9. Configuração de domínio

- subdomínio recomendado: `app-staging.seudominio.com`
- configurar DNS conforme plataforma
- atualizar CORS no backend staging para permitir o domínio do frontend
- exemplo:

```env
CORS_ORIGINS=https://app-staging.mercadoexpress.com.br
```

---

## 10. Validação pós-deploy

Checklist:

- [ ] frontend abre no domínio de staging
- [ ] `VITE_API_URL` aponta para backend staging
- [ ] login admin funciona
- [ ] login inválido mostra erro
- [ ] listagem de mercados carrega
- [ ] página de gestores carrega
- [ ] vínculo gestor/mercado aparece
- [ ] múltiplos gestores aparecem na gestão de mercados
- [ ] upload/imagens funcionam
- [ ] carrinho/checkout carregam
- [ ] console do navegador sem erro crítico
- [ ] nenhuma chamada aponta para localhost
- [ ] nenhum secret aparece no bundle ou console

---

## 11. Problemas comuns

### Frontend chama localhost

Causa provável:

- `VITE_API_URL` ausente ou errada

Correção:

- configurar env na plataforma
- redeploy

### Erro de CORS

Causa provável:

- domínio do frontend não incluído em `CORS_ORIGINS` do backend

Correção:

- atualizar env do backend
- redeploy backend

### 404 ao recarregar rota

Causa provável:

- React Router em hospedagem estática sem fallback

Correção:

- configurar redirect para `index.html`

Exemplos genéricos:

Netlify `_redirects`:

```txt
/* /index.html 200
```

Vercel `vercel.json`, se necessário:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Env alterada mas app não mudou

Causa provável:

- Vite injeta env em build time

Correção:

- executar novo build/deploy

---

## 12. Rollback

1. Reverter para deploy anterior na plataforma.
2. Restaurar env anterior, se necessário.
3. Validar frontend.
4. Validar comunicação com backend.
5. Verificar console do navegador.

---

## 13. Checklist rápido

- [ ] `VITE_API_URL` configurada
- [ ] backend staging publicado
- [ ] backend CORS permite domínio do frontend
- [ ] `npm run build` passou
- [ ] deploy executado
- [ ] domínio configurado
- [ ] frontend não chama localhost
- [ ] login funciona
- [ ] listagem de mercados funciona
- [ ] página de gestores funciona
- [ ] console sem erro crítico
- [ ] nenhum secret no frontend
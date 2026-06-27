# SMOKE TEST MANUAL — MERCADO EXPRESS STAGING

**Data:** 24/06/2026  
**Objetivo:** Validar fluxos críticos antes de considerar staging estável  
**Status:** APROVADO COM RISCO CONTROLADO

---

## AVISO IMPORTANTE

**Build passando não significa sistema validado funcionalmente.**

Cobertura automatizada atual:
- Testes unitários: **REMOVIDOS** (incompatibilidade com implementação real)
- Testes E2E: **1 suite apenas** (health check)
- Cobertura estimada: **< 10%**

Este documento é o **principal instrumento de validação** do staging.

---

## CREDENCIAIS DE TESTE

| Perfil | Email | Senha | Role |
|--------|-------|-------|------|
| Admin | admin@test.com | admin123 | ADMIN_GERAL |
| Gestor | gestor@test.com | gestor123 | GESTOR_MERCADO |
| Cliente | cliente@test.com | cliente123 | CLIENTE |

**Atenção:** Estas credenciais são apenas para staging. Nunca usar em produção.

---

## CHECKLIST DE SMOKE TEST

### 1. Health Check
- **Endpoint:** `GET /health/live`
- **Usuário:** N/A
- **Passos:** Acessar endpoint diretamente
- **Resultado esperado:** `{"status":"ok"}`
- **Critério de falha:** Status diferente de 200 ou timeout

### 2. Health Check Ready
- **Endpoint:** `GET /health/ready`
- **Usuário:** N/A
- **Passos:** Acessar endpoint diretamente
- **Resultado esperado:** `{"status":"ready","database":"connected"}`
- **Critério de falha:** Status diferente de 200 ou database não conectado

### 3. Registro de Usuário
- **Endpoint:** `POST /auth/register`
- **Usuário:** N/A
- **Passos:**
  1. Enviar POST com `{ "email": "novo@test.com", "name": "Novo User", "password": "senha123" }`
- **Resultado esperado:** 201 Created + token JWT
- **Critério de falha:** Status diferente de 201 ou erro 500

### 4. Login Válido
- **Endpoint:** `POST /auth/login`
- **Usuário:** admin@test.com
- **Passos:**
  1. Enviar POST com `{ "email": "admin@test.com", "password": "admin123" }`
- **Resultado esperado:** 200 OK + access_token + dados do usuário
- **Critério de falha:** Status diferente de 200 ou token ausente

### 5. Login Inválido
- **Endpoint:** `POST /auth/login`
- **Usuário:** N/A
- **Passos:**
  1. Enviar POST com senha errada: `{ "email": "admin@test.com", "password": "errada" }`
- **Resultado esperado:** 401 Unauthorized
- **Critério de falha:** Status 200 ou token retornado

### 6. Listagem de Mercados
- **Endpoint:** `GET /markets`
- **Usuário:** Admin ou Gestor
- **Passos:**
  1. Fazer login e obter token
  2. Enviar GET com header `Authorization: Bearer <token>`
- **Resultado esperado:** 200 OK + array de mercados
- **Critério de falha:** Status diferente de 200 ou erro 500

### 7. Criação de Mercado
- **Endpoint:** `POST /markets`
- **Usuário:** Admin
- **Passos:**
  1. Fazer login como admin
  2. Enviar POST com `{ "name": "Mercado Teste", "address": "Rua Teste, 123" }`
- **Resultado esperado:** 201 Created + mercado criado
- **Critério de falha:** Status diferente de 201

### 8. Criação de Gestor
- **Endpoint:** `POST /managers`
- **Usuário:** Admin
- **Passos:**
  1. Fazer login como admin
  2. Enviar POST com `{ "name": "Novo Gestor", "email": "novogestor@test.com", "password": "senha123" }`
- **Resultado esperado:** 201 Created + gestor criado
- **Critério de falha:** Status diferente de 201

### 9. Login de Gestor
- **Endpoint:** `POST /auth/login`
- **Usuário:** gestor@test.com
- **Passos:**
  1. Enviar POST com credenciais do gestor
- **Resultado esperado:** 200 OK + token
- **Critério de falha:** Status diferente de 200

### 10. Criação de Produto
- **Endpoint:** `POST /catalog/products`
- **Usuário:** Admin ou Gestor
- **Passos:**
  1. Fazer login
  2. Enviar POST com dados do produto
- **Resultado esperado:** 201 Created
- **Critério de falha:** Status diferente de 201

### 11. Upload de Imagem
- **Endpoint:** `POST /upload/image`
- **Usuário:** Admin ou Gestor
- **Passos:**
  1. Fazer login
  2. Enviar multipart/form-data com imagem
- **Resultado esperado:** 200 OK + URL da imagem
- **Critério de falha:** Status diferente de 200 ou erro de upload

### 12. Listagem de Produtos
- **Endpoint:** `GET /catalog/products`
- **Usuário:** N/A (público) ou autenticado
- **Passos:** Acessar endpoint
- **Resultado esperado:** 200 OK + lista de produtos
- **Critério de falha:** Status diferente de 200

### 13. Carrinho
- **Endpoint:** `POST /cart/add`
- **Usuário:** Cliente
- **Passos:**
  1. Fazer login como cliente
  2. Adicionar produto ao carrinho
- **Resultado esperado:** 200 OK + item adicionado
- **Critério de falha:** Status diferente de 200

### 14. Checkout
- **Endpoint:** `POST /orders/from-cart`
- **Usuário:** Cliente
- **Passos:**
  1. Ter itens no carrinho
  2. Enviar dados de entrega
- **Resultado esperado:** 201 Created + pedido criado
- **Critério de falha:** Status diferente de 201

### 15. Atualização de Status do Pedido
- **Endpoint:** `PATCH /orders/:id/status`
- **Usuário:** Admin ou Gestor
- **Passos:**
  1. Fazer login
  2. Atualizar status do pedido
- **Resultado esperado:** 200 OK + status atualizado
- **Critério de falha:** Status diferente de 200

### 16. Logs de Auditoria
- **Endpoint:** Verificar banco de dados
- **Usuário:** N/A
- **Passos:**
  1. Verificar tabela `AuditLog` no banco
  2. Confirmar registros de ações anteriores
- **Resultado esperado:** Registros presentes com userId, action, entity
- **Critério de falha:** Tabela vazia ou registros sem dados obrigatórios

---

## RESULTADO DO SMOKE TEST

| Item | Status | Observação |
|------|--------|------------|
| 1. Health check live | ☐ | |
| 2. Health check ready | ☐ | |
| 3. Registro | ☐ | |
| 4. Login válido | ☐ | |
| 5. Login inválido | ☐ | |
| 6. Listagem de mercados | ☐ | |
| 7. Criação de mercado | ☐ | |
| 8. Criação de gestor | ☐ | |
| 9. Login de gestor | ☐ | |
| 10. Criação de produto | ☐ | |
| 11. Upload de imagem | ☐ | |
| 12. Listagem de produtos | ☐ | |
| 13. Carrinho | ☐ | |
| 14. Checkout | ☐ | |
| 15. Atualização de status | ☐ | |
| 16. Logs de auditoria | ☐ | |

**Total:** ___/16 aprovados

---

## CRITÉRIO DE APROVAÇÃO

- Mínimo 14/16 itens aprovados
- Nenhum critério de falha acionado
- Todos os fluxos críticos funcionando (1-10)

**Data de execução:** ___/___/___  
**Executado por:** _________________  
**Aprovado:** ☐ SIM  ☐ NÃO
# Staging Smoke Test — Real

Checklist prático para validar o sistema Mercado Express depois do deploy em staging.

**Importante:**
- build passando não significa sistema validado;
- deploy só é aceito se os fluxos principais funcionarem;
- bugs críticos devem bloquear avanço para produção.

---

## 1. Objetivo

Este documento tem como objetivo validar se o ambiente de staging está utilizável após deploy real, garantindo que os fluxos principais do sistema funcionem corretamente antes de avançar para produção.

---

## 2. Dados do ambiente

Preencher antes de iniciar os testes:

```
Data:
Responsável:
Branch:
Commit:
Backend URL:
Frontend URL:
Banco:
Bucket Supabase:
Versão:
```

---

## 3. Critério de aprovação

```
Total de itens: 25
Mínimo para aprovação: 22/25 APROVADOS
Falhas críticas permitidas: 0
Vazamento de senha/token em logs: 0
```

### Falhas críticas (qualquer uma reprova automaticamente):

- backend não inicia;
- `/health/ready` falha;
- login admin não funciona;
- frontend não consegue chamar API;
- migration pendente;
- vínculo gestor/mercado não aparece;
- múltiplos gestores não aparecem;
- upload não funciona;
- checkout não funciona;
- logs expõem senha/token/secret.

---

## 4. Usuários de teste

Registrar usuários de staging para os testes:

| Tipo | Email | Senha | Observação |
|------|-------|-------|------------|
| Admin | admin@exemplo.com | definir no seed seguro | Acesso administrativo |
| Gestor 1 | gestor1@exemplo.com | definir no seed seguro | Vinculado ao Mercado A |
| Gestor 2 | gestor2@exemplo.com | definir no seed seguro | Também vinculado ao Mercado A |
| Cliente | cliente@exemplo.com | definir no seed seguro | Fluxo de compra |

**Avisos:**
- não usar senha real de produção;
- não commitar credenciais reais se forem sensíveis;
- preferir dados fictícios.

---

## 5. Checklist de infraestrutura

### 1. Backend `/health/live`

**Status:** NÃO TESTADO  
**Usuário necessário:** Nenhum  
**Como testar:**
1. Acessar `http://backend-url/health/live` no navegador ou curl
2. Verificar código de resposta

**Resultado esperado:**
- HTTP 200 OK
- Resposta indica que o processo está ativo

**Critério de falha:**
- HTTP 500, 404 ou timeout
- Backend não responde

**Observações:**
_


---

### 2. Backend `/health/ready`

**Status:** NÃO TESTADO  
**Usuário necessário:** Nenhum  
**Como testar:**
1. Acessar `http://backend-url/health/ready` no navegador ou curl
2. Verificar código de resposta

**Resultado esperado:**
- HTTP 200 OK
- Resposta indica que banco e dependências estão disponíveis

**Critério de falha:**
- HTTP 500 ou timeout
- Indica problema de conexão com banco ou dependências

**Observações:**
_


---

### 3. Frontend abre no domínio de staging

**Status:** NÃO TESTADO  
**Usuário necessário:** Nenhum  
**Como testar:**
1. Acessar URL do frontend de staging no navegador
2. Aguardar carregamento completo

**Resultado esperado:**
- Página inicial carrega sem erro
- Não há tela branca ou erro de build

**Critério de falha:**
- Página não carrega
- Erro 404 ou 500
- Arquivos estáticos quebram

**Observações:**
_


---

### 4. Frontend chama backend staging, não localhost

**Status:** NÃO TESTADO  
**Usuário necessário:** Nenhum  
**Como testar:**
1. Abrir DevTools do navegador (F12)
2. Ir para aba Network
3. Fazer login ou qualquer requisição
4. Verificar URL das requisições

**Resultado esperado:**
- Todas as requisições vão para o domínio do backend staging
- Nenhuma requisição aponta para `localhost`

**Critério de falha:**
- Requisições apontam para `localhost`
- `VITE_API_URL` não está configurada corretamente

**Observações:**
_


---

### 5. CORS permite o domínio do frontend

**Status:** NÃO TESTADO  
**Usuário necessário:** Nenhum  
**Como testar:**
1. Abrir console do navegador (F12)
2. Fazer uma requisição qualquer (ex: listar mercados)
3. Verificar se há erro de CORS

**Resultado esperado:**
- Nenhum erro de CORS no console
- Requisições são aceitas pelo backend

**Critério de falha:**
- Erro `Access-Control-Allow-Origin` no console
- Requisições bloqueadas por CORS

**Observações:**
_


---

### 6. Logs do backend sem senha/token/secret

**Status:** NÃO TESTADO  
**Usuário necessário:** Nenhum  
**Como testar:**
1. Acessar logs do backend (plataforma de deploy ou stdout)
2. Fazer login, criar mercado, criar gestor
3. Verificar se há vazamento de dados sensíveis

**Resultado esperado:**
- Logs não contêm senhas
- Logs não contêm tokens JWT
- Logs não contêm `SUPABASE_SERVICE_ROLE_KEY`
- Logs não contêm `JWT_SECRET`

**Critério de falha:**
- Qualquer secret aparece em log
- Senha de usuário aparece em log
- Token de acesso aparece em log

**Observações:**
_


---

## 6. Checklist de autenticação

### 7. Login admin

**Status:** NÃO TESTADO  
**Usuário necessário:** Admin  
**Como testar:**
1. Acessar tela de login do frontend
2. Inserir email e senha do admin
3. Clicar em "Entrar"

**Resultado esperado:**
- Login realizado com sucesso
- Redirecionamento para dashboard admin
- Token JWT armazenado

**Critério de falha:**
- Login retorna erro 401 ou 500
- Não redireciona após login
- Token não é armazenado

**Observações:**
_


---

### 8. Login inválido

**Status:** NÃO TESTADO  
**Usuário necessário:** Nenhum (tentar com credenciais inválidas)  
**Como testar:**
1. Acessar tela de login
2. Inserir email ou senha inválidos
3. Clicar em "Entrar"

**Resultado esperado:**
- Mensagem de erro amigável
- Não realiza login
- Não armazena token inválido

**Critério de falha:**
- Login é aceito com credenciais inválidas
- Erro 500 sem mensagem amigável
- Token inválido é armazenado

**Observações:**
_


---

### 9. Logout

**Status:** NÃO TESTADO  
**Usuário necessário:** Admin (logado)  
**Como testar:**
1. Estar logado como admin
2. Clicar em "Sair" ou "Logout"
3. Tentar acessar rota protegida

**Resultado esperado:**
- Logout realizado com sucesso
- Token é removido do armazenamento
- Redirecionamento para tela de login
- Rota protegida não é acessível após logout

**Critério de falha:**
- Token permanece após logout
- Acesso a rotas protegidas sem login
- Erro 500 no logout

**Observações:**
_


---

### 10. Persistência de sessão após F5

**Status:** NÃO TESTADO  
**Usuário necessário:** Admin (logado)  
**Como testar:**
1. Estar logado como admin
2. Pressionar F5 para recarregar a página
3. Verificar se continua logado

**Resultado esperado:**
- Sessão permanece ativa após F5
- Usuário continua na mesma página
- Token permanece válido

**Critério de falha:**
- Logout automático após F5
- Redirecionamento para tela de login
- Token expira imediatamente

**Observações:**
_


---

### 11. Redirecionamento de rota protegida sem token

**Status:** NÃO TESTADO  
**Usuário necessário:** Nenhum (não logado)  
**Como testar:**
1. Garantir que não está logado
2. Acessar diretamente URL de rota protegida (ex: `/admin`)
3. Verificar comportamento

**Resultado esperado:**
- Redirecionamento para tela de login
- Não exibe conteúdo da rota protegida
- Não retorna erro 500

**Critério de falha:**
- Exibe conteúdo sem autenticação
- Erro 500 ou 404
- Permite acesso a rotas protegidas sem token

**Observações:**
_


---

## 7. Checklist de mercados e gestores

### 12. Listagem de mercados

**Status:** NÃO TESTADO  
**Usuário necessário:** Admin  
**Como testar:**
1. Fazer login como admin
2. Acessar página de listagem de mercados
3. Verificar se mercados são exibidos

**Resultado esperado:**
- Lista de mercados carrega
- Nomes, endereços e imagens são exibidos
- Não há erro 500 ou 404

**Critério de falha:**
- Lista não carrega
- Erro 500 ou 404
- Tela em branco

**Observações:**
_


---

### 13. Gestão de mercados carrega

**Status:** NÃO TESTADO  
**Usuário necessário:** Admin  
**Como testar:**
1. Fazer login como admin
2. Acessar página de gestão de mercados
3. Verificar se formulário e lista carregam

**Resultado esperado:**
- Página de gestão carrega completamente
- Formulário de criação/edição funciona
- Lista de mercados é exibida

**Critério de falha:**
- Página não carrega
- Formulário não funciona
- Erro 500

**Observações:**
_


---

### 14. Página de gestores carrega

**Status:** NÃO TESTADO  
**Usuário necessário:** Admin  
**Como testar:**
1. Fazer login como admin
2. Acessar página de gerenciamento de gestores
3. Verificar se página carrega

**Resultado esperado:**
- Página de gestores carrega
- Lista de gestores é exibida
- Formulário de criação/edição funciona

**Critério de falha:**
- Página não carrega
- Lista vazia sem motivo
- Erro 500

**Observações:**
_


---

### 15. Mercado vinculado aparece na página de gestores

**Status:** NÃO TESTADO  
**Usuário necessário:** Admin  
**Como testar:**
1. Fazer login como admin
2. Acessar página de gestores
3. Verificar se mercados vinculados aparecem

**Resultado esperado:**
- Mercados vinculados aos gestores são exibidos
- Relacionamento gestor/mercado está correto
- Não há mercados órfãos ou duplicados

**Critério de falha:**
- Mercados não aparecem na página de gestores
- Vínculo não é exibido
- Dados inconsistentes

**Observações:**
_


---

### 16. Dois gestores no mesmo mercado aparecem corretamente

**Status:** NÃO TESTADO  
**Usuário necessário:** Admin  
**Como testar:**
1. Fazer login como admin
2. Acessar página de gestores
3. Verificar se múltiplos gestores do mesmo mercado aparecem

**Resultado esperado:**
- Dois ou mais gestores do mesmo mercado são exibidos
- Cada gestor aparece com suas informações
- Não há duplicação ou omissão de gestores

**Critério de falha:**
- Apenas um gestor aparece por mercado
- Gestores duplicados
- Gestores omitidos

**Observações:**
Verificar Carlos Silva e Maria Santos no mesmo mercado, se o seed usar esses nomes. Se os nomes forem diferentes, preencher com os dados reais do seed.


---

### 17. Editar gestor não desvincula outro gestor

**Status:** NÃO TESTADO  
**Usuário necessário:** Admin  
**Como testar:**
1. Fazer login como admin
2. Acessar página de gestores
3. Editar dados de um gestor (ex: nome ou email)
4. Verificar se outro gestor do mesmo mercado permanece vinculado

**Resultado esperado:**
- Edição de um gestor não afeta outros gestores
- Vínculos de outros gestores permanecem intactos
- Dados do gestor editado são atualizados corretamente

**Critério de falha:**
- Edição desvincula outros gestores
- Dados de outros gestores são alterados
- Vínculos quebrados após edição

**Observações:**
_


---

### 18. Login de gestor

**Status:** NÃO TESTADO  
**Usuário necessário:** Gestor 1 ou Gestor 2  
**Como testar:**
1. Acessar tela de login
2. Inserir credenciais de gestor
3. Clicar em "Entrar"

**Resultado esperado:**
- Login realizado com sucesso
- Redirecionamento para página do gestor
- Acesso apenas ao seu mercado vinculado

**Critério de falha:**
- Login retorna erro
- Gestor acessa mercados de outros gestores
- Redirecionamento incorreto

**Observações:**
_


---

### 19. Gestor acessa apenas seu mercado

**Status:** NÃO TESTADO  
**Usuário necessário:** Gestor 1 ou Gestor 2  
**Como testar:**
1. Fazer login como gestor
2. Tentar acessar dados de mercado não vinculado
3. Verificar se acesso é negado

**Resultado esperado:**
- Gestor vê apenas seu mercado vinculado
- Acesso a outros mercados é negado
- Não há vazamento de dados de outros gestores

**Critério de falha:**
- Gestor acessa mercados de outros gestores
- Dados de outros mercados são exibidos
- Permissões não são respeitadas

**Observações:**
_


---

## 8. Checklist de imagens e upload

### 20. Imagem de mercado criada por upload aparece

**Status:** NÃO TESTADO  
**Usuário necessário:** Admin  
**Como testar:**
1. Fazer login como admin
2. Criar ou editar mercado com upload de imagem
3. Verificar se imagem aparece na listagem e detalhes

**Resultado esperado:**
- Imagem é enviada com sucesso
- URL pública da imagem é gerada
- Imagem aparece corretamente no frontend

**Critério de falha:**
- Upload falha
- Imagem não aparece
- URL quebrada ou inacessível

**Observações:**
Service role key nunca deve aparecer no frontend. URL pública deve funcionar.


---

### 21. Mercado de teste com imagem ausente/quebrada mostra fallback

**Status:** NÃO TESTADO  
**Usuário necessário:** Nenhum  
**Como testar:**
1. Acessar mercado com imagem quebrada ou removida
2. Verificar comportamento do frontend

**Resultado esperado:**
- Fallback de imagem é exibido
- Não há erro 500 ou tela quebrada
- Layout permanece intacto

**Critério de falha:**
- Erro 500 ao carregar imagem quebrada
- Tela quebrada ou desconfigurada
- Sem fallback visual

**Observações:**
_


---

### 22. Upload de imagem de produto funciona

**Status:** NÃO TESTADO  
**Usuário necessário:** Admin  
**Como testar:**
1. Fazer login como admin
2. Criar ou editar produto com upload de imagem
3. Verificar se imagem aparece

**Resultado esperado:**
- Upload de imagem de produto funciona
- Imagem é exibida na listagem e detalhes
- URL pública é acessível

**Critério de falha:**
- Upload falha
- Imagem não aparece
- URL quebrada

**Observações:**
_


---

## 9. Checklist de catálogo, carrinho e pedidos

### 23. Criação/listagem de produto

**Status:** NÃO TESTADO  
**Usuário necessário:** Admin  
**Como testar:**
1. Fazer login como admin
2. Criar novo produto com nome, preço e imagem
3. Acessar listagem de produtos
4. Verificar se produto aparece

**Resultado esperado:**
- Produto é criado com sucesso
- Produto aparece na listagem
- Dados estão corretos (nome, preço, imagem)

**Critério de falha:**
- Criação falha
- Produto não aparece na listagem
- Dados incorretos

**Observações:**
_


---

### 24. Carrinho e checkout

**Status:** NÃO TESTADO  
**Usuário necessário:** Cliente  
**Como testar:**
1. Fazer login como cliente
2. Adicionar produtos ao carrinho
3. Acessar página do carrinho
4. Iniciar checkout

**Resultado esperado:**
- Produtos são adicionados ao carrinho
- Carrinho exibe itens corretamente
- Checkout inicia sem erro
- Cálculo de total está correto

**Critério de falha:**
- Carrinho não atualiza
- Checkout falha
- Erro 500 no carrinho/checkout
- Total incorreto

**Observações:**
_


---

### 25. Criação de pedido e alteração de status

**Status:** NÃO TESTADO  
**Usuário necessário:** Cliente (criar pedido), Admin (alterar status)  
**Como testar:**
1. Fazer login como cliente
2. Finalizar checkout e criar pedido
3. Fazer login como admin
4. Alterar status do pedido
5. Verificar se status foi atualizado

**Resultado esperado:**
- Pedido é criado com sucesso
- Status do pedido pode ser alterado pelo admin
- Cliente vê status atualizado
- Histórico de status é registrado

**Critério de falha:**
- Criação de pedido falha
- Status não pode ser alterado
- Status não é atualizado para cliente
- Erro 500

**Observações:**
_


---

## 10. Rate limiting

### Teste de rate limiting em auth

**Status:** NÃO TESTADO  
**Usuário necessário:** Nenhum  
**Como testar:**
1. Realizar múltiplas tentativas de login/register em sequência rápida
2. Verificar se após limite ocorre bloqueio

**Resultado esperado:**
- Login/register têm proteção contra brute force
- Após limite de tentativas, retorna 429 (Too Many Requests)
- Bloqueio é temporário

**Critério de falha:**
- Não há limite de tentativas
- Permite brute force
- Erro 500 ao invés de 429

**Observações:**
_


---

### Teste de rate limiting em endpoints públicos

**Status:** NÃO TESTADO  
**Usuário necessário:** Nenhum  
**Como testar:**
1. Fazer múltiplas requisições a `GET /markets` em sequência rápida
2. Verificar se há bloqueio em uso normal

**Resultado esperado:**
- `GET /markets` não retorna 429 em uso normal
- Admin e gerenciar gestores carregam sem 429
- Apenas uso abusivo é bloqueado

**Critério de falha:**
- `GET /markets` retorna 429 em uso normal
- Admin e gestores recebem 429 sem motivo
- Rate limiting muito agressivo

**Observações:**
_


---

## 11. Audit log

### Eventos críticos registrados

**Status:** NÃO TESTADO  
**Usuário necessário:** Admin  
**Como testar:**
1. Realizar ações críticas no sistema:
   - Login
   - Criação de mercado
   - Criação de gestor
   - Criação de produto
   - Alteração de status de pedido
2. Verificar se eventos aparecem no AuditLog

**Resultado esperado:**
- Eventos de login são registrados
- Criação de mercado é registrada
- Criação de gestor é registrada
- Criação de produto é registrada
- Alteração de status de pedido é registrada

**Critério de falha:**
- Audit log ausente em ações críticas (se integração for obrigatória)
- Audit log contém senha/token/secret
- Eventos não são registrados

**Observações:**
_


---

## 12. Registro de bugs encontrados

Registrar bugs durante o smoke test:

| ID | Severidade | Tela/Endpoint | Descrição | Passos para reproduzir | Evidência | Responsável | Status |
|----|------------|---------------|-----------|------------------------|-----------|-------------|--------|
| 1 | CRÍTICO | | | | | | |
| 2 | ALTO | | | | | | |
| 3 | MÉDIO | | | | | | |
| 4 | BAIXO | | | | | | |

**Severidades:**
- CRÍTICO: impede deploy, causa perda de dados ou falha de segurança
- ALTO: funcionalidade principal quebrada
- MÉDIO: funcionalidade secundária afetada
- BAIXO: problema visual ou de usabilidade menor

---

## 13. Resultado final do smoke test

Preencher após conclusão de todos os testes:

```
Total aprovados:
Total falhou:
Total bloqueado:
Total não testado:
Falhas críticas:
```

### Decisão:

Opções:

- [ ] APROVADO PARA TESTES DE USUÁRIO
- [ ] APROVADO COM RESTRIÇÕES
- [ ] REPROVADO PARA STAGING

**Justificativa:**
_


---

## Resumo de aprovação

```
Total de itens: 25
Mínimo para aprovação: 22/25 APROVADOS
Falhas críticas permitidas: 0
Vazamento de senha/token em logs: 0
```

**Aprovado se:**
- 22 ou mais itens aprovados
- Nenhuma falha crítica
- Nenhum vazamento de senha/token/secret em logs

**Reprovado se:**
- Menos de 22 itens aprovados
- Qualquer falha crítica
- Qualquer vazamento de senha/token/secret em logs
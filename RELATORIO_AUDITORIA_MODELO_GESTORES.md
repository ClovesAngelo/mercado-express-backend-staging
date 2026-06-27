# RELATÓRIO DE AUDITORIA - MODELO ATUAL DE GESTORES/MERCADOS

## 1. Modelo Atual no Prisma

### User
```prisma
model User {
  id        String    @id @default(uuid())
  email     String    @unique
  name      String
  password  String
  role      UserRole  @default(CLIENTE)
  marketId  String?   @unique  // ⚠️ ÚNICO - força 1:1
  market    Market?   @relation("MarketManager", fields: [marketId], references: [id])
  carts     Cart[]
  orders    Order[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?
}
```

### Market
```prisma
model Market {
  id              String    @id @default(uuid())
  name            String
  // ... outros campos
  managerId       String?   @unique  // ⚠️ ÚNICO - força 1:1
  manager         User?     @relation("MarketManager")
  deletedAt       DateTime?
  products        Product[]
  orders          Order[]
  deliveryAreas   DeliveryArea[]
  ratings         Rating[]
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

## 2. Diagnóstico

### Problema 1: Relação 1:1 Forçada
- `User.marketId` tem `@unique`
- `Market.managerId` tem `@unique`
- Isso força que cada mercado tenha apenas UM gestor

### Problema 2: Dupla Fonte de Verdade
- `User.marketId` aponta para Market
- `Market.managerId` aponta para User
- Ambos deveriam estar sincronizados, mas apenas um é necessário

### Problema 3: Inconsistência Visual
- Backend retorna `market` na listagem de gestores
- Frontend nem sempre exibe corretamente

## 3. Dependências Identificadas

### Services que usam Market.managerId
1. `markets.service.ts` - `findAll()`, `findOne()` usam `include: { manager: ... }`
2. `markets.service.ts` - `createWithManager()` define `managerId`
3. `Admin.tsx` - busca `market.manager?.name`

### Services que usam User.marketId
1. `managers.service.ts` - `create()`, `update()` definem `marketId`
2. `managers.service.ts` - `findAll()` retorna `market` via relação
3. `Manager.tsx` - verifica `user.marketId` para acesso

## 4. Decisão

### Manter
- `User.marketId` como fonte de verdade
- Remover `@unique` de `User.marketId` para permitir múltiplos gestores

### Remover/Depreciar
- `Market.managerId` (tornar obsoleto)
- Não usar mais como fonte única

### Nova Relação
```prisma
model User {
  marketId  String?
  market    Market?  @relation("MarketManagers", fields: [marketId], references: [id])
}

model Market {
  managers  User[]  @relation("MarketManagers")
}
```

## 5. Impacto da Mudança

### Backend
- `managers.service.ts` - remover update de `Market.managerId`
- `markets.service.ts` - ajustar `createWithManager()` para não definir `managerId`
- `markets.service.ts` - adicionar método para listar gestores do mercado
- Controllers - ajustar retornos

### Frontend
- `Admin.tsx` - exibir múltiplos gestores na lista de mercados
- `ManagersAdmin.tsx` - já funciona (usa `manager.marketId`)

### Migration
- Remover `@unique` de `User.marketId`
- Remover coluna `Market.managerId` (opcional - pode deixar para backward compatibility)

## 6. Próximos Passos

1. Executar esta auditoria
2. Modificar schema.prisma
3. Criar migration
4. Atualizar backend
5. Atualizar frontend
6. Testar múltiplos gestores
7. Validar permissões

</parameter>
<task_progress>
- [x] FASE 1: Auditoria do modelo atual
- [ ] FASE 2: Definir modelo correto (schema.prisma)
- [ ] FASE 3: Migration Prisma
- [ ] FASE 4: Backend - Managers
- [ ] FASE 5: Backend - Markets
- [ ] FASE 6: Frontend - Página de Gestores
- [ ] FASE 7: Frontend - Mercados com múltiplos gestores
- [ ] FASE 8: Permissões
- [ ] FASE 9: Testes
- [ ] FASE 10: Migration/Seed
- [ ] FASE 11: Validação manual
- [ ] FASE 12: Relatório final
</task_progress>
</write_to_file>
import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Helper: upsert market by name
async function upsertMarket(data: any) {
  const existing = await prisma.market.findFirst({ where: { name: data.name } });
  if (existing) {
    return prisma.market.update({ where: { id: existing.id }, data });
  }
  return prisma.market.create({ data });
}

// Helper: upsert product by marketId + name
async function upsertProduct(marketId: string, data: any) {
  const existing = await prisma.product.findFirst({ where: { marketId, name: data.name } });
  if (existing) {
    return prisma.product.update({ where: { id: existing.id }, data: { ...data, marketId } });
  }
  return prisma.product.create({ data: { ...data, marketId } });
}

async function main() {
  console.log('=== SEED STAGING SEGURO ===');
  console.log('Modo upsert — não apaga dados existentes.');
  console.log('');

  // 1. ADMIN
  const admin = await prisma.user.upsert({
    where: { email: 'admin@mercadoexpress.com' },
    update: { name: 'Administrador Geral', role: UserRole.ADMIN_GERAL, password: await bcrypt.hash('admin123', 10) },
    create: { email: 'admin@mercadoexpress.com', name: 'Administrador Geral', role: UserRole.ADMIN_GERAL, password: await bcrypt.hash('admin123', 10) },
  });
  console.log(`Admin: ${admin.email}`);

  // 2. MERCADOS
  const m1 = await upsertMarket({
    name: 'Supermercado Central', address: 'Rua Principal, 123 - Centro',
    description: 'O melhor supermercado da região', phone: '(11) 3333-3333',
    whatsapp: '(11) 99999-1111', openTime: '08:00', closeTime: '21:00',
    deliveryFee: 5.0, minOrderValue: 20.0, isActive: true,
  });
  const m2 = await upsertMarket({
    name: 'Mercado Bairro', address: 'Av. das Flores, 456 - Jardim',
    description: 'Mercado de bairro com produtos frescos', phone: '(11) 4444-4444',
    whatsapp: '(11) 99999-2222', openTime: '07:00', closeTime: '20:00',
    deliveryFee: 3.0, minOrderValue: 15.0, isActive: true,
  });

  // 3. GESTORES
  const g1pw = await bcrypt.hash('gestor123', 10);
  await prisma.user.upsert({
    where: { email: 'gestor1@mercadoexpress.com' },
    update: { name: 'Carlos Silva', password: g1pw, role: UserRole.GESTOR_MERCADO, marketId: m1.id },
    create: { email: 'gestor1@mercadoexpress.com', name: 'Carlos Silva', password: g1pw, role: UserRole.GESTOR_MERCADO, marketId: m1.id },
  });
  await prisma.user.upsert({
    where: { email: 'gestor2@mercadoexpress.com' },
    update: { name: 'Maria Santos', password: g1pw, role: UserRole.GESTOR_MERCADO, marketId: m1.id },
    create: { email: 'gestor2@mercadoexpress.com', name: 'Maria Santos', password: g1pw, role: UserRole.GESTOR_MERCADO, marketId: m1.id },
  });
  await prisma.user.upsert({
    where: { email: 'gestor3@mercadoexpress.com' },
    update: { name: 'Pedro Oliveira', password: g1pw, role: UserRole.GESTOR_MERCADO, marketId: m2.id },
    create: { email: 'gestor3@mercadoexpress.com', name: 'Pedro Oliveira', password: g1pw, role: UserRole.GESTOR_MERCADO, marketId: m2.id },
  });
  console.log('Gestores: Carlos+Maria → Mercado Central, Pedro → Mercado Bairro');

  // 4. CLIENTES
  const c1pw = await bcrypt.hash('cliente123', 10);
  await prisma.user.upsert({
    where: { email: 'cliente1@teste.com' },
    update: { name: 'João Cliente', password: c1pw, role: UserRole.CLIENTE },
    create: { email: 'cliente1@teste.com', name: 'João Cliente', password: c1pw, role: UserRole.CLIENTE },
  });
  await prisma.user.upsert({
    where: { email: 'cliente2@teste.com' },
    update: { name: 'Maria Cliente', password: c1pw, role: UserRole.CLIENTE },
    create: { email: 'cliente2@teste.com', name: 'Maria Cliente', password: c1pw, role: UserRole.CLIENTE },
  });
  console.log('Clientes criados');

  console.log(`Mercados: ${m1.name}, ${m2.name}`);


  // 5. CATEGORIAS
  const catBebidas = await prisma.category.upsert({ where: { name: 'Bebidas' }, update: {}, create: { name: 'Bebidas' } });
  const catAlimentos = await prisma.category.upsert({ where: { name: 'Alimentos' }, update: {}, create: { name: 'Alimentos' } });
  const catLimpeza = await prisma.category.upsert({ where: { name: 'Limpeza' }, update: {}, create: { name: 'Limpeza' } });
  const catHortifruti = await prisma.category.upsert({ where: { name: 'Hortifrúti' }, update: {}, create: { name: 'Hortifrúti' } });
  const catPadaria = await prisma.category.upsert({ where: { name: 'Padaria' }, update: {}, create: { name: 'Padaria' } });
  console.log('Categorias: Bebidas, Alimentos, Limpeza, Hortifrúti, Padaria');

  // 6. PRODUTOS — Mercado 1
  const prodsM1 = [
    { name: 'Coca-Cola 2L', price: 8.99, categoryId: catBebidas.id, stock: 50, imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400', description: 'Refrigerante de cola 2L' },
    { name: 'Água Mineral 1L', price: 2.50, categoryId: catBebidas.id, stock: 100, imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400', description: 'Água mineral sem gás 1L' },
    { name: 'Arroz 5kg', price: 22.90, categoryId: catAlimentos.id, stock: 30, imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400', description: 'Arroz tipo 1 5kg' },
    { name: 'Feijão 1kg', price: 7.90, categoryId: catAlimentos.id, stock: 40, imageUrl: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=400', description: 'Feijão carioca 1kg' },
    { name: 'Detergente 500ml', price: 3.50, categoryId: catLimpeza.id, stock: 60, imageUrl: 'https://images.unsplash.com/photo-1585421514738-01798e347a57?w=400', description: 'Detergente líquido 500ml' },
    { name: 'Suco de Laranja 1L', price: 6.90, categoryId: catBebidas.id, stock: 25, imageUrl: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400', description: 'Suco natural 1L' },
    { name: 'Macarrão 500g', price: 4.50, categoryId: catAlimentos.id, stock: 35, imageUrl: 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=400', description: 'Espaguete 500g' },
    { name: 'Leite Integral 1L', price: 5.90, categoryId: catBebidas.id, stock: 45, imageUrl: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400', description: 'Leite integral 1L' },
    { name: 'Pão Francês (un)', price: 0.80, categoryId: catPadaria.id, stock: 200, imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400', description: 'Pão francês fresco' },
    { name: 'Banana Prata (kg)', price: 4.99, categoryId: catHortifruti.id, stock: 50, imageUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400', description: 'Banana prata 1kg' },
  ];
  for (const p of prodsM1) await upsertProduct(m1.id, p);
  console.log(`Produtos Mercado 1: ${prodsM1.length}`);

  // 7. PRODUTOS — Mercado 2
  const prodsM2 = [
    { name: 'Água Mineral 500ml', price: 1.80, categoryId: catBebidas.id, stock: 80, imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400', description: 'Água mineral 500ml' },
    { name: 'Arroz 1kg', price: 5.50, categoryId: catAlimentos.id, stock: 25, imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400', description: 'Arroz tipo 1 1kg' },
    { name: 'Sabão em Pó 1kg', price: 15.90, categoryId: catLimpeza.id, stock: 20, imageUrl: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=400', description: 'Sabão em pó para roupas' },
    { name: 'Feijão Preto 1kg', price: 8.50, categoryId: catAlimentos.id, stock: 30, imageUrl: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=400', description: 'Feijão preto 1kg' },
    { name: 'Óleo de Soja 900ml', price: 6.90, categoryId: catAlimentos.id, stock: 35, imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400', description: 'Óleo de soja 900ml' },
  ];
  for (const p of prodsM2) await upsertProduct(m2.id, p);
  console.log(`Produtos Mercado 2: ${prodsM2.length}`);


  // 8. BIBLIOTECA DE IMAGENS
  const imagens = [
    { url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400', name: 'Coca-Cola 2L', category: 'Bebidas', tags: ['refrigerante'] },
    { url: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400', name: 'Água Mineral', category: 'Bebidas', tags: ['água'] },
    { url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400', name: 'Arroz', category: 'Alimentos', tags: ['arroz'] },
    { url: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=400', name: 'Feijão', category: 'Alimentos', tags: ['feijão'] },
    { url: 'https://images.unsplash.com/photo-1585421514738-01798e347a57?w=400', name: 'Detergente', category: 'Limpeza', tags: ['detergente'] },
  ];
  for (const img of imagens) {
    const exists = await prisma.productImage.findFirst({ where: { url: img.url } });
    if (!exists) await prisma.productImage.create({ data: img });
  }
  console.log(`Imagens: ${imagens.length}`);

  // 9. ÁREAS DE ENTREGA
  const areas = [
    { neighborhood: 'Centro', city: 'São Paulo', state: 'SP', fee: 5.0, avgTime: '30 min', marketId: m1.id },
    { neighborhood: 'Jardins', city: 'São Paulo', state: 'SP', fee: 8.0, avgTime: '40 min', marketId: m1.id },
    { neighborhood: 'Vila Mariana', city: 'São Paulo', state: 'SP', fee: 6.0, avgTime: '35 min', marketId: m1.id },
    { neighborhood: 'Jardim das Flores', city: 'São Paulo', state: 'SP', fee: 4.0, avgTime: '25 min', marketId: m2.id },
    { neighborhood: 'Vila Nova', city: 'São Paulo', state: 'SP', fee: 7.0, avgTime: '35 min', marketId: m2.id },
  ];
  for (const area of areas) {
    const exists = await prisma.deliveryArea.findFirst({ where: { marketId: area.marketId, neighborhood: area.neighborhood } });
    if (!exists) await prisma.deliveryArea.create({ data: area });
  }
  console.log(`Áreas de entrega: ${areas.length}`);

  // 10. RESUMO
  console.log('');
  console.log('=== SEED STAGING CONCLUÍDO ===');
  console.log('');
  console.log('Credenciais de teste (staging):');
  console.log('  Admin:   admin@mercadoexpress.com / admin123');
  console.log('  Gestor1: gestor1@mercadoexpress.com / gestor123 (Carlos Silva - Mercado Central)');
  console.log('  Gestor2: gestor2@mercadoexpress.com / gestor123 (Maria Santos - Mercado Central)');
  console.log('  Gestor3: gestor3@mercadoexpress.com / gestor123 (Pedro Oliveira - Mercado Bairro)');
  console.log('  Cliente: cliente1@teste.com / cliente123');
  console.log('  Cliente: cliente2@teste.com / cliente123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

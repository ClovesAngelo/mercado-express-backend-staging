import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed...');

  // Limpar dados existentes (soft delete)
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.market.deleteMany();
  await prisma.user.deleteMany();

  // Criar Admin Geral
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@mercadoexpress.com',
      name: 'Administrador Geral',
      password: adminPassword,
      role: UserRole.ADMIN_GERAL,
    },
  });
  console.log('Admin criado:', admin.email);

  // Criar Mercado 1
  const market1 = await prisma.market.create({
    data: {
      name: 'Supermercado Central',
      address: 'Rua Principal, 123 - Centro',
      description: 'O melhor supermercado da região com produtos de qualidade e preços baixos',
      phone: '(11) 3333-3333',
      whatsapp: '(11) 99999-1111',
      logoUrl: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=200',
      bannerUrl: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=1200',
      openTime: '08:00',
      closeTime: '21:00',
      isActive: true,
    },
  });
  console.log('Mercado 1 criado:', market1.name);

  // Criar Mercado 2
  const market2 = await prisma.market.create({
    data: {
      name: 'Mercado Bairro',
      address: 'Av. das Flores, 456 - Jardim',
      description: 'Mercado de bairro com produtos frescos e atendimento personalizado',
      phone: '(11) 4444-4444',
      whatsapp: '(11) 99999-2222',
      logoUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200',
      bannerUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200',
      openTime: '07:00',
      closeTime: '20:00',
      isActive: true,
    },
  });
  console.log('Mercado 2 criado:', market2.name);

  // Criar Gestor 1 (vinculado ao Mercado 1)
  const gestor1Password = await bcrypt.hash('gestor123', 10);
  const gestor1 = await prisma.user.create({
    data: {
      email: 'gestor1@mercadoexpress.com',
      name: 'Carlos Silva',
      password: gestor1Password,
      role: UserRole.GESTOR_MERCADO,
      marketId: market1.id,
    },
  });
  console.log('Gestor 1 criado:', gestor1.email, '- vinculado ao mercado:', market1.name);

  // Criar Gestor 2 (vinculado ao Mercado 1 - MÚLTIPLOS GESTORES)
  const gestor2Password = await bcrypt.hash('gestor456', 10);
  const gestor2 = await prisma.user.create({
    data: {
      email: 'gestor2@mercadoexpress.com',
      name: 'Maria Santos',
      password: gestor2Password,
      role: UserRole.GESTOR_MERCADO,
      marketId: market1.id,
    },
  });
  console.log('Gestor 2 criado:', gestor2.email, '- vinculado ao mesmo mercado:', market1.name);

  // Criar Gestor 3 (vinculado ao Mercado 2)
  const gestor3Password = await bcrypt.hash('gestor789', 10);
  const gestor3 = await prisma.user.create({
    data: {
      email: 'gestor3@mercadoexpress.com',
      name: 'Pedro Oliveira',
      password: gestor3Password,
      role: UserRole.GESTOR_MERCADO,
      marketId: market2.id,
    },
  });
  console.log('Gestor 3 criado:', gestor3.email, '- vinculado ao mercado:', market2.name);

  // Criar Clientes de teste
  const client1Password = await bcrypt.hash('cliente123', 10);
  const client1 = await prisma.user.create({
    data: {
      email: 'cliente1@teste.com',
      name: 'João Cliente',
      password: client1Password,
      role: UserRole.CLIENTE,
    },
  });
  console.log('Cliente 1 criado:', client1.email);

  const client2Password = await bcrypt.hash('cliente456', 10);
  const client2 = await prisma.user.create({
    data: {
      email: 'cliente2@teste.com',
      name: 'Ana Cliente',
      password: client2Password,
      role: UserRole.CLIENTE,
    },
  });
  console.log('Cliente 2 criado:', client2.email);

  // Criar Categorias
  const category1 = await prisma.category.create({
    data: { name: 'Bebidas' },
  });
  console.log('Categoria criada:', category1.name);

  const category2 = await prisma.category.create({
    data: { name: 'Alimentos' },
  });
  console.log('Categoria criada:', category2.name);

  const category3 = await prisma.category.create({
    data: { name: 'Limpeza' },
  });
  console.log('Categoria criada:', category3.name);

  // Criar Produtos para Mercado 1
  await prisma.product.createMany({
    data: [
      {
        name: 'Coca-Cola 2L',
        description: 'Refrigerante Coca-Cola 2 litros',
        price: 8.99,
        marketId: market1.id,
        categoryId: category1.id,
        imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400',
        stock: 50,
      },
      {
        name: 'Água Mineral 500ml',
        description: 'Água mineral sem gás',
        price: 2.50,
        marketId: market1.id,
        categoryId: category1.id,
        imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400',
        stock: 100,
      },
      {
        name: 'Arroz 5kg',
        description: 'Arroz branco tipo 1',
        price: 25.90,
        marketId: market1.id,
        categoryId: category2.id,
        imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400',
        stock: 30,
      },
      {
        name: 'Feijão 1kg',
        description: 'Feijão carioca',
        price: 8.50,
        marketId: market1.id,
        categoryId: category2.id,
        imageUrl: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=400',
        stock: 40,
      },
      {
        name: 'Detergente 500ml',
        description: 'Detergente líquido',
        price: 3.20,
        marketId: market1.id,
        categoryId: category3.id,
        imageUrl: 'https://images.unsplash.com/photo-1585421514738-01798e347a57?w=400',
        stock: 60,
      },
    ],
  });
  console.log('Produtos criados para Mercado 1');

  // Criar Produtos para Mercado 2
  await prisma.product.createMany({
    data: [
      {
        name: 'Suco de Laranja 1L',
        description: 'Suco natural de laranja',
        price: 7.90,
        marketId: market2.id,
        categoryId: category1.id,
        imageUrl: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400',
        stock: 25,
      },
      {
        name: 'Macarrão 500g',
        description: 'Macarrão espaguete',
        price: 4.50,
        marketId: market2.id,
        categoryId: category2.id,
        imageUrl: 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=400',
        stock: 35,
      },
      {
        name: 'Sabão em Pó 1kg',
        description: 'Sabão em pó para roupas',
        price: 15.90,
        marketId: market2.id,
        categoryId: category3.id,
        imageUrl: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=400',
        stock: 20,
      },
    ],
  });
  console.log('Produtos criados para Mercado 2');


  // Criar Biblioteca de Imagens de Produtos
  const productImage1 = await prisma.productImage.create({
    data: {
      url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400',
      name: 'Coca-Cola 2L',
      category: 'Bebidas',
      tags: ['refrigerante', 'coca', 'bebida'],
    },
  });

  const productImage2 = await prisma.productImage.create({
    data: {
      url: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400',
      name: 'Água Mineral',
      category: 'Bebidas',
      tags: ['água', 'mineral', 'bebida'],
    },
  });

  const productImage3 = await prisma.productImage.create({
    data: {
      url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400',
      name: 'Arroz 5kg',
      category: 'Alimentos',
      tags: ['arroz', 'grão', 'alimento'],
    },
  });

  const productImage4 = await prisma.productImage.create({
    data: {
      url: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=400',
      name: 'Feijão 1kg',
      category: 'Alimentos',
      tags: ['feijão', 'grão', 'alimento'],
    },
  });

  const productImage5 = await prisma.productImage.create({
    data: {
      url: 'https://images.unsplash.com/photo-1585421514738-01798e347a57?w=400',
      name: 'Detergente 500ml',
      category: 'Limpeza',
      tags: ['detergente', 'limpeza', 'cozinha'],
    },
  });

  const productImage6 = await prisma.productImage.create({
    data: {
      url: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400',
      name: 'Suco de Laranja 1L',
      category: 'Bebidas',
      tags: ['suco', 'laranja', 'natural', 'bebida'],
    },
  });

  const productImage7 = await prisma.productImage.create({
    data: {
      url: 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=400',
      name: 'Macarrão 500g',
      category: 'Alimentos',
      tags: ['macarrão', 'massa', 'alimento'],
    },
  });

  const productImage8 = await prisma.productImage.create({
    data: {
      url: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=400',
      name: 'Sabão em Pó 1kg',
      category: 'Limpeza',
      tags: ['sabão', 'roupas', 'limpeza'],
    },
  });

  console.log('Biblioteca de imagens de produtos criada:', productImage1.name);

  console.log('\n=== SEED CONCLUÍDO ===');
  console.log('\nCredenciais de acesso:');
  console.log('ADMIN: admin@mercadoexpress.com / admin123');
  console.log('GESTOR 1: gestor1@mercadoexpress.com / gestor123');
  console.log('GESTOR 2: gestor2@mercadoexpress.com / gestor456');
  console.log('CLIENTE 1: cliente1@teste.com / cliente123');
  console.log('CLIENTE 2: cliente2@teste.com / cliente456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
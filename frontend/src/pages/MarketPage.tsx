import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { ShoppingCart, MapPin, Phone, Clock, Store, ChevronLeft } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  stock: number;
  categoryId: string;
  category: {
    id: string;
    name: string;
  };
}

interface Category {
  id: string;
  name: string;
}

interface Market {
  id: string;
  name: string;
  address: string;
  description: string;
  phone: string;
  whatsapp: string;
  logoUrl: string;
  bannerUrl: string;
  openTime: string;
  closeTime: string;
  isActive: boolean;
}

function ProductPlaceholder() {
  return (
    <div className="flex h-full items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
      <Store size={36} className="text-emerald-300" />
    </div>
  );
}

export default function MarketPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [market, setMarket] = useState<Market | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadMarketData();
    }
  }, [id]);

  const loadMarketData = async () => {
    try {
      const [marketRes, productsRes, categoriesRes] = await Promise.all([
        api.get(`/markets/${id}`),
        api.get(`/catalog/products/market/${id}`),
        api.get('/catalog/categories'),
      ]);
      setMarket(marketRes.data);
      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const isMarketOpen = () => {
    if (!market?.openTime || !market?.closeTime) return true;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const [openHour, openMinute] = market.openTime.split(':').map(Number);
    const [closeHour, closeMinute] = market.closeTime.split(':').map(Number);

    const openTime = openHour * 60 + openMinute;
    const closeTime = closeHour * 60 + closeMinute;

    return currentTime >= openTime && currentTime <= closeTime;
  };

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(p => p.categoryId === selectedCategory);

  const handleAddToCart = async (productId: string) => {
    try {
      setAddingId(productId);
      await api.post('/cart/items', { productId, quantity: 1 });
      setAddedId(productId);
      setTimeout(() => setAddedId(null), 2000);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Erro ao adicionar ao carrinho';
      alert(msg);
      console.error('[MarketPage] Erro ao adicionar ao carrinho:', err.message);
    } finally {
      setAddingId(null);
    }
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    const [hour, minute] = time.split(':');
    return `${hour}:${minute}`;
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-slate-500">Carregando...</div>
    );
  }

  if (!market) {
    return (
      <div className="py-12 text-center">
        <p className="text-red-600">Mercado não encontrado</p>
        <Link to="/" className="mt-4 inline-flex items-center gap-1 text-sm text-emerald-600 hover:underline">
          <ChevronLeft size={14} /> Voltar
        </Link>
      </div>
    );
  }

  const isOpen = isMarketOpen();

  return (
    <div>
      {/* Banner */}
      {market.bannerUrl && (
        <div className="relative h-48 w-full overflow-hidden rounded-2xl sm:h-64">
          <img
            src={market.bannerUrl}
            alt={market.name}
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>
      )}

      {/* Header do Mercado */}
      <div className={`${market.bannerUrl ? '-mt-10 relative z-10' : 'mt-0'} mb-6`}>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-4 sm:gap-6">
            {/* Logo */}
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-slate-200 sm:h-24 sm:w-24">
              {market.logoUrl ? (
                <img
                  src={market.logoUrl}
                  alt={market.name}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
                  <Store size={32} className="text-emerald-400" />
                </div>
              )}
            </div>

            {/* Informações */}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-slate-900 sm:text-2xl truncate">
                {market.name}
              </h1>

              {market.description && (
                <p className="mt-1 text-sm text-slate-500">{market.description}</p>
              )}

              <div className="mt-3 space-y-1.5">
                {market.address && (
                  <div className="flex items-center gap-1.5 text-sm text-slate-500">
                    <MapPin size={14} className="shrink-0 text-slate-400" />
                    <span className="truncate">{market.address}</span>
                  </div>
                )}

                {market.phone && (
                  <div className="flex items-center gap-1.5 text-sm text-slate-500">
                    <Phone size={14} className="shrink-0 text-slate-400" />
                    <span>{market.phone}</span>
                  </div>
                )}

                {market.openTime && market.closeTime && (
                  <div className="flex items-center gap-1.5 text-sm text-slate-500">
                    <Clock size={14} className="shrink-0 text-slate-400" />
                    <span>
                      {formatTime(market.openTime)} às {formatTime(market.closeTime)}
                    </span>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      isOpen
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${isOpen ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    {isOpen ? 'Aberto agora' : 'Fechado'}
                  </span>
                  {!market.isActive && (
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                      Desativado
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Categorias e Produtos */}
      <div>
        {/* Categorias */}
        {categories.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">Categorias</h2>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                  selectedCategory === 'all'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                Todos
              </button>
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                    selectedCategory === category.id
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Produtos */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            {selectedCategory === 'all' ? 'Todos os Produtos' : 'Produtos da Categoria'}
          </h2>

          {filteredProducts.length === 0 ? (
            <div className="py-12 text-center">
              <Store size={48} className="mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500">Nenhum produto disponível no momento</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map(product => (
                <div
                  key={product.id}
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
                >
                  <div className="relative h-40 overflow-hidden bg-slate-100 sm:h-44">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <ProductPlaceholder />
                    )}
                    {product.stock === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
                        <span className="rounded-full bg-slate-900/80 px-3 py-1 text-xs font-medium text-white">
                          Sem estoque
                        </span>
                      </div>
                    )}
                    {product.stock > 0 && product.stock <= 10 && (
                      <div className="absolute right-2 top-2">
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                          Últimas unidades
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="text-base font-semibold text-slate-900 truncate">
                      {product.name}
                    </h3>
                    {product.description && (
                      <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                        {product.description}
                      </p>
                    )}
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-lg font-bold text-emerald-600">
                        R$ {product.price.toFixed(2)}
                      </span>
                      {product.stock > 0 && (
                        <span className="text-xs text-slate-400">
                          {product.stock} em estoque
                        </span>
                      )}
                    </div>

                    <div className="mt-3">
                      {user && product.stock > 0 ? (
                        <button
                          onClick={() => handleAddToCart(product.id)}
                          disabled={addingId === product.id}
                          className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-70 ${
                            addedId === product.id
                              ? 'bg-emerald-600'
                              : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800'
                          }`}
                        >
                          <ShoppingCart size={15} />
                          {addingId === product.id
                            ? 'Adicionando...'
                            : addedId === product.id
                              ? '✓ Adicionado!'
                              : 'Adicionar ao Carrinho'}
                        </button>
                      ) : user && product.stock === 0 ? (
                        <div className="flex w-full items-center justify-center rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-400">
                          Indisponível
                        </div>
                      ) : (
                        <Link
                          to="/login"
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                        >
                          <ShoppingCart size={15} />
                          Faça login
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
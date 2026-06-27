import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { ShoppingCart, MapPin, Phone, Clock, Store, ChevronRight } from 'lucide-react';

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

export default function MarketPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [market, setMarket] = useState<Market | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

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

  const formatTime = (time: string) => {
    if (!time) return '';
    const [hour, minute] = time.split(':');
    return `${hour}:${minute}`;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Carregando...</div>
      </div>
    );
  }

  if (!market) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-600">Mercado não encontrado</div>
      </div>
    );
  }

  const isOpen = isMarketOpen();

  return (
    <div>
      {/* Banner */}
      {market.bannerUrl && (
        <div className="relative h-64 md:h-96 w-full overflow-hidden">
          <img
            src={market.bannerUrl}
            alt={market.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      )}

      {/* Header do Mercado */}
      <div className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-start gap-6">
            {/* Logo */}
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-lg overflow-hidden shadow-lg flex-shrink-0">
              {market.logoUrl ? (
                <img
                  src={market.logoUrl}
                  alt={market.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : (
                <div className="w-full h-full bg-emerald-100 flex items-center justify-center">
                  <Store size={48} className="text-emerald-400" />
                </div>
              )}
            </div>

            {/* Informações */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {market.name}
              </h1>
              
              {market.description && (
                <p className="text-gray-600 mb-3">{market.description}</p>
              )}

              <div className="space-y-2">
                {market.address && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin size={18} />
                    <span>{market.address}</span>
                  </div>
                )}

                {market.phone && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone size={18} />
                    <span>{market.phone}</span>
                  </div>
                )}

                {market.openTime && market.closeTime && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock size={18} />
                    <span>
                      {formatTime(market.openTime)} às {formatTime(market.closeTime)}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      isOpen
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {isOpen ? '🟢 Aberto' : '🔴 Fechado'}
                  </span>
                  {!market.isActive && (
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                      Desativado pelo admin
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Categorias e Produtos */}
      <div className="container mx-auto px-4 py-8">
        {/* Categorias */}
        {categories.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Categorias</h2>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  selectedCategory === 'all'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Todos
              </button>
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    selectedCategory === category.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
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
          <h2 className="text-2xl font-bold mb-4">
            {selectedCategory === 'all' ? 'Todos os Produtos' : 'Produtos da Categoria'}
          </h2>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Store size={64} className="mx-auto mb-4 text-gray-300" />
              <p>Nenhum produto disponível no momento</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map(product => (
                <div
                  key={product.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
                >
                  <div className="h-48 bg-gray-200 relative">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="h-full bg-emerald-100 flex items-center justify-center">
                        <Store size={48} className="text-emerald-400" />
                      </div>
                    )}
                    {product.stock === 0 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                          Sem estoque
                        </span>
                      </div>
                    )}
                    {product.stock > 0 && product.stock <= 10 && (
                      <div className="absolute top-2 right-2">
                        <span className="bg-yellow-500 text-white px-2 py-1 rounded text-xs font-medium">
                          Últimas unidades
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold text-lg text-gray-900 mb-1">
                      {product.name}
                    </h3>
                    {product.description && (
                      <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                        {product.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl font-bold text-emerald-600">
                        R$ {product.price.toFixed(2)}
                      </span>
                      {product.stock > 0 && (
                        <span className="text-sm text-gray-500">
                          {product.stock} em estoque
                        </span>
                      )}
                    </div>

                    {user && product.stock > 0 && (
                      <Link
                        to={`/cart`}
                        className="w-full bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 transition flex items-center justify-center gap-2"
                      >
                        <ShoppingCart size={18} />
                        Adicionar ao Carrinho
                      </Link>
                    )}

                    {!user && (
                      <Link
                        to="/login"
                        className="w-full bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 transition flex items-center justify-center gap-2"
                      >
                        <ShoppingCart size={18} />
                        Faça login para comprar
                      </Link>
                    )}
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
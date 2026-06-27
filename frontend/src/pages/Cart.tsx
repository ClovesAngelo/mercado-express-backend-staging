import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ShoppingCart, Trash2, Minus, Plus, ArrowLeft } from 'lucide-react';

interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    market: { name: string };
    category?: { name: string };
  };
}

interface CartData {
  items?: CartItem[] | null;
  total?: number | null;
  id?: string;
}

export default function Cart() {
  const [cart, setCart] = useState<CartData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const loadCart = useCallback(() => {
    api.get('/cart').then(({ data }) => {
      setCart(data || {});
      setLoading(false);
    }).catch(() => {
      setCart({});
      setLoading(false);
    });
  }, []);

  useEffect(() => { loadCart(); }, [loadCart]);

  const updateQuantity = async (productId: string, quantity: number) => {
    if (quantity < 1) {
      await removeItem(productId);
      return;
    }
    try {
      await api.post(`/cart/items/${productId}`, { quantity });
      loadCart();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao atualizar quantidade');
    }
  };

  const removeItem = async (productId: string) => {
    try {
      await api.delete(`/cart/items/${productId}`);
      loadCart();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao remover item');
    }
  };

  const goToCheckout = () => {
    navigate('/checkout');
  };

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-20 bg-gray-200 rounded" /><div className="h-20 bg-gray-200 rounded" /></div>;

  const items = cart?.items ?? [];
  const total = cart?.total ?? 0;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={20} /></button>
        <h1 className="text-2xl font-bold">Carrinho</h1>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingCart size={64} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">Seu carrinho está vazio</p>
          <button onClick={() => navigate('/')} className="mt-4 bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700">
            Ver mercados
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {items.map(item => (
              <div key={item.id || item.productId} className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold">{item.product?.name || 'Produto'}</h3>
                  <p className="text-sm text-gray-500">{item.product?.market?.name || ''}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-sm text-gray-500">R$ {(item.product?.price ?? 0).toFixed(2)} un.</span>
                    <span className="text-emerald-600 font-bold">
                      R$ {((item.product?.price ?? 0) * (item.quantity ?? 0)).toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.productId, (item.quantity ?? 0) - 1)}
                    className="p-1.5 hover:bg-gray-100 rounded-lg border"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-8 text-center font-medium">{item.quantity ?? 0}</span>
                  <button
                    onClick={() => updateQuantity(item.productId, (item.quantity ?? 0) + 1)}
                    className="p-1.5 hover:bg-gray-100 rounded-lg border"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <button onClick={() => removeItem(item.productId)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 h-fit">
            <h2 className="font-semibold text-lg mb-4">Resumo</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Itens</span>
                <span>{items.reduce((s, i) => s + (i.quantity ?? 0), 0)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-emerald-600">R$ {(total ?? 0).toFixed(2)}</span>
              </div>
            </div>
            <button
              onClick={goToCheckout}
              disabled={items.length === 0}
              className="w-full mt-6 bg-emerald-600 text-white py-3 rounded-lg font-medium hover:bg-emerald-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              Continuar para Pagamento
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
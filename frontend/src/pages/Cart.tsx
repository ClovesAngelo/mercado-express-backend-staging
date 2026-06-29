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

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-20 rounded-xl bg-slate-200" />
      <div className="h-20 rounded-xl bg-slate-200" />
    </div>
  );

  const items = cart?.items ?? [];
  const total = cart?.total ?? 0;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Carrinho</h1>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {items.length === 0 ? (
        <div className="py-16 text-center">
          <ShoppingCart size={56} className="mx-auto mb-4 text-slate-300" />
          <p className="text-lg text-slate-500">Seu carrinho está vazio</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Ver mercados
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {items.map(item => (
              <div key={item.id || item.productId} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 truncate">{item.product?.name || 'Produto'}</h3>
                  <p className="text-sm text-slate-500 truncate">{item.product?.market?.name || ''}</p>
                  <div className="mt-2 flex items-center gap-4">
                    <span className="text-sm text-slate-500">R$ {(item.product?.price ?? 0).toFixed(2)} un.</span>
                    <span className="font-bold text-emerald-600">
                      R$ {((item.product?.price ?? 0) * (item.quantity ?? 0)).toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.productId, (item.quantity ?? 0) - 1)}
                    className="rounded-lg border border-slate-200 p-1.5 text-slate-500 transition hover:bg-slate-50"
                  >
                    <Minus size={15} />
                  </button>
                  <span className="w-8 text-center text-sm font-medium text-slate-900">{item.quantity ?? 0}</span>
                  <button
                    onClick={() => updateQuantity(item.productId, (item.quantity ?? 0) + 1)}
                    className="rounded-lg border border-slate-200 p-1.5 text-slate-500 transition hover:bg-slate-50"
                  >
                    <Plus size={15} />
                  </button>
                </div>
                <button
                  onClick={() => removeItem(item.productId)}
                  className="rounded-lg p-2 text-red-400 transition hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            ))}
          </div>
          <div className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Resumo</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Itens</span>
                <span className="text-slate-900 font-medium">{items.reduce((s, i) => s + (i.quantity ?? 0), 0)}</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between text-lg font-bold">
                <span className="text-slate-900">Total</span>
                <span className="text-emerald-600">R$ {(total ?? 0).toFixed(2)}</span>
              </div>
            </div>
            <button
              onClick={goToCheckout}
              disabled={items.length === 0}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Continuar para Pagamento
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
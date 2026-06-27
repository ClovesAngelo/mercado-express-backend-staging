import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ArrowLeft, CreditCard, Wallet, Smartphone, CheckCircle, Loader2 } from 'lucide-react';

interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    market: { name: string };
  };
}

interface CartData {
  items?: CartItem[] | null;
  total?: number | null;
}

type PaymentMethod = 'pix' | 'cash' | 'card';

export default function Checkout() {
  const [cart, setCart] = useState<CartData>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const timeoutRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  // Dados do comprador
  const [customerName, setCustomerName] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [reference, setReference] = useState('');

  // Pagamento
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [needsChange, setNeedsChange] = useState(false);
  const [changeFor, setChangeFor] = useState('');

  useEffect(() => {
    console.log('[Checkout] Component mounted');
    mountedRef.current = true;
    api.get('/cart').then(({ data }) => {
      console.log('[Checkout] Cart loaded:', data);
      if (mountedRef.current) {
        setCart(data || {});
        setLoading(false);
      }
    }).catch((err) => {
      console.error('[Checkout] Error loading cart:', err);
      if (mountedRef.current) {
        setError('Erro ao carregar carrinho');
        setLoading(false);
      }
    });
    return () => {
      console.log('[Checkout] Component unmounted');
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setCustomerName(user.name || '');
      } catch (e) {
        // ignore parse error
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[Checkout] Submit clicked');
    setSubmitting(true);
    setError('');

    try {
      const items = (cart.items ?? []).map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.product.price,
      }));

      const orderData: any = {
        userId: JSON.parse(localStorage.getItem('user') || '{}').id,
        items,
        customerName,
        zipCode,
        street,
        number,
        complement,
        neighborhood,
        city,
        state,
        reference,
        paymentMethod,
        needsChange,
        changeFor: needsChange ? parseFloat(changeFor) : null,
      };

      console.log('[Checkout] Payload enviado:', orderData);
      const response = await api.post('/orders/from-cart', orderData);
      console.log('[Checkout] Response:', response.data);
      if (mountedRef.current) {
        setSuccess(true);
        timeoutRef.current = window.setTimeout(() => {
          if (mountedRef.current) {
            navigate('/orders');
          }
        }, 2000);
      }
    } catch (err: any) {
      console.error('[Checkout] Error:', err);
      setError(err.response?.data?.message || 'Erro ao finalizar pedido');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="animate-pulse"><div className="h-96 bg-gray-200 rounded" /></div>;

  if (success) {
    return (
      <div className="text-center py-16">
        <CheckCircle size={80} className="mx-auto text-emerald-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Pedido realizado com sucesso!</h2>
        <p className="text-gray-500">Redirecionando para seus pedidos...</p>
      </div>
    );
  }

  const items = cart.items ?? [];
  console.log('[Checkout] Render state:', { loading, submitting, success, error, cartItemsCount: items.length, cart });
  const subtotal = items.reduce((sum, item) => sum + (item.product?.price ?? 0) * (item.quantity ?? 0), 0);
  const total = subtotal; // taxaEntrega = 0 inicialmente

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={20} /></button>
        <h1 className="text-2xl font-bold">Checkout</h1>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Dados do Comprador */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-semibold text-lg mb-4">Dados do Comprador</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Endereço de Entrega */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-semibold text-lg mb-4">Endereço de Entrega</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CEP *</label>
                <input
                  type="text"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rua *</label>
                <input
                  type="text"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número *</label>
                <input
                  type="text"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Complemento</label>
                <input
                  type="text"
                  value={complement}
                  onChange={(e) => setComplement(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bairro *</label>
                <input
                  type="text"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cidade *</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado *</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  required
                  maxLength={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Ponto de Referência</label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Forma de Pagamento */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-semibold text-lg mb-4">Forma de Pagamento</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="payment"
                  value="pix"
                  checked={paymentMethod === 'pix'}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="text-emerald-600"
                />
                <Smartphone className="text-emerald-600" size={24} />
                <div className="flex-1">
                  <p className="font-medium">PIX</p>
                  <p className="text-sm text-gray-500">O pagamento via PIX será realizado no momento da entrega.</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="payment"
                  value="cash"
                  checked={paymentMethod === 'cash'}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="text-emerald-600"
                />
                <Wallet className="text-emerald-600" size={24} />
                <div className="flex-1">
                  <p className="font-medium">Dinheiro</p>
                  <p className="text-sm text-gray-500">Pagamento em espécie na entrega</p>
                </div>
              </label>

              {paymentMethod === 'cash' && (
                <div className="ml-12 mt-3 space-y-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={needsChange}
                      onChange={(e) => setNeedsChange(e.target.checked)}
                      className="rounded text-emerald-600"
                    />
                    <span className="text-sm">Precisa de troco?</span>
                  </label>
                  {needsChange && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Troco para quanto?</label>
                      <input
                        type="number"
                        step="0.01"
                        value={changeFor}
                        onChange={(e) => setChangeFor(e.target.value)}
                        placeholder="Ex: 100,00"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  )}
                </div>
              )}

              <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="payment"
                  value="card"
                  checked={paymentMethod === 'card'}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="text-emerald-600"
                />
                <CreditCard className="text-emerald-600" size={24} />
                <div className="flex-1">
                  <p className="font-medium">Cartão</p>
                  <p className="text-sm text-gray-500">O entregador levará a maquininha no momento da entrega.</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Resumo do Pedido */}
        <div className="bg-white rounded-xl shadow-sm p-6 h-fit">
          <h2 className="font-semibold text-lg mb-4">Resumo do Pedido</h2>
          <div className="space-y-3 text-sm">
            {items.map(item => (
              <div key={item.id || item.productId} className="flex justify-between">
                <span className="text-gray-600">{item.product?.name} x{item.quantity}</span>
                <span>R$ {((item.product?.price ?? 0) * (item.quantity ?? 0)).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t pt-2 space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span>R$ {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Taxa de entrega</span>
                <span>Grátis</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-emerald-600">R$ {total.toFixed(2)}</span>
              </div>
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-6 bg-emerald-600 text-white py-3 rounded-lg font-medium hover:bg-emerald-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <><Loader2 size={20} className="animate-spin" /> Processando...</>
            ) : (
              'Confirmar Pedido'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
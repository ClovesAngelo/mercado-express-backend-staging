import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ArrowLeft, CreditCard, Wallet, Smartphone, CheckCircle, Loader2, Truck, Store } from 'lucide-react';

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
  marketId?: string;
}

type FulfillmentType = 'DELIVERY' | 'PICKUP';
type PaymentMethod = 'PIX' | 'DINHEIRO_NA_ENTREGA' | 'CARTAO_NA_ENTREGA';

interface MarketConfig {
  isOpenNow: boolean;
  deliveryAvailableNow: boolean;
  pickupAvailableNow: boolean;
  unavailableReason?: string | null;
  acceptsDelivery: boolean;
  acceptsPickup: boolean;
  deliveryStartTime?: string;
  deliveryEndTime?: string;
  pixEnabled: boolean;
  pixKey?: string;
  pixKeyType?: string;
  pixRecipientName?: string;
  pixInstructions?: string;
  whatsapp?: string;
}

export default function Checkout() {
  const [cart, setCart] = useState<CartData>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [createdOrder, setCreatedOrder] = useState<any>(null);
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
  const [reference, setReference] = useState('');

  // Atendimento e pagamento
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>('DELIVERY');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('DINHEIRO_NA_ENTREGA');
  const [needsChange, setNeedsChange] = useState(false);
  const [changeFor, setChangeFor] = useState('');
  const [marketConfig, setMarketConfig] = useState<MarketConfig | null>(null);
  const [deliveryUnavailable, setDeliveryUnavailable] = useState(false);

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

  useEffect(() => {
    const fetchMarketConfig = async () => {
      if (!cart.marketId) return;
      try {
        const response = await api.get(`/markets/${cart.marketId}`);
        const market = response.data;
        const config: MarketConfig = {
          isOpenNow: market.isOpenNow ?? true,
          deliveryAvailableNow: market.deliveryAvailableNow ?? false,
          pickupAvailableNow: market.pickupAvailableNow ?? false,
          unavailableReason: market.unavailableReason || null,
          acceptsDelivery: market.acceptsDelivery ?? true,
          acceptsPickup: market.acceptsPickup ?? true,
          deliveryStartTime: market.deliveryStartTime,
          deliveryEndTime: market.deliveryEndTime,
          pixEnabled: market.pixEnabled ?? false,
          pixKey: market.pixKey,
          pixKeyType: market.pixKeyType,
          pixRecipientName: market.pixRecipientName,
          pixInstructions: market.pixInstructions,
          whatsapp: market.whatsapp,
        };
        setMarketConfig(config);

        // Usar disponibilidade calculada pelo backend
        setDeliveryUnavailable(!config.deliveryAvailableNow);

        if (!config.deliveryAvailableNow && config.pickupAvailableNow) {
          setFulfillmentType('PICKUP');
        } else if (!config.acceptsDelivery && config.pickupAvailableNow) {
          setFulfillmentType('PICKUP');
        } else if (config.deliveryAvailableNow) {
          setFulfillmentType('DELIVERY');
        }

        if (config.pixEnabled) {
          setPaymentMethod('PIX');
        } else {
          setPaymentMethod('DINHEIRO_NA_ENTREGA');
        }
      } catch (err) {
        console.error('Erro ao carregar configuração do mercado:', err);
      }
    };

    fetchMarketConfig();
  }, [cart.marketId]);

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
        customerPhone: '',
        zipCode,
        street,
        number,
        complement,
        neighborhood,
        reference,
        fulfillmentType,
        paymentMethod,
        needsChange,
        changeFor: needsChange ? parseFloat(changeFor) : null,
      };

      console.log('[Checkout] Payload enviado:', orderData);
      const response = await api.post('/orders/from-cart', orderData);
      console.log('[Checkout] Response:', response.data);
      if (mountedRef.current) {
        setCreatedOrder(response.data);
        setSuccess(true);
      }
    } catch (err: any) {
      console.error('[Checkout] Error:', err);
      setError(err.response?.data?.message || 'Erro ao finalizar pedido');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="animate-pulse"><div className="h-96 bg-gray-200 rounded" /></div>;

  if (success && createdOrder) {
    const isPix = paymentMethod === 'PIX' || createdOrder.paymentMethod === 'PIX';
    const pixData = isPix && marketConfig ? marketConfig : null;

    return (
      <div className="text-center py-8">
        <CheckCircle size={80} className="mx-auto text-emerald-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Pedido realizado com sucesso!</h2>
        <p className="text-gray-500 mb-6">Número do pedido: <strong>#{createdOrder.id.slice(0, 8)}</strong></p>

        {pixData && (
          <div className="max-w-lg mx-auto bg-white rounded-xl shadow-sm p-6 text-left mb-6">
            <h3 className="text-lg font-semibold mb-4">Pagamento via PIX</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p><strong>Valor total:</strong> R$ {createdOrder.total.toFixed(2)}</p>
              <p><strong>Tipo de chave:</strong> {pixData.pixKeyType || 'Não informado'}</p>
              <p>
                <strong>Chave PIX:</strong>{' '}
                <span className="break-all">{pixData.pixKey}</span>
              </p>
              {pixData.pixRecipientName && (
                <p><strong>Nome do recebedor:</strong> {pixData.pixRecipientName}</p>
              )}
              {pixData.pixInstructions && (
                <p className="mt-2 text-gray-600">{pixData.pixInstructions}</p>
              )}
            </div>
            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => {
                  if (pixData.pixKey) {
                    navigator.clipboard.writeText(pixData.pixKey);
                    alert('Chave PIX copiada!');
                  }
                }}
                className="flex-1 bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 transition"
              >
                Copiar chave PIX
              </button>
              {pixData.whatsapp && (
                <a
                  href={`https://wa.me/${pixData.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
                    `Olá, fiz um pedido no Mercado Express.\nNúmero do pedido: ${createdOrder.id.slice(0, 8)}\nValor: R$ ${createdOrder.total.toFixed(2)}\nSegue o comprovante do Pix.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition text-center"
                >
                  Enviar comprovante pelo WhatsApp
                </a>
              )}
            </div>
          </div>
        )}

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

          {/* Tipo de Atendimento */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-semibold text-lg mb-4">Tipo de Atendimento</h2>
            {!marketConfig?.isOpenNow && marketConfig?.unavailableReason && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800 mb-4">
                {marketConfig.unavailableReason}
              </div>
            )}
            <div className="space-y-3">
              {marketConfig?.deliveryAvailableNow && (
                <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="fulfillment"
                    value="DELIVERY"
                    checked={fulfillmentType === 'DELIVERY'}
                    onChange={(e) => setFulfillmentType(e.target.value as FulfillmentType)}
                    className="text-emerald-600"
                  />
                  <Truck className="text-emerald-600" size={24} />
                  <div className="flex-1">
                    <p className="font-medium">Entrega</p>
                    <p className="text-sm text-gray-500">Receber no endereço informado</p>
                  </div>
                </label>
              )}

              {marketConfig?.pickupAvailableNow && (
                <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="fulfillment"
                    value="PICKUP"
                    checked={fulfillmentType === 'PICKUP'}
                    onChange={(e) => setFulfillmentType(e.target.value as FulfillmentType)}
                    className="text-emerald-600"
                  />
                  <Store className="text-emerald-600" size={24} />
                  <div className="flex-1">
                    <p className="font-medium">Retirada no mercado</p>
                    <p className="text-sm text-gray-500">Retirar pessoalmente no estabelecimento</p>
                  </div>
                </label>
              )}

              {deliveryUnavailable && marketConfig?.pickupAvailableNow && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                  Entrega indisponível neste horário. Você ainda pode escolher retirada.
                </div>
              )}

              {!marketConfig?.deliveryAvailableNow && !marketConfig?.pickupAvailableNow && marketConfig?.isOpenNow && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                  Nenhuma forma de atendimento disponível no momento. Tente novamente mais tarde.
                </div>
              )}
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
              {marketConfig?.pixEnabled && (
                <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="payment"
                    value="PIX"
                    checked={paymentMethod === 'PIX'}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="text-emerald-600"
                  />
                  <Smartphone className="text-emerald-600" size={24} />
                  <div className="flex-1">
                    <p className="font-medium">PIX</p>
                    <p className="text-sm text-gray-500">Pagamento via PIX antes da entrega/retirada.</p>
                  </div>
                </label>
              )}

              <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="payment"
                  value="DINHEIRO_NA_ENTREGA"
                  checked={paymentMethod === 'DINHEIRO_NA_ENTREGA'}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="text-emerald-600"
                />
                <Wallet className="text-emerald-600" size={24} />
                <div className="flex-1">
                  <p className="font-medium">Dinheiro</p>
                  <p className="text-sm text-gray-500">Pagamento em espécie na entrega/retirada</p>
                </div>
              </label>

              {paymentMethod === 'DINHEIRO_NA_ENTREGA' && (
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
                  value="CARTAO_NA_ENTREGA"
                  checked={paymentMethod === 'CARTAO_NA_ENTREGA'}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="text-emerald-600"
                />
                <CreditCard className="text-emerald-600" size={24} />
                <div className="flex-1">
                  <p className="font-medium">Cartão</p>
                  <p className="text-sm text-gray-500">O entregador levará a maquininha no momento da entrega/retirada.</p>
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
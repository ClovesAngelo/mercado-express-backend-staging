import { useState, useEffect } from 'react';
import api from '../services/api';
import { Package, Clock, CheckCircle, Truck, XCircle } from 'lucide-react';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: { name: string };
}

interface Order {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  customerName: string;
  zipCode: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  reference?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  fulfillmentType?: string;
  needsChange: boolean;
  changeFor?: number;
  items?: OrderItem[] | null;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  CONFIRMED: { label: 'Confirmado', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  OUT_FOR_DELIVERY: { label: 'Saiu para entrega', color: 'bg-purple-100 text-purple-800', icon: Truck },
  DELIVERED: { label: 'Entregue', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  CANCELLED: { label: 'Cancelado', color: 'bg-red-100 text-red-800', icon: XCircle },
};

const paymentMethodLabels: Record<string, string> = {
  PIX: 'PIX',
  DINHEIRO_NA_ENTREGA: 'Dinheiro',
  CARTAO_NA_ENTREGA: 'Cartão',
};

const fulfillmentTypeLabels: Record<string, string> = {
  DELIVERY: 'Entrega',
  PICKUP: 'Retirada',
};

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders/my').then(({ data }) => {
      setOrders(Array.isArray(data) ? data : []);
      setLoading(false);
    }).catch(() => {
      setOrders([]);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="animate-pulse space-y-4">{[1,2].map(i => <div key={i} className="h-32 bg-gray-200 rounded" />)}</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Meus Pedidos</h1>
      {orders.length === 0 ? (
        <div className="text-center py-16">
          <Package size={64} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">Nenhum pedido ainda</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => {
            const status = statusConfig[order.status] || statusConfig.PENDING;
            const StatusIcon = status.icon;
            const items = order.items ?? [];
            return (
              <div key={order.id} className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-500">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : 'Data indisponível'}
                    </p>
                    <p className="text-xs text-gray-400 font-mono mt-1">#{order.id?.slice(0, 8) || '---'}</p>
                  </div>
                  <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
                    <StatusIcon size={16} />
                    {status.label}
                  </span>
                </div>
                <div className="space-y-2">
                  {items.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.product?.name || 'Produto'} x{item.quantity ?? 0}</span>
                      <span className="text-gray-600">R$ {((item.price ?? 0) * (item.quantity ?? 0)).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                
                <div className="border-t mt-4 pt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Cliente</span>
                    <span className="font-medium">{order.customerName || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Endereço</span>
                    <span className="font-medium text-right">
                      {order.street}, {order.number} - {order.neighborhood}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Cidade/UF</span>
                    <span className="font-medium">{order.city}/{order.state}</span>
                  </div>
                  {order.reference && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Referência</span>
                      <span className="font-medium">{order.reference}</span>
                    </div>
                  )}
                  {order.fulfillmentType && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Tipo</span>
                      <span className="font-medium">
                        {fulfillmentTypeLabels[order.fulfillmentType] || order.fulfillmentType}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Pagamento</span>
                    <span className="font-medium">
                      {paymentMethodLabels[order.paymentMethod || ''] || order.paymentMethod}
                      {order.paymentMethod === 'DINHEIRO_NA_ENTREGA' && order.needsChange && order.changeFor && (
                        <span className="text-emerald-600"> (troco para R$ {order.changeFor.toFixed(2)})</span>
                      )}
                    </span>
                  </div>
                  {order.paymentStatus && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Status pagamento</span>
                      <span className="font-medium">
                        {order.paymentStatus === 'PENDING' ? 'Pendente' : 'Confirmado'}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="border-t mt-4 pt-4 flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-emerald-600">R$ {(order.total ?? 0).toFixed(2)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
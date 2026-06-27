import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import ImageUpload from '../components/ImageUpload';
import { Package, AlertTriangle } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  stock: number;
  minStock: number;
  marketId: string;
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

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    description: string;
  };
}

interface Order {
  id: string;
  status: string;
  total: number;
  customerName: string;
  createdAt: string;
  customerPhone?: string;
  zipCode?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  reference?: string;
  paymentMethod?: string;
  needsChange?: boolean;
  changeFor?: number;
  items: OrderItem[];
}

interface MarketInfo {
  id: string;
  name: string;
  address: string;
  description?: string;
  phone?: string;
  whatsapp?: string;
  imageUrl?: string;
  logoUrl?: string;
  bannerUrl?: string;
  openTime?: string;
  closeTime?: string;
}

export default function Manager() {
  const { user, isGestor } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [marketInfo, setMarketInfo] = useState<MarketInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'orders' | 'settings'>('products');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    address: '',
    description: '',
    phone: '',
    whatsapp: '',
    imageUrl: '',
    logoUrl: '',
    bannerUrl: '',
    openTime: '',
    closeTime: '',
  });
  const [stockData, setStockData] = useState({
    quantity: 0,
    minStock: 0,
  });

  useEffect(() => {
    if (!isGestor || !user?.marketId) {
      return;
    }
    loadData();
  }, [isGestor, user?.marketId]);

  const loadData = async () => {
    try {
      const [productsRes, categoriesRes, ordersRes, marketRes] = await Promise.all([
        api.get(`/catalog/products/market/${user?.marketId}`),
        api.get('/catalog/categories'),
        api.get('/orders'),
        api.get(`/markets/${user?.marketId}`),
      ]);
      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
      setOrders(ordersRes.data);
      setMarketInfo(marketRes.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status });
      loadData();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const handleCreateProduct = async () => {
    const name = prompt('Nome do produto:');
    if (!name) return;
    const description = prompt('Descrição:');
    const price = parseFloat(prompt('Preço:') || '0');
    const categoryId = prompt('ID da categoria:');
    const imageUrl = prompt('URL da imagem:');
    const stock = parseInt(prompt('Estoque inicial:') || '0');
    const minStock = parseInt(prompt('Estoque mínimo:') || '0');

    try {
      await api.post('/catalog/products', {
        name,
        description,
        price,
        categoryId,
        imageUrl,
        marketId: user?.marketId,
        stock,
        minStock,
      });
      loadData();
    } catch (error) {
      console.error('Erro ao criar produto:', error);
    }
  };

  const handleUpdateProduct = async (product: Product) => {
    const newPrice = parseFloat(prompt('Novo preço:', product.price.toString()) || '0');
    const newDescription = prompt('Nova descrição:', product.description || '');

    try {
      await api.patch(`/catalog/products/${product.id}`, {
        price: newPrice,
        description: newDescription,
      });
      loadData();
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) {
      return;
    }
    try {
      await api.delete(`/catalog/products/${productId}`);
      loadData();
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
    }
  };

  const handleOpenStockModal = (product: Product) => {
    setSelectedProduct(product);
    setStockData({
      quantity: product.stock,
      minStock: product.minStock || 0,
    });
    setShowStockModal(true);
  };

  const handleUpdateStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      await api.patch(`/catalog/products/${selectedProduct.id}/stock`, {
        stock: stockData.quantity,
        minStock: stockData.minStock,
      });
      setShowStockModal(false);
      setSelectedProduct(null);
      loadData();
    } catch (error) {
      console.error('Erro ao atualizar estoque:', error);
      alert('Erro ao atualizar estoque');
    }
  };

  const handleCreateCategory = async () => {
    const name = prompt('Nome da categoria:');
    if (!name) return;

    try {
      await api.post('/catalog/categories', { name });
      loadData();
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
    }
  };

  const handleEditMarket = () => {
    if (!marketInfo) return;
    setEditFormData({
      name: marketInfo.name,
      address: marketInfo.address,
      description: marketInfo.description || '',
      phone: marketInfo.phone || '',
      whatsapp: marketInfo.whatsapp || '',
      imageUrl: marketInfo.imageUrl || '',
      logoUrl: marketInfo.logoUrl || '',
      bannerUrl: marketInfo.bannerUrl || '',
      openTime: marketInfo.openTime || '',
      closeTime: marketInfo.closeTime || '',
    });
    setShowEditModal(true);
  };

  const handleUpdateMarket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.marketId) return;

    try {
      await api.patch(`/markets/${user.marketId}`, editFormData);
      setShowEditModal(false);
      loadData();
    } catch (error) {
      console.error('Erro ao atualizar mercado:', error);
      alert('Erro ao atualizar mercado. Tente novamente.');
    }
  };

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  const calculateOrderTotal = (order: Order) => {
    return order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isLowStock = (product: Product) => {
    return product.stock <= (product.minStock || 0);
  };

  if (!isGestor) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Acesso negado. Apenas gestores de mercado podem acessar esta página.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Painel do Gestor</h1>
        {marketInfo && (
          <button
            onClick={handleEditMarket}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Editar Meu Mercado
          </button>
        )}
      </div>

      {marketInfo && (
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <div className="flex items-start gap-4">
            {marketInfo.logoUrl && (
              <img
                src={marketInfo.logoUrl}
                alt={marketInfo.name}
                className="w-24 h-24 object-cover rounded-lg"
              />
            )}
            <div className="flex-1">
              <h2 className="text-2xl font-semibold mb-2">{marketInfo.name}</h2>
              <p className="text-gray-600 mb-1">📍 {marketInfo.address}</p>
              {marketInfo.phone && (
                <p className="text-gray-600 mb-1">📞 {marketInfo.phone}</p>
              )}
              {marketInfo.whatsapp && (
                <p className="text-gray-600 mb-1">💬 WhatsApp: {marketInfo.whatsapp}</p>
              )}
              {marketInfo.description && (
                <p className="text-gray-500 text-sm mt-2">{marketInfo.description}</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('products')}
              className={`${
                activeTab === 'products'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Produtos
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`${
                activeTab === 'categories'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Categorias
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`${
                activeTab === 'orders'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Pedidos
            </button>
          </nav>
        </div>
      </div>

      {activeTab === 'products' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Produtos do Meu Mercado</h2>
            <button
              onClick={() => navigate('/admin/products/create')}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Novo Produto
            </button>
          </div>

          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoria
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Preço
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estoque
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map(product => (
                  <tr key={product.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">{product.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.category?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      R$ {product.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <span className={isLowStock(product) ? 'text-red-600 font-semibold' : 'text-gray-900'}>
                          {product.stock}
                        </span>
                        {isLowStock(product) && (
                          <AlertTriangle size={16} className="text-red-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.stock === 0 ? (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                          Sem estoque
                        </span>
                      ) : isLowStock(product) ? (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                          Estoque baixo
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                          Disponível
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleUpdateProduct(product)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleOpenStockModal(product)}
                        className="text-green-600 hover:text-green-900 mr-3"
                      >
                        Estoque
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'categories' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Categorias</h2>
            <button
              onClick={handleCreateCategory}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Nova Categoria
            </button>
          </div>

          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantidade de Produtos
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categories.map(category => (
                  <tr key={category.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {category.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {products.filter(p => p.categoryId === category.id).length}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Pedidos do Meu Mercado</h2>

          <div className="space-y-4">
            {orders.map(order => {
              const isExpanded = expandedOrderId === order.id;
              const orderTotal = calculateOrderTotal(order);

              return (
                <div key={order.id} className="bg-white shadow-md rounded-lg overflow-hidden">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Pedido #{order.id.slice(0, 8)}
                          </h3>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              order.status === 'PENDING'
                                ? 'bg-yellow-100 text-yellow-800'
                                : order.status === 'DELIVERED'
                                ? 'bg-green-100 text-green-800'
                                : order.status === 'PREPARING'
                                ? 'bg-blue-100 text-blue-800'
                                : order.status === 'DELIVERING'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {order.status === 'PENDING' && 'Pendente'}
                            {order.status === 'PREPARING' && 'Preparando'}
                            {order.status === 'DELIVERING' && 'Entregando'}
                            {order.status === 'DELIVERED' && 'Entregue'}
                            {order.status === 'CANCELLED' && 'Cancelado'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          <strong>Cliente:</strong> {order.customerName || 'Não informado'}
                        </p>
                        {order.customerPhone && (
                          <p className="text-sm text-gray-600 mb-1">
                            <strong>Telefone:</strong> {order.customerPhone}
                          </p>
                        )}
                        {order.paymentMethod && (
                          <p className="text-sm text-gray-600 mb-1">
                            <strong>Pagamento:</strong> {order.paymentMethod}
                          </p>
                        )}
                        {order.needsChange && (
                          <p className="text-sm text-gray-600 mb-1">
                            <strong>Troco para:</strong> R$ {order.changeFor?.toFixed(2)}
                          </p>
                        )}
                        <p className="text-sm text-gray-500">
                          <strong>Data:</strong> {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-2xl font-bold text-gray-900">
                          {formatCurrency(orderTotal)}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleOrderExpansion(order.id)}
                      className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium py-2 px-4 rounded transition"
                    >
                      {isExpanded ? 'Ocultar Detalhes' : 'Ver Detalhes'}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-gray-200 bg-gray-50 p-6">
                      <h4 className="text-lg font-semibold mb-4">Itens do Pedido</h4>
                      
                      <div className="space-y-3 mb-4">
                        {order.items.map((item, index) => {
                          const subtotal = item.price * item.quantity;
                          return (
                            <div key={item.id} className="bg-white p-4 rounded border border-gray-200">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">
                                    {index + 1}. {item.product.name}
                                  </p>
                                  {item.product.description && (
                                    <p className="text-sm text-gray-500 mt-1">
                                      {item.product.description}
                                    </p>
                                  )}
                                  <p className="text-sm text-gray-600 mt-2">
                                    <strong>Quantidade:</strong> {item.quantity}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    <strong>Preço unitário:</strong> {formatCurrency(item.price)}
                                  </p>
                                </div>
                                <div className="text-right ml-4">
                                  <p className="text-lg font-semibold text-gray-900">
                                    {formatCurrency(subtotal)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="border-t border-gray-300 pt-4">
                        <div className="flex justify-between items-center text-lg font-bold">
                          <span>Total do Pedido:</span>
                          <span className="text-2xl text-blue-600">
                            {formatCurrency(orderTotal)}
                          </span>
                        </div>
                      </div>

                      {(order.zipCode || order.street || order.neighborhood) && (
                        <div className="mt-6 border-t border-gray-300 pt-4">
                          <h4 className="text-lg font-semibold mb-3">Endereço de Entrega</h4>
                          <div className="bg-white p-4 rounded border border-gray-200">
                            {order.zipCode && (
                              <p className="text-sm text-gray-600 mb-1">
                                <strong>CEP:</strong> {order.zipCode}
                              </p>
                            )}
                            {order.street && (
                              <p className="text-sm text-gray-600 mb-1">
                                <strong>Rua:</strong> {order.street}
                                {order.number && `, ${order.number}`}
                              </p>
                            )}
                            {order.complement && (
                              <p className="text-sm text-gray-600 mb-1">
                                <strong>Complemento:</strong> {order.complement}
                              </p>
                            )}
                            {order.neighborhood && (
                              <p className="text-sm text-gray-600 mb-1">
                                <strong>Bairro:</strong> {order.neighborhood}
                              </p>
                            )}
                            {(order.city || order.state) && (
                              <p className="text-sm text-gray-600">
                                <strong>Cidade/UF:</strong> {order.city}
                                {order.city && order.state && ' - '}
                                {order.state}
                              </p>
                            )}
                            {order.reference && (
                              <p className="text-sm text-gray-600 mt-2">
                                <strong>Referência:</strong> {order.reference}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="mt-6">
                        <h4 className="text-lg font-semibold mb-3">Atualizar Status</h4>
                        <div className="flex gap-2">
                          <select
                            value={order.status}
                            onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                            className="border rounded px-3 py-2 text-sm"
                          >
                            <option value="PENDING">Pendente</option>
                            <option value="PREPARING">Preparando</option>
                            <option value="DELIVERING">Entregando</option>
                            <option value="DELIVERED">Entregue</option>
                            <option value="CANCELLED">Cancelado</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showEditModal && marketInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">Editar Mercado</h2>
            <form onSubmit={handleUpdateMarket}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Mercado *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Endereço *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.address}
                    onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    WhatsApp
                  </label>
                  <input
                    type="text"
                    value={editFormData.whatsapp}
                    onChange={(e) => setEditFormData({ ...editFormData, whatsapp: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Horário Abertura
                  </label>
                  <input
                    type="time"
                    value={editFormData.openTime}
                    onChange={(e) => setEditFormData({ ...editFormData, openTime: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Horário Fechamento
                  </label>
                  <input
                    type="time"
                    value={editFormData.closeTime}
                    onChange={(e) => setEditFormData({ ...editFormData, closeTime: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Logo do Mercado
                </label>
                <ImageUpload
                  value={editFormData.logoUrl}
                  onChange={(url) => setEditFormData({ ...editFormData, logoUrl: url })}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Banner do Mercado
                </label>
                <ImageUpload
                  value={editFormData.bannerUrl}
                  onChange={(url) => setEditFormData({ ...editFormData, bannerUrl: url })}
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showStockModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-6">Gerenciar Estoque</h2>
            <form onSubmit={handleUpdateStock}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Produto
                </label>
                <input
                  type="text"
                  value={selectedProduct.name}
                  disabled
                  className="w-full border rounded px-3 py-2 bg-gray-100"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estoque Atual *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={stockData.quantity}
                  onChange={(e) => setStockData({ ...stockData, quantity: parseInt(e.target.value) || 0 })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estoque Mínimo *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={stockData.minStock}
                  onChange={(e) => setStockData({ ...stockData, minStock: parseInt(e.target.value) || 0 })}
                  className="w-full border rounded px-3 py-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Alerta será exibido quando estoque atingir este valor
                </p>
              </div>

              {isLowStock(selectedProduct) && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded flex items-start gap-2">
                  <AlertTriangle className="text-yellow-600 flex-shrink-0" size={20} />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Estoque Baixo</p>
                    <p className="text-xs text-yellow-700">
                      O estoque atual está igual ou abaixo do mínimo
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowStockModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Atualizar Estoque
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
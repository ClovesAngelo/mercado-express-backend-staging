import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import ImageUpload from '../components/ImageUpload';
import { TrendingUp, Store, Users, ShoppingCart, DollarSign, Package } from 'lucide-react';

interface Market {
  id: string;
  name: string;
  address: string;
  imageUrl: string;
  logoUrl?: string;
  description?: string;
  phone?: string;
  isActive: boolean;
  managerId?: string;
  manager?: {
    id: string;
    name: string;
    email: string;
  };
  managers?: Array<{
    id: string;
    name: string;
    email: string;
  }>;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  marketId?: string | null;
}

interface DashboardStats {
  markets: {
    total: number;
    active: number;
    inactive: number;
  };
  users: {
    clients: number;
    managers: number;
  };
  orders: {
    pending: number;
    delivered: number;
    cancelled: number;
  };
  revenue: {
    total: number;
  };
}

export default function Admin() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'markets' | 'managers'>('dashboard');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    description: '',
    phone: '',
    imageUrl: '',
    managerName: '',
    managerEmail: '',
    managerPassword: '',
  });

  useEffect(() => {
    if (!isAdmin) {
      return;
    }
    loadData();
  }, [isAdmin]);

  const loadData = async () => {
    try {
      const [marketsRes, usersRes, statsRes] = await Promise.all([
        api.get('/markets'),
        api.get('/users'),
        api.get('/admin/dashboard').catch(() => ({ data: null })),
      ]);
      setMarkets(marketsRes.data);
      setUsers(usersRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleActivateMarket = async (id: string) => {
    try {
      await api.patch(`/markets/${id}/activate`);
      loadData();
    } catch (error) {
      console.error('Erro ao ativar mercado:', error);
    }
  };

  const handleDeactivateMarket = async (id: string) => {
    try {
      await api.patch(`/markets/${id}/deactivate`);
      loadData();
    } catch (error) {
      console.error('Erro ao desativar mercado:', error);
    }
  };

  const handleDeleteMarket = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este mercado?')) {
      return;
    }
    try {
      await api.delete(`/markets/${id}`);
      loadData();
    } catch (error) {
      console.error('Erro ao excluir mercado:', error);
    }
  };

  const handleCreateMarketWithManager = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/markets/with-manager', {
        market: {
          name: formData.name,
          address: formData.address,
          description: formData.description,
          phone: formData.phone,
          imageUrl: formData.imageUrl || undefined,
        },
        manager: {
          name: formData.managerName,
          email: formData.managerEmail,
          password: formData.managerPassword,
        },
      });
      setShowCreateModal(false);
      setFormData({
        name: '',
        address: '',
        description: '',
        phone: '',
        imageUrl: '',
        managerName: '',
        managerEmail: '',
        managerPassword: '',
      });
      loadData();
    } catch (error) {
      console.error('Erro ao criar mercado:', error);
      alert('Erro ao criar mercado. Tente novamente.');
    }
  };

  const handleCreateManager = async () => {
    const email = prompt('Email do gestor:');
    if (!email) return;
    const name = prompt('Nome do gestor:');
    if (!name) return;
    const password = prompt('Senha:');
    if (!password) return;
    const marketId = prompt('ID do mercado (deixe vazio para criar sem vínculo):');

    try {
      await api.post('/auth/register', {
        email,
        name,
        password,
        role: 'GESTOR_MERCADO',
        marketId: marketId || undefined,
      });
      alert('Gestor criado com sucesso!');
      loadData();
    } catch (error) {
      console.error('Erro ao criar gestor:', error);
      alert('Erro ao criar gestor');
    }
  };

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Acesso negado. Apenas administradores podem acessar esta página.
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

  const managers = users.filter(u => u.role === 'GESTOR_MERCADO');

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Painel Administrativo</h1>

      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`${
                activeTab === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('markets')}
              className={`${
                activeTab === 'markets'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Gestão de Mercados
            </button>
            <button
              onClick={() => setActiveTab('managers')}
              className={`${
                activeTab === 'managers'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Gestores
            </button>
            <button
              onClick={() => navigate('/admin/managers')}
              className="ml-4 text-sm text-blue-600 hover:text-blue-800"
            >
              Gerenciar Gestores →
            </button>
          </nav>
        </div>
      </div>

      {activeTab === 'dashboard' && stats && (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold mb-4">Visão Geral</h2>

          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Mercados */}
            <div className="bg-white shadow-md rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-700">Mercados</h3>
                <Store className="text-blue-500" size={24} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total</span>
                  <span className="font-bold text-xl">{stats.markets.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ativos</span>
                  <span className="font-semibold text-green-600">{stats.markets.active}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Inativos</span>
                  <span className="font-semibold text-red-600">{stats.markets.inactive}</span>
                </div>
              </div>
            </div>

            {/* Usuários */}
            <div className="bg-white shadow-md rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-700">Usuários</h3>
                <Users className="text-purple-500" size={24} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Clientes</span>
                  <span className="font-bold text-xl">{stats.users.clients}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Gestores</span>
                  <span className="font-semibold text-blue-600">{stats.users.managers}</span>
                </div>
              </div>
            </div>

            {/* Pedidos */}
            <div className="bg-white shadow-md rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-700">Pedidos</h3>
                <ShoppingCart className="text-orange-500" size={24} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Pendentes</span>
                  <span className="font-semibold text-yellow-600">{stats.orders.pending}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Entregues</span>
                  <span className="font-semibold text-green-600">{stats.orders.delivered}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cancelados</span>
                  <span className="font-semibold text-red-600">{stats.orders.cancelled}</span>
                </div>
              </div>
            </div>

            {/* Faturamento */}
            <div className="bg-white shadow-md rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-700">Faturamento</h3>
                <DollarSign className="text-green-500" size={24} />
              </div>
              <div className="mt-4">
                <p className="text-gray-600 text-sm mb-1">Total Vendido</p>
                <p className="font-bold text-2xl text-green-600">
                  R$ {stats.revenue.total.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Gráfico de Receita por Mercado (simplificado) */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Resumo</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Total de Mercados</p>
                <p className="text-3xl font-bold text-blue-600">{stats.markets.total}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Pedidos Entregues</p>
                <p className="text-3xl font-bold text-green-600">{stats.orders.delivered}</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Total de Clientes</p>
                <p className="text-3xl font-bold text-purple-600">{stats.users.clients}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'markets' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Mercados</h2>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Criar Mercado
            </button>
          </div>

          {showCreateModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-6">Criar Novo Mercado</h2>
                <form onSubmit={handleCreateMarketWithManager}>
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3 text-gray-700">Dados do Mercado</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nome do Mercado *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full border rounded px-3 py-2"
                          placeholder="Ex: Supermercado Central"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Endereço *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          className="w-full border rounded px-3 py-2"
                          placeholder="Ex: Rua Principal, 123"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Telefone
                        </label>
                        <input
                          type="text"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full border rounded px-3 py-2"
                          placeholder="Ex: (11) 99999-9999"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Imagem do Mercado
                        </label>
                        <ImageUpload
                          value={formData.imageUrl}
                          onChange={(url) => setFormData({ ...formData, imageUrl: url })}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Descrição
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          className="w-full border rounded px-3 py-2"
                          rows={3}
                          placeholder="Descrição do mercado..."
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3 text-gray-700">Dados do Gestor</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nome Completo *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.managerName}
                          onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                          className="w-full border rounded px-3 py-2"
                          placeholder="Ex: João Silva"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          E-mail *
                        </label>
                        <input
                          type="email"
                          required
                          value={formData.managerEmail}
                          onChange={(e) => setFormData({ ...formData, managerEmail: e.target.value })}
                          className="w-full border rounded px-3 py-2"
                          placeholder="Ex: gestor@mercado.com"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Senha Temporária *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.managerPassword}
                          onChange={(e) => setFormData({ ...formData, managerPassword: e.target.value })}
                          className="w-full border rounded px-3 py-2"
                          placeholder="Senha inicial do gestor"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Criar Mercado e Gestor
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Imagem
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Market ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gestor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {markets.map(market => (
                  <tr key={market.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {market.logoUrl ? (
                        <img
                          src={market.logoUrl}
                          alt={market.name}
                          className="w-12 h-12 object-cover rounded"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                          <Store size={24} className="text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{market.name}</div>
                      <div className="text-sm text-gray-500">{market.address}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600 max-w-[120px] truncate block">
                          {market.id.substring(0, 12)}...
                        </code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(market.id);
                          }}
                          className="text-blue-500 hover:text-blue-700"
                          title="Copiar ID"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-sm ${
                          market.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {market.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {market.managers && market.managers.length > 0 ? (
                        <div className="space-y-1">
                          {market.managers.map((mgr: any) => (
                            <div key={mgr.id} className="flex items-center gap-1">
                              <Users size={12} className="text-gray-400" />
                              <span>{mgr.name}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400">Sem gestor</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {market.isActive ? (
                        <button
                          onClick={() => handleDeactivateMarket(market.id)}
                          className="bg-yellow-500 text-white px-3 py-1 rounded text-xs hover:bg-yellow-600"
                        >
                          Desativar
                        </button>
                      ) : (
                        <button
                          onClick={() => handleActivateMarket(market.id)}
                          className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700"
                        >
                          Ativar
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteMarket(market.id)}
                        className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700"
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

      {activeTab === 'managers' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Gestores de Mercado</h2>
            <button
              onClick={handleCreateManager}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Criar Gestor
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
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mercado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {managers.map(manager => {
                  const market = markets.find(m => m.managerId === manager.id);
                  return (
                    <tr key={manager.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {manager.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {manager.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {manager.marketId ? (
                          <div className="flex items-center gap-1">
                            <Store size={14} className="text-gray-400" />
                            <span>Vinculado</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">Não vinculado</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => navigate('/admin/managers')}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
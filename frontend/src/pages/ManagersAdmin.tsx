import { useState, useEffect } from 'react';
import api from '../services/api';
import { Shield, Plus, Edit2, Trash2, Store } from 'lucide-react';

interface Manager {
  id: string;
  name: string;
  email: string;
  role: string;
  marketId: string | null;
  market?: {
    id: string;
    name: string;
  } | null;
}

interface Market {
  id: string;
  name: string;
}

export default function ManagersAdmin() {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingManager, setEditingManager] = useState<Manager | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    marketId: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [managersRes, marketsRes] = await Promise.all([
        api.get('/managers'),
        api.get('/markets'),
      ]);
      setManagers(managersRes.data);
      setMarkets(marketsRes.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingManager(null);
    setFormData({ name: '', email: '', password: '', marketId: '' });
    setShowModal(true);
  };

  const handleEdit = (manager: Manager) => {
    setEditingManager(manager);
    setFormData({
      name: manager.name,
      email: manager.email,
      password: '',
      marketId: manager.marketId || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (manager: Manager) => {
    if (!confirm(`Tem certeza que deseja remover o gestor "${manager.name}"?`)) {
      return;
    }

    try {
      await api.delete(`/managers/${manager.id}`);
      loadData();
    } catch (error) {
      console.error('Erro ao remover gestor:', error);
      alert('Erro ao remover gestor');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (editingManager) {
        // Atualizar gestor
        const body: any = {
          name: formData.name,
          email: formData.email,
          marketId: formData.marketId || null,
        };
        await api.patch(`/managers/${editingManager.id}`, body);
      } else {
        // Criar gestor
        const body: any = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          marketId: formData.marketId || null,
        };
        await api.post('/managers', body);
      }

      setShowModal(false);
      loadData();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Erro ao salvar gestor');
    }
  };

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
        <h1 className="text-3xl font-bold">Gestores de Mercado</h1>
        <button
          onClick={handleCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={20} />
          Novo Gestor
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
            {managers.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  Nenhum gestor cadastrado
                </td>
              </tr>
            ) : (
              managers.map((manager) => (
                <tr key={manager.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 rounded-full p-2">
                        <Shield size={20} className="text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{manager.name}</div>
                        <div className="text-xs text-gray-500">GESTOR_MERCADO</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {manager.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {manager.market ? (
                      <div className="flex items-center gap-2">
                        <Store size={16} className="text-gray-400" />
                        <span className="text-gray-900">{manager.market.name}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">Sem mercado</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(manager)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(manager)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-6">
              {editingManager ? 'Editar Gestor' : 'Novo Gestor'}
            </h2>
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
                  {error}
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                {!editingManager && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Senha *
                    </label>
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mercado Vinculado
                  </label>
                  <select
                    value={formData.marketId}
                    onChange={(e) => setFormData({ ...formData, marketId: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">Sem mercado</option>
                    {markets.map((market) => (
                      <option key={market.id} value={market.id}>
                        {market.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {editingManager ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
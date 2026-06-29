import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Store, MapPin } from 'lucide-react';

interface Market {
  id: string;
  name: string;
  address: string;
  imageUrl: string | null;
  isActive: boolean;
  description?: string;
  phone?: string;
}

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // Aguardar auth carregar antes de decidir
    if (authLoading) return;

    // Se não está logado, não chama API — mostra mensagem direta
    if (!user) {
      setMarkets([]);
      setLoading(false);
      setErrorMsg(null);
      return;
    }

    api.get('/markets')
      .then(({ data }) => {
        setMarkets(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((error) => {
        const status = error.response?.status;

        console.error('[Home] Erro ao carregar mercados:', {
          status,
          message: error.message,
          data: error.response?.data,
        });

        setMarkets([]);
        setErrorMsg('Não foi possível carregar os mercados. Tente novamente mais tarde.');
        setLoading(false);
      });
  }, [authLoading, user]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Mercados</h1>
        <p className="text-gray-500 mt-1">Escolha um mercado para começar</p>
      </div>
      {errorMsg && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-700 border border-red-200">
          {errorMsg}
        </div>
      )}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[1,2,3].map(i => (
            <div key={`skeleton-${i}`} className="bg-white rounded-xl shadow-sm h-36 sm:h-48 animate-pulse" />
          ))}
        </div>
      ) : markets.length === 0 ? (
        <div className="text-center py-12 sm:py-16">
          <Store size={48} className="mx-auto text-gray-300 mb-4 sm:size-64" />
          <p className="text-gray-500 text-base sm:text-lg">
            {user ? 'Nenhum mercado disponível' : 'Faça login para conseguir verificar os mercados disponíveis'}
          </p>
        </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {markets.map(market => (
              <Link
                key={market.id}
                to={`/markets/${market.id}`}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition overflow-hidden group"
              >
                <div className="h-36 sm:h-48 bg-gray-200 relative overflow-hidden">
                  {market.imageUrl ? (
                    <img
                      src={market.imageUrl}
                      alt={market.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                    />
                  ) : (
                    <div className="h-full bg-emerald-100 flex items-center justify-center">
                      <Store size={64} className="text-emerald-400" />
                    </div>
                  )}
                  {market.isActive !== undefined && (
                    <div className="absolute top-2 right-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          market.isActive
                            ? 'bg-green-500 text-white'
                            : 'bg-red-500 text-white'
                        }`}
                      >
                        {market.isActive ? 'Aberto' : 'Fechado'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-3 sm:p-4">
                  <h3 className="font-semibold text-base sm:text-lg text-gray-900 mb-1 truncate">
                    {market.name || 'Mercado'}
                  </h3>
                  {market.description && (
                    <p className="text-gray-600 text-xs sm:text-sm mb-2 line-clamp-2">
                      {market.description}
                    </p>
                  )}
                  <p className="text-gray-500 text-sm flex items-center gap-1 mt-1">
                    <MapPin size={14} />
                    {market.address || 'Endereço não informado'}
                  </p>
                  {market.phone && (
                    <p className="text-gray-500 text-sm flex items-center gap-1 mt-1">
                      📞 {market.phone}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
    </div>
  );
}

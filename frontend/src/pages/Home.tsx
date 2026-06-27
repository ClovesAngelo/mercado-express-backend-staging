import { useState, useEffect } from 'react';
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
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/markets').then(({ data }) => {
      setMarkets(Array.isArray(data) ? data : []);
      setLoading(false);
    }).catch(() => {
      setMarkets([]);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Mercados</h1>
        <p className="text-gray-500 mt-1">Escolha um mercado para começar</p>
      </div>
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => (
            <div key={`skeleton-${i}`} className="bg-white rounded-xl shadow-sm h-48 animate-pulse" />
          ))}
        </div>
      ) : markets.length === 0 ? (
        <div className="text-center py-16">
          <Store size={64} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">Nenhum mercado disponível</p>
        </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {markets.map(market => (
              <Link
                key={market.id}
                to={`/markets/${market.id}`}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition overflow-hidden group"
              >
                <div className="h-48 bg-gray-200 relative overflow-hidden">
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
                <div className="p-4">
                  <h3 className="font-semibold text-lg text-gray-900 mb-1">
                    {market.name || 'Mercado'}
                  </h3>
                  {market.description && (
                    <p className="text-gray-600 text-sm mb-2 line-clamp-2">
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
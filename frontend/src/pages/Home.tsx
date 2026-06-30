import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Store, MapPin, Phone, ChevronRight } from 'lucide-react';

interface Market {
  id: string;
  name: string;
  address: string;
  imageUrl: string | null;
  isActive: boolean;
  description?: string;
  phone?: string;
  isOpenNow?: boolean;
  deliveryAvailableNow?: boolean;
  pickupAvailableNow?: boolean;
}

function MarketPlaceholder() {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 gap-1">
      <Store size={36} className="text-emerald-300" />
      <span className="text-[10px] font-medium text-emerald-400/60">Sem imagem</span>
    </div>
  );
}

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

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
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Mercados</h1>
        <p className="text-sm text-slate-500 mt-1">Escolha um mercado para começar a comprar</p>
      </div>

      {errorMsg && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div key={`skeleton-${i}`} className="h-[340px] animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
      ) : markets.length === 0 ? (
        <div className="py-16 text-center">
          <Store size={48} className="mx-auto mb-4 text-slate-300" />
          <p className="text-base text-slate-500">
            {user ? 'Nenhum mercado disponível' : 'Faça login para ver os mercados disponíveis'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {markets.map(market => (
            <Link
              key={market.id}
              to={`/markets/${market.id}`}
              className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              {/* Image */}
              <div className="relative h-44 overflow-hidden bg-slate-100 sm:h-48">
                {market.imageUrl ? (
                  <img
                    src={market.imageUrl}
                    alt={market.name}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                ) : (
                  <MarketPlaceholder />
                )}
                {market.isOpenNow !== undefined && (
                  <div className="absolute right-2 top-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm ${
                        market.isOpenNow
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${market.isOpenNow ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      {market.isOpenNow ? 'Aberto' : 'Fechado'}
                    </span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex flex-1 flex-col p-4 sm:p-5">
                <h3 className="text-lg font-semibold text-slate-900 truncate">
                  {market.name || 'Mercado'}
                </h3>
                {market.description && (
                  <p className="mt-1 text-sm text-slate-500 line-clamp-2">
                    {market.description}
                  </p>
                )}
                <div className="mt-3 space-y-1.5">
                  <p className="flex items-center gap-1.5 text-sm text-slate-500">
                    <MapPin size={14} className="shrink-0 text-slate-400" />
                    <span className="truncate">{market.address || 'Endereço não informado'}</span>
                  </p>
                  {market.phone && (
                    <p className="flex items-center gap-1.5 text-sm text-slate-500">
                      <Phone size={14} className="shrink-0 text-slate-400" />
                      {market.phone}
                    </p>
                  )}
                </div>

                {/* Spacer to push CTA to bottom */}
                <div className="flex-1" />

                {/* CTA */}
                <div className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/50 px-4 py-2 text-sm font-medium text-emerald-700 transition group-hover:border-emerald-300 group-hover:bg-emerald-100">
                  Ver produtos
                  <ChevronRight size={14} className="transition group-hover:translate-x-0.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
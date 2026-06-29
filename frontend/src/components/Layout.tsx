import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ShoppingCart, Package, Store, User, LogOut, Shield, ClipboardList } from 'lucide-react';

export default function Layout() {
  const { user, logout, isAdmin, isGestor, isCliente } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadge = () => {
    if (isAdmin) {
      return <span className="bg-yellow-400 text-yellow-900 text-xs px-2 py-0.5 rounded-full font-medium">ADMIN</span>;
    }
    if (isGestor) {
      return <span className="bg-blue-400 text-blue-900 text-xs px-2 py-0.5 rounded-full font-medium">GESTOR</span>;
    }
    if (isCliente) {
      return <span className="bg-green-400 text-green-900 text-xs px-2 py-0.5 rounded-full font-medium">CLIENTE</span>;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-emerald-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 sm:h-16">
            {/* Linha 1: Logo + ícones principais */}
            <div className="flex items-center justify-between sm:justify-start sm:gap-2">
              <Link to="/" className="flex items-center gap-2 font-bold text-lg sm:text-xl truncate">
                <Store size={24} className="shrink-0" />
                <span className="hidden xs:inline sm:inline">Mercado Express</span>
              </Link>
              {user && (
                <div className="flex items-center gap-3 sm:hidden">
                  {(isCliente || isGestor || isAdmin) && (
                    <Link to="/cart" className="hover:text-emerald-200 p-1">
                      <ShoppingCart size={20} />
                    </Link>
                  )}
                  {(isCliente || isGestor || isAdmin) && (
                    <Link to="/orders" className="hover:text-emerald-200 p-1">
                      <Package size={20} />
                    </Link>
                  )}
                  {isGestor && (
                    <Link to="/manager" className="hover:text-emerald-200 p-1">
                      <ClipboardList size={20} />
                    </Link>
                  )}
                  {isAdmin && (
                    <Link to="/admin" className="hover:text-emerald-200 p-1">
                      <Shield size={20} />
                    </Link>
                  )}
                  <button onClick={handleLogout} className="hover:text-emerald-200 p-1" title="Sair">
                    <LogOut size={20} />
                  </button>
                </div>
              )}
              {!user && (
                <Link to="/login" className="hover:text-emerald-200 sm:hidden">Entrar</Link>
              )}
            </div>
            {/* Linha 2 / Desktop right side: links + user + logout */}
            {user && (
              <div className="hidden sm:flex items-center gap-4">
                {(isCliente || isGestor || isAdmin) && (
                  <Link to="/cart" className="flex items-center gap-1 hover:text-emerald-200 text-sm">
                    <ShoppingCart size={18} />
                    <span>Carrinho</span>
                  </Link>
                )}
                {(isCliente || isGestor || isAdmin) && (
                  <Link to="/orders" className="flex items-center gap-1 hover:text-emerald-200 text-sm">
                    <Package size={18} />
                    <span>Pedidos</span>
                  </Link>
                )}
                {isGestor && (
                  <Link to="/manager" className="flex items-center gap-1 hover:text-emerald-200 text-sm">
                    <ClipboardList size={18} />
                    <span>Meu Mercado</span>
                  </Link>
                )}
                {isAdmin && (
                  <Link to="/admin" className="flex items-center gap-1 hover:text-emerald-200 text-sm">
                    <Shield size={18} />
                    <span>Admin</span>
                  </Link>
                )}
                <div className="flex items-center gap-2">
                  <User size={16} className="shrink-0" />
                  <span className="text-sm max-w-[100px] truncate">{user.name}</span>
                  {getRoleBadge()}
                </div>
                <button onClick={handleLogout} className="flex items-center gap-1 hover:text-emerald-200 text-sm" title="Sair">
                  <LogOut size={18} />
                  <span className="hidden lg:inline">Sair</span>
                </button>
              </div>
            )}
            {!user && (
              <div className="hidden sm:flex items-center gap-4">
                <Link to="/login" className="hover:text-emerald-200">Entrar</Link>
              </div>
            )}
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <Outlet />
      </main>
    </div>
  );
}

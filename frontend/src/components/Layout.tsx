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
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 font-bold text-xl">
              <Store size={28} />
              Mercado Express
            </Link>
            <div className="flex items-center gap-6">
              {user ? (
                <>
                  {(isCliente || isGestor || isAdmin) && (
                    <Link to="/cart" className="flex items-center gap-1 hover:text-emerald-200">
                      <ShoppingCart size={20} />
                      <span className="hidden sm:inline">Carrinho</span>
                    </Link>
                  )}
                  {(isCliente || isGestor || isAdmin) && (
                    <Link to="/orders" className="flex items-center gap-1 hover:text-emerald-200">
                      <Package size={20} />
                      <span className="hidden sm:inline">Pedidos</span>
                    </Link>
                  )}
                  {isGestor && (
                    <Link to="/manager" className="flex items-center gap-1 hover:text-emerald-200">
                      <ClipboardList size={20} />
                      <span className="hidden sm:inline">Meu Mercado</span>
                    </Link>
                  )}
                  {isAdmin && (
                    <Link to="/admin" className="flex items-center gap-1 hover:text-emerald-200">
                      <Shield size={20} />
                      <span className="hidden sm:inline">Admin</span>
                    </Link>
                  )}
                  <div className="flex items-center gap-2">
                    <User size={18} />
                    <span className="text-sm">{user.name}</span>
                    {getRoleBadge()}
                  </div>
                  <button onClick={handleLogout} className="flex items-center gap-1 hover:text-emerald-200">
                    <LogOut size={20} />
                  </button>
                </>
              ) : (
                <Link to="/login" className="hover:text-emerald-200">Entrar</Link>
              )}
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}

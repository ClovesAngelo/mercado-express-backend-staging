import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ShoppingCart, Package, Store, User, LogOut, Shield, ClipboardList, Menu, X } from 'lucide-react';
import { useState } from 'react';

function RoleBadge({ role }: { role: 'ADMIN' | 'GESTOR' | 'CLIENTE' }) {
  const styles = {
    ADMIN: 'bg-amber-100 text-amber-700 border border-amber-200',
    GESTOR: 'bg-indigo-100 text-indigo-700 border border-indigo-200',
    CLIENTE: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  };

  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none ${styles[role]}`}>
      {role}
    </span>
  );
}

export default function Layout() {
  const { user, logout, isAdmin, isGestor, isCliente } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userRole: 'ADMIN' | 'GESTOR' | 'CLIENTE' | null = isAdmin ? 'ADMIN' : isGestor ? 'GESTOR' : isCliente ? 'CLIENTE' : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 sm:h-16 items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 font-bold text-lg text-slate-900 shrink-0">
              <Store size={22} className="text-emerald-600" />
              <span className="hidden xs:inline sm:inline">Mercado Express</span>
            </Link>

            {/* Desktop Nav */}
            {user ? (
              <div className="hidden sm:flex items-center gap-1 lg:gap-3">
                {(isCliente || isGestor || isAdmin) && (
                  <NavLink to="/cart" icon={<ShoppingCart size={16} />} label="Carrinho" />
                )}
                {(isCliente || isGestor || isAdmin) && (
                  <NavLink to="/orders" icon={<Package size={16} />} label="Pedidos" />
                )}
                {isGestor && (
                  <NavLink to="/manager" icon={<ClipboardList size={16} />} label="Gestão" />
                )}
                {isAdmin && (
                  <NavLink to="/admin" icon={<Shield size={16} />} label="Admin" />
                )}

                <div className="h-6 w-px bg-slate-200 mx-1 lg:mx-2" />

                <div className="flex items-center gap-2 min-w-0">
                  <User size={15} className="shrink-0 text-slate-400" />
                  <span className="text-sm text-slate-700 max-w-[120px] truncate">{user.name}</span>
                  {userRole && <RoleBadge role={userRole} />}
                </div>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-red-600"
                  title="Sair"
                >
                  <LogOut size={15} />
                  <span className="hidden lg:inline">Sair</span>
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  to="/login"
                  className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-700"
                >
                  Entrar
                </Link>
              </div>
            )}

            {/* Mobile toggle */}
            {user && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="flex sm:hidden items-center justify-center rounded-lg p-2 text-slate-600 hover:bg-slate-100"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            )}
            {!user && (
              <Link
                to="/login"
                className="flex sm:hidden rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white"
              >
                Entrar
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {user && mobileMenuOpen && (
          <div className="border-t border-slate-200 bg-white sm:hidden">
            <div className="mx-auto max-w-7xl px-4 py-3 space-y-1">
              <div className="flex items-center gap-2 px-2 py-2 border-b border-slate-100 mb-1">
                <User size={15} className="shrink-0 text-slate-400" />
                <span className="text-sm text-slate-700 truncate flex-1">{user.name}</span>
                {userRole && <RoleBadge role={userRole} />}
              </div>

              {(isCliente || isGestor || isAdmin) && (
                <MobileNavLink to="/cart" icon={<ShoppingCart size={16} />} label="Carrinho" onClick={() => setMobileMenuOpen(false)} />
              )}
              {(isCliente || isGestor || isAdmin) && (
                <MobileNavLink to="/orders" icon={<Package size={16} />} label="Pedidos" onClick={() => setMobileMenuOpen(false)} />
              )}
              {isGestor && (
                <MobileNavLink to="/manager" icon={<ClipboardList size={16} />} label="Gestão" onClick={() => setMobileMenuOpen(false)} />
              )}
              {isAdmin && (
                <MobileNavLink to="/admin" icon={<Shield size={16} />} label="Admin" onClick={() => setMobileMenuOpen(false)} />
              )}

              <button
                onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-red-600 transition hover:bg-red-50"
              >
                <LogOut size={16} />
                Sair
              </button>
            </div>
          </div>
        )}
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}

function NavLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-emerald-700"
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}

function MobileNavLink({ to, icon, label, onClick }: { to: string; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
    >
      {icon}
      {label}
    </Link>
  );
}
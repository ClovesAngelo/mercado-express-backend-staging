import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/auth.service';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN_GERAL' | 'GESTOR_MERCADO' | 'CLIENTE';
  marketId?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  isGestor: boolean;
  isCliente: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

function clearInvalidAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);

      try {
        const savedToken = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');

        if (!savedToken || !savedUser) {
          clearInvalidAuth();
          setLoading(false);
          return;
        }

        if (savedUser === 'undefined' || savedUser === 'null' || savedUser.trim() === '') {
          console.warn('[AuthContext] Invalid user data in localStorage, clearing...');
          clearInvalidAuth();
          setLoading(false);
          return;
        }

        try {
          const parsedUser = JSON.parse(savedUser);
          if (!parsedUser || typeof parsedUser !== 'object' || !parsedUser.id) {
            console.warn('[AuthContext] Invalid user object in localStorage, clearing...');
            clearInvalidAuth();
            setLoading(false);
            return;
          }

          // Validar token no backend (fonte de verdade)
          try {
            const validatedUser = await authService.validateToken(parsedUser.id);
            setToken(savedToken);
            setUser({
              id: validatedUser.id,
              email: validatedUser.email,
              name: validatedUser.name,
              role: validatedUser.role as User['role'],
              marketId: validatedUser.marketId,
            });
            console.log('[AuthContext] Sessão validada pelo backend:', validatedUser.email);
          } catch (error: any) {
            if (error.response?.status === 401) {
              console.warn('[AuthContext] Token inválido, limpando sessão...');
              clearInvalidAuth();
            } else {
              // Erro de rede, manter sessão do localStorage
              console.warn('[AuthContext] Erro ao validar token, mantendo sessão local:', error.message);
              setToken(savedToken);
              setUser(parsedUser as User);
            }
          }
        } catch (error) {
          console.error('[AuthContext] Failed to parse user from localStorage:', error);
          clearInvalidAuth();
        }
      } catch (error) {
        console.error('[AuthContext] Erro na inicialização:', error);
        clearInvalidAuth();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const data = await authService.login(email, password);

      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.access_token);
      setUser(data.user);

      console.log('[AuthContext] Login realizado com sucesso:', email);
    } catch (error: any) {
      const message = error.response?.data?.message || error.response?.data?.error || 'Erro ao fazer login';
      console.error('[AuthContext] Erro no login:', message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, name: string, password: string) => {
    try {
      setLoading(true);
      const data = await authService.register(email, name, password);

      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.access_token);
      setUser(data.user);

      console.log('[AuthContext] Registro realizado com sucesso:', email);
    } catch (error: any) {
      const message = error.response?.data?.message || error.response?.data?.error || 'Erro ao criar conta';
      console.error('[AuthContext] Erro no registro:', message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearInvalidAuth();
    setToken(null);
    setUser(null);
    console.log('[AuthContext] Logout realizado');
  };

  const isAdmin = user?.role === 'ADMIN_GERAL';
  const isGestor = user?.role === 'GESTOR_MERCADO';
  const isCliente = user?.role === 'CLIENTE';

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      register,
      logout,
      isAdmin,
      isGestor,
      isCliente,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
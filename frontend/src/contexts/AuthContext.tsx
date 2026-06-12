import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import api from '../api/client';

interface User {
  id: number;
  username: string;
  email: string;
  member_id: string | null;
  is_admin: boolean;
  mobile: string | null;
  mobile_public: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, full_name: string, mobile: string, otp_code: string, mobile_public: boolean) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/auth/me')
        .then((r) => setUser(r.data.user))
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (identifier: string, password: string) => {
    const r = await api.post('/auth/login', { email: identifier, password });
    localStorage.setItem('token', r.data.token);
    setUser(r.data.user);
  };

  const register = async (username: string, email: string, password: string, full_name: string, mobile: string, otp_code: string, mobile_public: boolean) => {
    const r = await api.post('/auth/register', { username, email, password, full_name, mobile, otp_code, mobile_public });
    localStorage.setItem('token', r.data.token);
    setUser(r.data.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const refreshUser = async () => {
    const r = await api.get('/auth/me');
    setUser(r.data.user);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};

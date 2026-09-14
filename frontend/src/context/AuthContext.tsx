import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  setMockSession: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('projectflow_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('projectflow_token'));
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const u: User = {
          id: session.user.id,
          fullName: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email || '',
          role: (session.user.user_metadata?.role as any) || 'USER',
          createdAt: session.user.created_at,
        };
        setToken(session.access_token);
        setUser(u);
        localStorage.setItem('projectflow_user', JSON.stringify(u));
        localStorage.setItem('projectflow_token', session.access_token);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const u: User = {
          id: session.user.id,
          fullName: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email || '',
          role: (session.user.user_metadata?.role as any) || 'USER',
          createdAt: session.user.created_at,
        };
        setToken(session.access_token);
        setUser(u);
        localStorage.setItem('projectflow_user', JSON.stringify(u));
        localStorage.setItem('projectflow_token', session.access_token);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('projectflow_user', JSON.stringify(newUser));
    localStorage.setItem('projectflow_token', newToken);
  };

  const setMockSession = (mockUser: User) => {
    setUser(mockUser);
    setToken(`demo-token-${mockUser.role.toLowerCase()}`);
    localStorage.setItem('projectflow_user', JSON.stringify(mockUser));
    localStorage.setItem('projectflow_token', `demo-token-${mockUser.role.toLowerCase()}`);
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem('projectflow_user');
      localStorage.removeItem('projectflow_token');
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('projectflow_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, updateUser, setMockSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

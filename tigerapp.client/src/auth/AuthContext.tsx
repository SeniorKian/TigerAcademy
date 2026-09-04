import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import apiClient from '@/api/apiClient';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (phoneNumber: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUserName: (fullName: string) => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  canAccessAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) return null;
    try { return JSON.parse(savedUser) as User; }
    catch { localStorage.removeItem('user'); return null; }
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const loading = false;

  const login = useCallback(async (phoneNumber: string, password: string): Promise<boolean> => {
    try {
      const response = await apiClient.post('/auth/login', { phoneNumber, password });
      const data = response.data;
      if (data.accessToken) {
        const userData: User = {
          id: data.user?.id ?? data.userId,
          firstName: data.user?.firstName ?? data.firstName,
          lastName: data.user?.lastName ?? data.lastName,
          phoneNumber: data.user?.phoneNumber ?? data.phoneNumber,
          role: data.user?.role ?? data.role,
        };
        setToken(data.accessToken);
        setUser(userData);
        localStorage.setItem('token', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('user', JSON.stringify(userData));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try { await apiClient.post('/auth/logout', { refreshToken }); }
      catch { /* Local sign-out must still succeed if the session already expired. */ }
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }, []);

  const updateUserName = useCallback((fullName: string) => {
    const [firstName, ...lastNameParts] = fullName.trim().split(/\s+/);
    setUser(current => {
      if (!current) return current;
      const updated = {
        ...current,
        firstName: firstName || current.firstName,
        lastName: lastNameParts.join(' '),
      };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        updateUserName,
        isAuthenticated: !!token,
        isAdmin: user?.role === 'Admin',
        canAccessAdmin: ['Admin', 'Consultant', 'ContentManager'].includes(user?.role || ''),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

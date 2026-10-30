import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import type { TokenResponsePayload } from '../api/types';

interface AuthContextType {
  token: string | null;
  email: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<TokenResponsePayload>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('arclite_auth_token'));
  const [email, setEmail] = useState<string | null>(() => localStorage.getItem('arclite_auth_email'));

  useEffect(() => {
    const handleExpired = () => {
      setToken(null);
      setEmail(null);
    };

    window.addEventListener('auth_token_expired', handleExpired);
    return () => window.removeEventListener('auth_token_expired', handleExpired);
  }, []);

  const login = async (userEmail: string, password: string): Promise<TokenResponsePayload> => {
    const response = await apiClient.post<TokenResponsePayload>('/auth/login', {
      email: userEmail,
      password: password,
    });

    const data = response.data;
    localStorage.setItem('arclite_auth_token', data.access_token);
    localStorage.setItem('arclite_auth_email', data.email);
    setToken(data.access_token);
    setEmail(data.email);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('arclite_auth_token');
    localStorage.removeItem('arclite_auth_email');
    setToken(null);
    setEmail(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        email,
        isAuthenticated: !!token,
        login,
        logout,
      }}
    >
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

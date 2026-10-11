import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: User | null;
  login: (email: string, password?: string) => boolean;
  logout: () => void;
  register: (name: string, email: string, phone?: string) => boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('sls_user');
    return saved ? JSON.parse(saved) : null;
  });
  const { showToast } = useToast();

  useEffect(() => {
    if (user) {
      localStorage.setItem('sls_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('sls_user');
    }
  }, [user]);

  const login = (email: string, password?: string): boolean => {
    // Admin Master Account login check
    if (email.toLowerCase() === 'admin@srilakshmisarees.com' && password === 'admin123') {
      const adminUser: User = {
        id: 'user-admin-1',
        name: 'Store Administrator',
        email: 'admin@srilakshmisarees.com',
        role: 'admin'
      };
      setUser(adminUser);
      showToast('Welcome Administrator! Logged into Admin Dashboard.', 'success');
      return true;
    }

    // Default Customer Login
    const customerUser: User = {
      id: `user-${Date.now()}`,
      name: email.split('@')[0],
      email: email,
      role: 'customer'
    };
    setUser(customerUser);
    showToast(`Welcome back, ${customerUser.name}!`, 'success');
    return true;
  };

  const register = (name: string, email: string, phone?: string): boolean => {
    const newUser: User = {
      id: `user-${Date.now()}`,
      name,
      email,
      phone,
      role: 'customer'
    };
    setUser(newUser);
    showToast('Account created successfully!', 'success');
    return true;
  };

  const logout = () => {
    setUser(null);
    showToast('Logged out successfully', 'info');
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, login, logout, register, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

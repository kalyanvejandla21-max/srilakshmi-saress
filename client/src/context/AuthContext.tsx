import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { useToast } from './ToastContext';
import { adminLoginApi, clearAdminToken, getAdminToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  login: (email: string, password?: string) => Promise<boolean>;
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

  // If page is loaded with an admin token and user is marked admin, verify session
  useEffect(() => {
    const token = getAdminToken();
    if (!token && user?.role === 'admin') {
      setUser(null);
    }
  }, [user?.role]);

  const login = async (email: string, password?: string): Promise<boolean> => {
    const cleanEmail = email.toLowerCase().trim();

    // Attempt Admin Authentication via Backend API and JWT if password is provided
    if (password && password.trim()) {
      try {
        const adminRes = await adminLoginApi(cleanEmail, password.trim());
        const adminUser: User = {
          id: 'user-admin-1',
          name: 'Store Administrator',
          email: adminRes.email || cleanEmail,
          role: 'admin'
        };
        setUser(adminUser);
        showToast('Authenticated successfully. Access granted to Admin Dashboard.', 'success');
        return true;
      } catch (adminErr: any) {
        // If email was explicitly marked as admin, don't fall back to customer login
        if (cleanEmail.includes('admin') || cleanEmail.endsWith('@srilakshmisarees.com')) {
          showToast(adminErr.message || 'Administrator authentication failed.', 'error');
          return false;
        }
      }
    }

    // Customer Login
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
    clearAdminToken();
    setUser(null);
    showToast('Logged out successfully', 'info');
  };

  const isAdmin = user?.role === 'admin' && !!getAdminToken();

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

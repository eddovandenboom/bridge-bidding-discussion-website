import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authAPI, getAuthToken } from '../utils/api';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'ADMIN' | 'USER' | 'GUEST' | 'PENDING_APPROVAL';
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUserRole: (userId: string, newRole: 'ADMIN' | 'USER' | 'GUEST') => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // isAuthenticated is true if user exists and has an 'ADMIN' or 'USER' role
  const isAuthenticated = !!user && (user.role === 'ADMIN' || user.role === 'USER');

  // Check for existing token on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = getAuthToken();
      
      if (token) {
        try {
          const response = await authAPI.getCurrentUser();
          // Only set user if they are not pending approval or if they are, then they are at least a guest
          if (response.user.role !== 'PENDING_APPROVAL') {
            setUser(response.user);
          } else {
            // If user is pending approval, treat them as a guest for now
            setUser({ ...response.user, role: 'GUEST' }); 
            setError('Your account is pending admin approval. Please wait for an administrator to activate your account.');
          }
        } catch (error) {
          console.error('Failed to verify token:', error);
          authAPI.logout(); // Remove invalid token
        }
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setError(null);
      setIsLoading(true);
      
      const response = await authAPI.login(email, password);
      setUser(response.user);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string): Promise<void> => {
    try {
      setError(null);
      setIsLoading(true);
      
      const response = await authAPI.register(username, email, password);
      // For new registrations, set the user role to PENDING_APPROVAL
      setUser({ ...response.user, role: 'PENDING_APPROVAL' });
      setError('Registration successful! Your account is pending admin approval. You will be notified once it\'s activated.');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'ADMIN' | 'USER' | 'GUEST'): Promise<void> => {
    try {
      setError(null);
      setIsLoading(true);
      
      await authAPI.updateUserRole(userId, newRole);
      // If the updated user is the current user, update their role in the state
      if (user && user.id === userId) {
        setUser(prevUser => prevUser ? { ...prevUser, role: newRole } : null);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update user role';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    authAPI.logout();
    setUser(null);
    setError(null);
  };

  const clearError = (): void => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUserRole,
    error,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

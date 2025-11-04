import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authAPI, User } from '../lib/api';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const user = await authAPI.getProfile();
          setUser(user);
        } catch (error) {
          // Try to refresh token if profile fetch fails
          try {
            const refreshResponse = await authAPI.refreshToken();
            localStorage.setItem('authToken', refreshResponse.accessToken);
            setUser(refreshResponse.user);
          } catch (refreshError) {
            // If refresh also fails, clear token and sign out
            localStorage.removeItem('authToken');
            setUser(null);
          }
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { user, token } = await authAPI.signIn(email, password);
    localStorage.setItem('authToken', token);
    setUser(user);
  };

  const signUp = async (name: string, email: string, password: string) => {
    const { user, token } = await authAPI.signUp(name, email, password);
    localStorage.setItem('authToken', token);
    setUser(user);
  };

  const signOut = async () => {
    await authAPI.signOut();
    localStorage.removeItem('authToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

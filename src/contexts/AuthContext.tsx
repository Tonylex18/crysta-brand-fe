import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authAPI, User } from '../pages/lib/api';

type AuthContextType = {
  user: (User & { _id?: string }) | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (name: string, email: string, password: string) => Promise<User>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<(User & { _id?: string }) | null>(null);
  const [loading, setLoading] = useState(true);

  const normalizeUser = (rawUser: unknown): User & { _id?: string } => {
    const record = (rawUser && typeof rawUser === 'object') ? (rawUser as Record<string, unknown>) : {};
    const id =
      typeof record.id === 'string'
        ? record.id
        : typeof record._id === 'string'
          ? record._id
          : typeof record.userId === 'string'
            ? record.userId
            : typeof record.user_id === 'string'
              ? record.user_id
              : '';
    return { ...(record as User), id } as User & { _id?: string };
  };

  useEffect(() => {
    const cachedUser = localStorage.getItem('authUser');
    if (cachedUser) {
      try {
        setUser(normalizeUser(JSON.parse(cachedUser)));
      } catch {
        localStorage.removeItem('authUser');
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    const response = await authAPI.signIn(email, password);
    const token = response.accessToken || response.access_token || response.token;
    if (token) {
      localStorage.setItem('authToken', token);
    }
    const normalized = normalizeUser(response.user || response);
    setUser(normalized);
    localStorage.setItem('authUser', JSON.stringify(normalized));
    return normalized;
  };

  const signUp = async (name: string, email: string, password: string) => {
    const response = await authAPI.signUp(email, password, name);
    const token = response.accessToken || response.access_token || response.token;
    if (token) {
      localStorage.setItem('authToken', token);
    }
    const normalized = normalizeUser(response.user || response);
    setUser(normalized);
    localStorage.setItem('authUser', JSON.stringify(normalized));
    return normalized;
  };

  const signOut = async () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
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

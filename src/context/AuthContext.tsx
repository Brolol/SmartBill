import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export type Role = 'admin' | 'user';

interface AuthUser {
  username: string;
  role: Role;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  isLoading: boolean; // Useful for preventing flash of login page
}

const AuthContext = createContext<AuthContextType | null>(null);

const MOCK_USERS: { username: string; password: string; role: Role }[] = [
  { username: 'admin', password: 'admin123', role: 'admin' },
  { username: 'user', password: 'user123', role: 'user' },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Persistence: Check for saved user on load
  useEffect(() => {
    const savedUser = localStorage.getItem('smartbill_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = (username: string, password: string): boolean => {
    const found = MOCK_USERS.find(
      (u) => u.username.toLowerCase() === username.toLowerCase() && u.password === password
    );
    if (found) {
      const userData = { username: found.username, role: found.role };
      setUser(userData);
      localStorage.setItem('smartbill_user', JSON.stringify(userData));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('smartbill_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
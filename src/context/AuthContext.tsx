import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type Role = 'admin' | 'user';

interface AuthUser {
  id: string;
  email: string;
  username: string;
  role: Role;
}

interface AuthResultError {
  message: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<boolean>;
  signup: (username: string, password: string) => Promise<{ error: AuthResultError | null }>;
  logout: () => Promise<void>;
  loading: boolean;
}

interface ProfileRecord {
  username?: string | null;
  role?: Role | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function toEmail(username: string) {
  const trimmedUsername = username.trim();
  return trimmedUsername.includes('@') ? trimmedUsername : `${trimmedUsername}@smartbill.ai`;
}

function getUsername(email: string, profileUsername?: string | null) {
  if (profileUsername?.trim()) return profileUsername.trim();
  return email.split('@')[0] || 'user';
}

async function fetchProfile(userId: string): Promise<ProfileRecord | null> {
  const client = supabase as any;
  const { data, error } = await client
    .from('profiles')
    .select('username, role')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch profile:', error.message);
    return null;
  }

  return (data as ProfileRecord | null) ?? null;
}

async function buildAuthUser(authUser: SupabaseUser): Promise<AuthUser> {
  const profile = await fetchProfile(authUser.id);
  const email = authUser.email ?? '';

  return {
    id: authUser.id,
    email,
    username: getUsername(email, profile?.username),
    role: profile?.role ?? 'user',
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const syncUser = async (sessionUser: SupabaseUser | null) => {
      if (!isMounted) return;

      if (!sessionUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      const nextUser = await buildAuthUser(sessionUser);
      if (!isMounted) return;

      setUser(nextUser);
      setLoading(false);
    };

    const initializeAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      await syncUser(session?.user ?? null);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void syncUser(session?.user ?? null);
    });

    void initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (username: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: toEmail(username),
      password,
    });

    if (error) {
      console.error('Login failed:', error.message);
      return false;
    }

    return Boolean(data.user);
  };

  const signup = async (username: string, password: string) => {
    const trimmedUsername = username.trim();
    const email = toEmail(trimmedUsername);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error || !data.user) {
      return { error: error ? { message: error.message } : { message: 'Unable to create account.' } };
    }

    const client = supabase as any;
    const { error: profileError } = await client.from('profiles').insert([
      {
        id: data.user.id,
        username: trimmedUsername || getUsername(email),
        role: 'user',
      },
    ]);

    if (profileError) {
      console.error('Profile creation failed:', profileError.message);
      return { error: { message: profileError.message } };
    }

    return { error: null };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
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

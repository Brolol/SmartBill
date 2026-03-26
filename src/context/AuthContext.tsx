import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// 1. Updated Interface with signup and userRole
interface AuthContextType {
  user: any;
  userRole: 'admin' | 'user' | null;
  login: (username: string, pass: string) => Promise<boolean>;
  signup: (username: string, pass: string) => Promise<{ error: any }>; 
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<'admin' | 'user' | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      // Cast to 'any' to fix "Property 'role' does not exist on type 'never'"
      const { data: profile, error } = await (supabase as any)
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      setUserRole(profile?.role || 'user');
    } catch (err) {
      console.error("Error fetching role:", err);
      setUserRole('user'); // Fallback to safe role
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        await fetchProfile(session.user.id);
      }
      setLoading(false);
    };

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        setUser(session.user);
        await fetchProfile(session.user.id);
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    initializeAuth();

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const login = async (username: string, pass: string) => {
    // Converts simple username to email format for Supabase
    const email = username.includes('@') ? username : `${username}@smartbill.ai`;
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });

    if (error) return false;
    return !!data.user;
  };

  const signup = async (username: string, pass: string) => {
    const email = username.includes('@') ? username : `${username}@smartbill.ai`;
    
    // 1. Create User in Auth
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password: pass,
    });

    if (authError) return { error: authError };

    if (data.user) {
      // 2. Create Profile row (Cast to 'any' to fix Overload/never errors)
      const { error: profileError } = await (supabase as any)
        .from('profiles')
        .insert([
          { 
            id: data.user.id, 
            username: username, 
            role: 'user' 
          }
        ]);
        
      if (profileError) return { error: profileError };
    }

    return { error: null };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, userRole, login, signup, logout, loading }}>
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
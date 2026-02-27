import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Lock, User, ShieldCheck } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    await new Promise((r) => setTimeout(r, 800)); // Smooth UX delay

    const success = login(username, password);
    if (!success) {
      setError('Invalid credentials. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex items-center justify-center bg-background text-white p-4 relative overflow-hidden">
      
      {/* Background Accents */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent-neon/10 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass w-full max-w-[400px] p-8 relative z-10"
      >
        <div className="text-center mb-8">
          <motion.div 
            initial={{ y: -10 }}
            animate={{ y: 0 }}
            className="inline-block p-3 rounded-2xl bg-white/5 border border-white/10 mb-4"
          >
            <ShieldCheck className="w-8 h-8 text-primary-glow" />
          </motion.div>
          <h1 className="text-3xl font-bold tracking-tighter text-gradient">SmartBill AI</h1>
          <p className="text-gray-400 text-sm mt-2">Enter your credentials to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest ml-1">Username</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-primary-glow/50 focus:bg-white/10 transition-all"
                placeholder="admin or user"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="password"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-primary-glow/50 focus:bg-white/10 transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center"
            >
              {error}
            </motion.div>
          )}

          <button
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary to-accent-neon py-3 rounded-xl font-bold shadow-neon-primary hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? "Authenticating..." : "Sign In"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/5 flex justify-center gap-4 text-[10px] text-gray-500 uppercase tracking-widest">
          <span className="hover:text-gray-300 cursor-help">Secure Session</span>
          <span>•</span>
          <span className="hover:text-gray-300 cursor-help">v1.0.0</span>
        </div>
      </motion.div>
    </div>
  );
}
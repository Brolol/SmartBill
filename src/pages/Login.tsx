import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Lock, User, ShieldCheck, UserPlus, ArrowRight } from 'lucide-react';

export default function Login() {
  const { login, signup } = useAuth(); // Assume signup is added to context
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const success = await login(username, password);
        if (!success) setError('Invalid credentials.');
      } else {
        // Sign up logic - defaults to 'user' role in DB
        const { error: signUpError } = await signup(username, password);
        if (signUpError) setError(signUpError.message);
        else setIsLogin(true); // Switch to login after success
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
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

      <motion.div layout className="glass w-full max-w-[400px] p-8 relative z-10 border-white/10 shadow-2xl">
        <div className="text-center mb-8">
          <motion.div layout className="inline-block p-3 rounded-2xl bg-white/5 border border-white/10 mb-4">
            {isLogin ? <ShieldCheck className="w-8 h-8 text-primary-glow" /> : <UserPlus className="w-8 h-8 text-accent-neon" />}
          </motion.div>
          <h1 className="text-3xl font-bold tracking-tighter text-gradient">
            {isLogin ? 'SmartBill AI' : 'Join SmartBill'}
          </h1>
          <p className="text-gray-400 text-sm mt-2">
            {isLogin ? 'Enter credentials to continue' : 'Create an account to start billing'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Username / Email</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-primary-glow/50 focus:bg-white/10 transition-all"
                placeholder="admin@smartbill.ai"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Password</label>
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

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] text-center">
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary to-accent-neon py-3 rounded-xl font-bold shadow-neon-primary hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin w-4 h-4" /> : (isLogin ? 'Sign In' : 'Create Account')}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function Loader2({ className }: { className?: string }) {
  return <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className={className}>◌</motion.div>;
}
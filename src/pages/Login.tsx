import { useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Lock, User, ShieldCheck, UserPlus, ArrowRight } from 'lucide-react';

export default function Login() {
  const { login, signup } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const success = await login(username, password);
        if (!success) setError('Invalid credentials.');
      } else {
        const { error: signUpError } = await signup(username, password);
        if (signUpError) {
          setError(signUpError.message);
        } else {
          setIsLogin(true);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-background p-4 text-white">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-[-10%] top-[-10%] h-[50%] w-[50%] animate-pulse rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[50%] w-[50%] rounded-full bg-accent-neon/10 blur-[120px]" />
      </div>

      <motion.div layout className="glass relative z-10 w-full max-w-[400px] border-white/10 p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <motion.div layout className="mb-4 inline-block rounded-2xl border border-white/10 bg-white/5 p-3">
            {isLogin ? (
              <ShieldCheck className="h-8 w-8 text-primary-glow" />
            ) : (
              <UserPlus className="h-8 w-8 text-accent-neon" />
            )}
          </motion.div>
          <h1 className="text-gradient text-3xl font-bold tracking-tighter">
            {isLogin ? 'SmartBill AI' : 'Join SmartBill'}
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            {isLogin ? 'Enter credentials to continue' : 'Create an account to start billing'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-gray-500">
              Username / Email
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm transition-all focus:bg-white/10 focus:outline-none focus:border-primary-glow/50"
                placeholder="admin@smartbill.ai"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-gray-500">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                type="password"
                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm transition-all focus:bg-white/10 focus:outline-none focus:border-primary-glow/50"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-center text-[10px] text-red-400"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent-neon py-3 font-bold shadow-neon-primary transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : isLogin ? 'Sign In' : 'Create Account'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-xs text-gray-400 transition-colors hover:text-white"
          >
            {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function Loader2({ className }: { className?: string }) {
  return (
    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className={className}>
      o
    </motion.div>
  );
}

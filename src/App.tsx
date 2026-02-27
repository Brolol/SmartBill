import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Receipt, BarChart3, Package, LogOut, ChevronRight } from 'lucide-react';

import Dashboard from './pages/Dashboard';
import CreateBill from './pages/CreateBill';
import Inventory from './pages/Inventory';
import Analytics from './pages/Analytics';
import BottomNav from './components/BottomNav';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './context/AuthContext';

// ─── Role-based nav config ───────────────────────────────────────────────────
const ALL_NAV_ITEMS = [
  { path: '/',           label: 'Dashboard',   icon: <LayoutDashboard className="w-5 h-5" />, roles: ['admin'] },
  { path: '/create-bill', label: 'Create Bill',  icon: <Receipt         className="w-5 h-5" />, roles: ['admin', 'user'] },
  { path: '/analytics',   label: 'Analytics',   icon: <BarChart3       className="w-5 h-5" />, roles: ['admin'] },
  { path: '/inventory',   label: 'Inventory',   icon: <Package         className="w-5 h-5" />, roles: ['admin'] },
];

// ─── Protected Route wrapper ─────────────────────────────────────────────────
function ProtectedRoute({ children, allowedRoles }: { children: JSX.Element; allowedRoles: string[] }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/create-bill" replace />;
  return children;
}

// ─── Main Layout ─────────────────────────────────────────────────────────────
function MainLayout() {
  const location = useLocation();
  const { user, logout } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  const navItems = ALL_NAV_ITEMS.filter((item) => item.roles.includes(user.role));
  const defaultPath = user.role === 'user' ? '/create-bill' : '/';
  const currentItem = ALL_NAV_ITEMS.find((item) => item.path === location.pathname);
  const currentTitle = currentItem?.label || 'Overview';

  return (
    <div className="h-screen flex bg-background text-white selection:bg-primary/30 overflow-hidden relative">
      
      {/* Sidebar - Integrated with .glass and .text-gradient */}
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-72 glass m-4 hidden lg:flex flex-col border-white/5 z-20 shrink-0 shadow-2xl shadow-black/50"
      >
        <div className="p-8">
          <h1 className="text-2xl font-bold tracking-tighter text-gradient italic">
            SmartBill AI
          </h1>
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mt-1 font-semibold">
            Enterprise Suite
          </p>
        </div>

        <nav className="flex-1 px-4 space-y-2 font-medium">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} className="block group">
                <motion.div 
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={`p-3.5 rounded-xl flex items-center justify-between transition-all ${
                    isActive
                      ? 'bg-white/10 text-white shadow-neon-primary border border-white/10'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={isActive ? 'text-primary-glow' : 'text-inherit opacity-70 group-hover:opacity-100'}>
                      {item.icon}
                    </span>
                    <span className="text-sm tracking-wide">{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-4 h-4 text-primary-glow/50" />}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* User Profile - Enhanced Glass Sm effect */}
        <div className="p-4 m-4 glass-sm bg-white/[0.03] border-white/5 mt-auto">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-accent-neon flex items-center justify-center text-sm font-bold shadow-neon-primary border border-white/20">
                {user.username.slice(0, 2).toUpperCase()}
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-900 rounded-full"></div>
            </div>
            <div className="text-sm flex-1 min-w-0">
              <p className="font-bold text-white capitalize truncate">{user.username}</p>
              <p className="text-[10px] text-primary-glow uppercase tracking-wider font-semibold opacity-80">
                {user.role}
              </p>
            </div>
            <button
              onClick={logout}
              title="Sign out"
              className="p-2 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-all"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col p-4 overflow-hidden relative">
        <header className="glass-sm h-16 mb-4 md:mb-6 flex items-center justify-between px-6 z-10 shrink-0 border-white/5 shadow-lg">
          <div className="flex items-center gap-2 text-xs md:text-sm text-gray-400">
            <span className="opacity-50">Pages</span> 
            <ChevronRight className="w-3 h-3 opacity-30" />
            <span className="text-white font-medium tracking-wide">{currentTitle}</span>
          </div>
          
          <button
            onClick={logout}
            className="lg:hidden glass-sm px-3 py-1.5 flex items-center gap-2 text-xs text-gray-400 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out</span>
          </button>
        </header>

        {/* Dynamic Route Container */}
        <div className="flex-1 overflow-y-auto lg:overflow-hidden relative z-0 pb-20 lg:pb-0 scrollbar-hide">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <Routes location={location}>
                <Route
                  path="/"
                  element={
                    user.role === 'user'
                      ? <Navigate to="/create-bill" replace />
                      : <ProtectedRoute allowedRoles={['admin']}><Dashboard /></ProtectedRoute>
                  }
                />
                <Route
                  path="/create-bill"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'user']}>
                      <CreateBill />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/analytics"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <Analytics />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/inventory"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <Inventory />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<Navigate to={defaultPath} replace />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </div>

        <BottomNav />
      </main>

      {/* Decorative Background Accents */}
      <div className="fixed inset-0 overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-accent-cyan/10 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] right-[10%] w-[20%] h-[20%] bg-accent-neon/5 rounded-full blur-[80px]" />
      </div>
    </div>
  );
}

// ─── Root Application Logic ──────────────────────────────────────────────────
function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <Login />}
      />
      <Route path="/*" element={<MainLayout />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Receipt, BarChart3, Package } from 'lucide-react';

// Import our newly created pages
import Dashboard from './pages/Dashboard';
import CreateBill from './pages/CreateBill';

// We extract the inner layout into its own component so we can use the `useLocation` hook
// which requires being wrapped inside the <BrowserRouter>
function MainLayout() {
  const location = useLocation();
  
  // Define our navigation structure
  const navItems = [
    { path: '/', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { path: '/bill', label: 'Create Bill', icon: <Receipt className="w-5 h-5" /> },
    { path: '/analytics', label: 'Analytics', icon: <BarChart3 className="w-5 h-5" /> },
    { path: '/inventory', label: 'Inventory', icon: <Package className="w-5 h-5" /> },
  ];
  
  // Dynamically update the header title based on current route
  const currentTitle = navItems.find(item => item.path === location.pathname)?.label || 'Overview';

  return (
    <div className="h-screen flex bg-background text-white selection:bg-primary/30 overflow-hidden">
      
      {/* Animated Sidebar */}
      <motion.aside 
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-64 glass m-4 hidden md:flex flex-col border-r border-white/5 z-20"
      >
        <div className="p-6">
          <h1 className="text-2xl font-bold tracking-tighter text-gradient">
            SmartBill AI
          </h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 font-medium">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}>
                <div className={`p-3 rounded-xl flex items-center gap-3 transition-all mb-2 ${
                  isActive 
                    ? 'bg-white/10 text-white shadow-neon-primary border border-white/10' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-white cursor-pointer'
                }`}>
                  {item.icon}
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User Profile Snippet */}
        <div className="p-4 border-t border-white/5 bg-white/5 rounded-b-2xl mt-auto">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-accent-neon flex items-center justify-center text-sm font-bold shadow-neon-primary">
              AD
            </div>
            <div className="text-sm">
              <p className="font-bold text-white">Admin User</p>
              <p className="text-xs text-success flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
                Online
              </p>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col p-4 overflow-hidden relative">
        
        {/* Top Header */}
        <header className="glass-sm h-16 mb-6 flex items-center justify-between px-6 z-10 shrink-0">
          <div className="text-sm text-gray-400">
            Pages / <span className="text-white font-medium">{currentTitle}</span>
          </div>
        </header>

        {/* Page Content Container */}
        <div className="flex-1 overflow-hidden relative z-0">
          {/* AnimatePresence handles smooth fading between pages if we add exit animations later */}
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/bill" element={<CreateBill />} />
              
              {/* Placeholders for future pages to prevent 404s */}
              <Route path="/analytics" element={
                <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="glass p-8 h-full flex items-center justify-center text-gray-500 flex-col gap-4">
                  <BarChart3 className="w-12 h-12 text-primary/50" />
                  <h2>Advanced Analytics Engine Coming Soon...</h2>
                </motion.div>
              } />
              <Route path="/inventory" element={
                <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="glass p-8 h-full flex items-center justify-center text-gray-500 flex-col gap-4">
                  <Package className="w-12 h-12 text-accent-cyan/50" />
                  <h2>Smart Stock Optimization Coming Soon...</h2>
                </motion.div>
              } />
            </Routes>
          </AnimatePresence>
        </div>

      </main>
    </div>
  );
}

// Wrap the app in the React Router provider
export default function App() {
  return (
    <BrowserRouter>
      <MainLayout />
    </BrowserRouter>
  );
}
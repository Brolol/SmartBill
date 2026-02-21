import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Receipt, Package} from 'lucide-react';

export default function BottomNav() {
  const navItems = [
    { to: '/', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Stats' },
    { to: '/create-bill', icon: <Receipt className="w-5 h-5" />, label: 'Bill' },
    { to: '/inventory', icon: <Package className="w-5 h-5" />, label: 'Stock' },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 glass-sm border-t border-white/10 bg-background/80 backdrop-blur-xl z-50 px-4 pb-safe">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `
              flex flex-col items-center gap-1 transition-colors
              ${isActive ? 'text-primary-glow' : 'text-gray-500'}
            `}
          >
            {item.icon}
            <span className="text-[10px] font-medium uppercase tracking-wider">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
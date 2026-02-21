import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { TrendingUp, Package, DollarSign, Target, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

const COLORS = ['#6366F1', '#22D3EE', '#818CF8', '#06B6D4', '#4F46E5'];

// Define the interface for your stats data
interface ProductStatResult {
  date: string;
  revenue: number;
  quantity_sold: number;
  products: {
    name: string;
    category: string;
  } | null;
}

export default function Analytics() {
  const [data, setData] = useState<{ date: string; revenue: number }[]>([]);
  const [categoryData, setCategoryData] = useState<{ name: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  async function fetchAnalytics() {
    setLoading(true);
    try {
      // Fetch stats with join on products
      const { data: statsData, error } = await supabase
        .from('product_daily_stats')
        .select('date, revenue, quantity_sold, products(name, category)')
        .order('date', { ascending: true });

      if (error) throw error;

      // Type cast the response to bypass the 'never' error
      const stats = (statsData as unknown as ProductStatResult[]) || [];

      if (stats.length > 0) {
        // Process for Bar Chart (Daily Revenue for the last 7 entries)
        const formattedChartData = stats.slice(-7).map(s => ({
          date: new Date(s.date).toLocaleDateString('en-US', { weekday: 'short' }),
          revenue: s.revenue
        }));
        setData(formattedChartData);

        // Process for Pie Chart (Category Breakdown)
        const categories: Record<string, number> = {};
        stats.forEach((s) => {
          const cat = s.products?.category || 'General';
          categories[cat] = (categories[cat] || 0) + s.revenue;
        });

        const formattedCategoryData = Object.keys(categories).map(key => ({
          name: key,
          value: categories[key]
        }));
        setCategoryData(formattedCategoryData);
      }
    } catch (err) {
      console.error('Analytics Fetch Error:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="animate-spin text-primary w-10 h-10" />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="h-full flex flex-col gap-6 p-2 pb-24 lg:pb-0 overflow-y-auto"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Revenue" value="$12,450" icon={<DollarSign />} color="text-primary-glow" />
        <StatCard title="Avg. Order Value" value="$42.50" icon={<TrendingUp />} color="text-accent-neon" />
        <StatCard title="Items Sold" value="842" icon={<Package />} color="text-success" />
        <StatCard title="Sales Target" value="82%" icon={<Target />} color="text-warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Revenue Trend */}
        <div className="glass p-6 min-h-[300px]">
          <h3 className="text-lg font-bold mb-6 text-white">Revenue Trend (7 Days)</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111827', border: 'none', borderRadius: '8px', color: '#fff' }} 
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="revenue" fill="#6366F1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Share */}
        <div className="glass p-6 min-h-[300px]">
          <h3 className="text-lg font-bold mb-6 text-white">Revenue by Category</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({ title, value, icon, color }: any) {
  return (
    <div className="glass-sm p-6 flex items-center gap-4">
      <div className={`p-3 rounded-xl bg-white/5 ${color}`}>{icon}</div>
      <div>
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
    </div>
  );
}
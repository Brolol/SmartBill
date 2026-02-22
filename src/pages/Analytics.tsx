import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { TrendingUp, Package, IndianRupee, Target, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

const COLORS = ['#6366F1', '#22D3EE', '#818CF8', '#06B6D4', '#4F46E5'];

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
  const [totals, setTotals] = useState({ revenue: 0, items: 0 });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  async function fetchAnalytics() {
    setLoading(true);
    try {
      const { data: statsData, error } = await supabase
        .from('product_daily_stats')
        .select('date, revenue, quantity_sold, products(name, category)')
        .order('date', { ascending: true });

      if (error) throw error;
      const stats = (statsData as unknown as ProductStatResult[]) || [];

      if (stats.length > 0) {
        // Calculate Global Totals
        const totalRev = stats.reduce((acc, s) => acc + s.revenue, 0);
        const totalItems = stats.reduce((acc, s) => acc + s.quantity_sold, 0);
        setTotals({ revenue: totalRev, items: totalItems });

        // Process for Bar Chart (Weekly Trend)
        setData(stats.slice(-7).map(s => ({
          date: new Date(s.date).toLocaleDateString('en-US', { weekday: 'short' }),
          revenue: s.revenue
        })));

        // Process for Pie Chart (Category Breakdown)
        const categories: Record<string, number> = {};
        stats.forEach((s) => {
          const cat = s.products?.category || 'General';
          categories[cat] = (categories[cat] || 0) + s.revenue;
        });

        setCategoryData(Object.keys(categories).map(key => ({
          name: key,
          value: categories[key]
        })));
      }
    } catch (err) {
      console.error('Analytics Fetch Error:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>;

  return (
    <div className="h-full flex flex-col gap-6 p-2 pb-24 lg:pb-0 overflow-y-auto">
      {/* KPI Section with Rupee Support */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Revenue" 
          value={`₹${totals.revenue.toLocaleString()}`} 
          icon={<IndianRupee />} 
          color="text-primary-glow" 
        />
        <StatCard 
          title="Avg. Order Value" 
          value={`₹${(totals.revenue / (totals.items || 1)).toFixed(2)}`} 
          icon={<TrendingUp />} 
          color="text-accent-neon" 
        />
        <StatCard 
          title="Items Sold" 
          value={totals.items.toString()} 
          icon={<Package />} 
          color="text-success" 
        />
        <StatCard 
          title="Sales Target" 
          value="82%" 
          icon={<Target />} 
          color="text-warning" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Bar Chart */}
        <div className="glass p-6 min-h-[350px]">
          <h3 className="text-lg font-bold mb-6 text-white">Weekly Revenue (₹)</h3>
          {data.length > 0 ? (
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111827', border: 'none', borderRadius: '8px', color: '#fff' }} 
                    formatter={(value) => [`₹${value}`, 'Revenue']}
                  />
                  <Bar dataKey="revenue" fill="#6366F1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-500 italic">No sales data found</div>
          )}
        </div>

        {/* Category Pie Chart */}
        <div className="glass p-6 min-h-[350px]">
          <h3 className="text-lg font-bold mb-6 text-white">Revenue by Category</h3>
          {categoryData.length > 0 ? (
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} innerRadius={60} outerRadius={80} dataKey="value">
                    {categoryData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value) => `₹${value}`} />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-500 italic">No categories found</div>
          )}
        </div>
      </div>
    </div>
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
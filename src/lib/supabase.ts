import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types.ts';

// 1. Initialize environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// 2. Export the single client instance
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// ==========================================
// INTERFACES
// ==========================================

export interface DailyStat {
  date: string;
  quantity_sold: number;
  revenue: number;
}

interface ProductStock {
  current_stock: number;
}

// ==========================================
// CORE DATA FETCHING QUERIES
// ==========================================

/**
 * Fetches historical daily statistics for a specific product for the AI Prediction Engine.
 */
export async function fetchProductStatsForPrediction(
  productId: string, 
  days: number = 30
): Promise<DailyStat[]> {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() - days);
  const formattedDate = targetDate.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('product_daily_stats')
    .select('date, quantity_sold, revenue')
    .eq('product_id', productId)
    .gte('date', formattedDate)
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching stats for prediction:', error.message);
    throw new Error(`Failed to fetch product stats: ${error.message}`);
  }

  return (data as unknown as DailyStat[]) || [];
}

/**
 * Fetches unread AI insights for the dashboard alert panel.
 */
export async function fetchUnreadInsights() {
  const { data, error } = await supabase
    .from('ai_insights')
    .select('*')
    .eq('is_read', false)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error fetching AI insights:', error.message);
    throw new Error(`Failed to fetch insights: ${error.message}`);
  }

  return data || [];
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Deducts stock from a product after a successful sale.
 * THE FIX: We cast the client to 'any' to remove the 'never' constraint 
 * inherited from the generated types.
 */
export async function decrementStock(productId: string, quantity: number) {
  // Use 'as any' on the supabase client to bypass strict type locks
  const client = supabase as any;

  // 1. Fetch current stock
  const { data, error: fetchError } = await client
    .from('products')
    .select('current_stock')
    .eq('id', productId)
    .single();

  const productData = data as unknown as ProductStock;

  if (fetchError || !productData) {
    console.error('Stock Fetch Error:', fetchError?.message);
    return;
  }

  // 2. Calculate new stock level
  const newStock = Math.max(0, productData.current_stock - quantity);

  // 3. Update the database
  const { error: updateError } = await client
    .from('products')
    .update({ current_stock: newStock })
    .eq('id', productId);

  if (updateError) {
    console.error('Stock Update Error:', updateError.message);
  }
}
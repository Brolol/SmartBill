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
// HELPER FUNCTIONS (INVENTORY & SALES)
// ==========================================

/**
 * Deducts stock from a product after a successful sale.
 */
export async function decrementStock(productId: string, quantity: number) {
  const client = supabase as any;

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

  const newStock = Math.max(0, productData.current_stock - quantity);

  const { error: updateError } = await client
    .from('products')
    .update({ current_stock: newStock })
    .eq('id', productId);

  if (updateError) {
    console.error('Stock Update Error:', updateError.message);
  }
}

// ==========================================
// NEW: LOYALTY & CONTACTLESS EXIT SYSTEM
// ==========================================

/**
 * Calculates and adds loyalty points. 
 * Ratio 1:30 ($1 spent = 30 points).
 */
export async function addLoyaltyPoints(userId: string, totalAmount: number) {
  const client = supabase as any;
  const pointsToEarn = Math.floor(totalAmount * 30);

  // 1. Fetch existing points
  const { data, error: fetchError } = await client
    .from('profiles')
    .select('loyalty_points')
    .eq('id', userId)
    .single();

  if (fetchError) {
    console.error('Error fetching loyalty points:', fetchError.message);
    return 0;
  }

  const currentPoints = data?.loyalty_points || 0;
  const newPointsTotal = currentPoints + pointsToEarn;

  // 2. Update new total
  const { error: updateError } = await client
    .from('profiles')
    .update({ loyalty_points: newPointsTotal })
    .eq('id', userId);

  if (updateError) {
    console.error('Error updating loyalty points:', updateError.message);
    return 0;
  }

  return pointsToEarn;
}

/**
 * Creates a unique Exit Pass in Supabase for the security gate.
 * @returns The unique Pass ID for the QR code.
 */
export async function generateExitPass(billId: string) {
  const client = supabase as any;
  
  const { data, error } = await client
    .from('exit_passes')
    .insert([{
      bill_id: billId,
      status: 'valid',
      created_at: new Date().toISOString()
    }])
    .select('id')
    .single();

  if (error) {
    console.error('Error generating exit pass:', error.message);
    return null;
  }

  return data.id;
}
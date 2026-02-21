import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types.ts';

// 1. Initialize the Supabase client using Vite environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Export the single client instance to be used across the application
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// ==========================================
// CORE DATA FETCHING QUERIES
// ==========================================

export interface DailyStat {
  date: string;
  quantity_sold: number;
  revenue: number;
}

/**
 * Fetches historical daily statistics for a specific product to feed into the Prediction Engine.
 * @param productId - The UUID of the product
 * @param days - Number of days of historical data to retrieve (default: 30)
 * @returns Array of daily statistics
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

  return data || [];
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
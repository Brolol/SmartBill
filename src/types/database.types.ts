export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      product_daily_stats: {
        Row: {
          id: string;
          product_id: string;
          date: string;
          quantity_sold: number;
          revenue: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          date: string;
          quantity_sold?: number;
          revenue?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          date?: string;
          quantity_sold?: number;
          revenue?: number;
          created_at?: string;
        };
      };
      ai_insights: {
        Row: {
          id: string;
          message: string;
          severity: 'info' | 'warning' | 'critical' | 'success';
          created_at: string;
          is_read: boolean;
        };
        Insert: {
          id?: string;
          message: string;
          severity?: 'info' | 'warning' | 'critical' | 'success';
          created_at?: string;
          is_read?: boolean;
        };
        Update: {
          id?: string;
          message?: string;
          severity?: 'info' | 'warning' | 'critical' | 'success';
          created_at?: string;
          is_read?: boolean;
        };
      };
      revenue_forecast: {
        Row: {
          id: string;
          forecast_date: string;
          predicted_revenue: number;
          confidence_score: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          forecast_date: string;
          predicted_revenue: number;
          confidence_score: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          forecast_date?: string;
          predicted_revenue?: number;
          confidence_score?: number;
          created_at?: string;
        };
      };
    };
  };
}
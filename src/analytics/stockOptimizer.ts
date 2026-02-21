/**
 * Smart Stock Optimization Engine
 * Calculates restock recommendations and stockout risks based on 
 * predicted demand and current inventory levels.
 */

import { PredictionOutput } from './predictionEngine';

export interface StockItem {
  id: string;
  name: string;
  currentStock: number;
  averageSellRate: number; // Units per day
}

export interface StockOptimization {
  productId: string;
  daysUntilStockout: number;
  suggestedRestockQuantity: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  recommendation: string;
}

/**
 * Calculates stock optimization metrics
 * @param item - Current stock data
 * @param prediction - Prediction output from predictionEngine
 * @param leadTimeDays - How long it takes for new stock to arrive (default 3 days)
 */
export const optimizeStock = (
  item: StockItem,
  prediction: PredictionOutput,
  leadTimeDays: number = 3
): StockOptimization => {
  
  // Use a hybrid of historical average and AI prediction for burn rate
  const projectedDailyDemand = (item.averageSellRate + prediction.predictedQuantityTomorrow) / 2;
  
  // Calculate days remaining
  const daysUntilStockout = projectedDailyDemand > 0 
    ? Math.floor(item.currentStock / projectedDailyDemand) 
    : 999;

  // Calculate suggested restock (aiming for 14 days of buffer)
  const targetBufferDays = 14;
  const neededStock = Math.round(projectedDailyDemand * (targetBufferDays + leadTimeDays));
  const suggestedRestockQuantity = Math.max(0, neededStock - item.currentStock);

  // Determine Risk Level
  let riskLevel: 'Low' | 'Medium' | 'High' = 'Low';
  if (daysUntilStockout <= leadTimeDays) {
    riskLevel = 'High';
  } else if (daysUntilStockout <= leadTimeDays + 4) {
    riskLevel = 'Medium';
  }

  // Generate actionable recommendation text
  let recommendation = `Stock levels are healthy for the next ${daysUntilStockout} days.`;
  if (riskLevel === 'High') {
    recommendation = `CRITICAL: Order ${suggestedRestockQuantity} units immediately to avoid stockout.`;
  } else if (riskLevel === 'Medium') {
    recommendation = `Warning: Consider restocking ${suggestedRestockQuantity} units soon.`;
  }

  return {
    productId: item.id,
    daysUntilStockout,
    suggestedRestockQuantity,
    riskLevel,
    recommendation
  };
};
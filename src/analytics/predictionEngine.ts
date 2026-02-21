/**
 * Smart Purchase Prediction Engine (V2 - Calendar Aware)
 * Calculates future demand based on Recency Weighting, Trend Slope, 
 * Weekday Seasonality, AND Active Calendar Events (e.g., Ramadan, Holidays).
 */

export interface DailyStat {
  date: string; // YYYY-MM-DD
  quantity_sold: number;
}

// NEW: Calendar Event Interface
export interface CalendarEvent {
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  // Map of product categories to their demand multiplier (e.g., { 'fruits': 1.5, 'dates': 2.0 })
  affectedCategories: Record<string, number>; 
}

export interface PredictionOutput {
  productId: string;
  predictedQuantityTomorrow: number;
  probabilityPercent: number;
  confidencePercent: number;
  trendDirection: '⬆ rising' | '⬇ falling' | 'stable';
  activeEventImpact?: string; // Tells the UI if an event is skewing the data
}

/**
 * Calculates a Simple Moving Average (SMA)
 */
const calculateSMA = (data: number[], window: number): number => {
  if (data.length < window) return 0;
  const recentData = data.slice(-window);
  const sum = recentData.reduce((acc, val) => acc + val, 0);
  return sum / window;
};

/**
 * Calculates a Weighted Moving Average (WMA) giving more weight to recent days
 */
const calculateWMA = (data: number[], window: number): number => {
  if (data.length < window) return 0;
  const recentData = data.slice(-window);
  let weightSum = 0;
  let weightedTotal = 0;

  for (let i = 0; i < window; i++) {
    const weight = i + 1; // [1, 2, 3...]
    weightedTotal += recentData[i] * weight;
    weightSum += weight;
  }
  return weightedTotal / weightSum;
};

/**
 * Calculates the slope (m) using Linear Regression: y = mx + b
 */
const calculateTrendSlope = (data: number[]): number => {
  const n = data.length;
  if (n < 2) return 0;

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (let i = 0; i < n; i++) {
    const x = i;
    const y = data[i];
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  }

  return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
};

/**
 * Calculates a standard day-of-week seasonality factor
 */
const calculateSeasonalityFactor = (stats: DailyStat[], targetDayOfWeek: number): number => {
  const sameDayStats = stats.filter(stat => new Date(stat.date).getDay() === targetDayOfWeek);
  
  if (sameDayStats.length === 0) return 1.0;

  const historicalAverage = sameDayStats.reduce((acc, val) => acc + val.quantity_sold, 0) / sameDayStats.length;
  const generalAverage = stats.reduce((acc, val) => acc + val.quantity_sold, 0) / stats.length;

  if (generalAverage === 0) return 1.0;
  return historicalAverage / generalAverage;
};

/**
 * NEW: Calculates the multiplier based on active calendar events
 */
const calculateEventMultiplier = (
  targetDate: Date, 
  productCategory: string, 
  activeEvents: CalendarEvent[]
): { multiplier: number; eventName?: string } => {
  
  const targetDateStr = targetDate.toISOString().split('T')[0];
  let finalMultiplier = 1.0;
  let applyingEventName: string | undefined = undefined;

  for (const event of activeEvents) {
    if (targetDateStr >= event.startDate && targetDateStr <= event.endDate) {
      const categoryMultiplier = event.affectedCategories[productCategory.toLowerCase()];
      if (categoryMultiplier) {
        finalMultiplier *= categoryMultiplier;
        applyingEventName = event.name;
      }
    }
  }

  return { multiplier: finalMultiplier, eventName: applyingEventName };
};

/**
 * Main function to generate hybrid prediction
 */
export const generatePrediction = (
  productId: string, 
  productCategory: string,
  stats: DailyStat[],
  activeEvents: CalendarEvent[] = [] // Optional parameter for active holidays/trends
): PredictionOutput => {
  const dataPoints = stats.map(s => s.quantity_sold);
  
  // 1. Establish Baselines
  const sma7 = calculateSMA(dataPoints, 7);
  const wma7 = calculateWMA(dataPoints, 7);
  
  // 2. Calculate Trend Slope
  const slope = calculateTrendSlope(dataPoints);
  let trendDirection: '⬆ rising' | '⬇ falling' | 'stable' = 'stable';
  if (slope > 0.5) trendDirection = '⬆ rising';
  else if (slope < -0.5) trendDirection = '⬇ falling';

  // 3. Set Target Date (Tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDayOfWeek = tomorrow.getDay();

  // 4. Calculate Seasonality & Event Factors
  const seasonalityFactor = calculateSeasonalityFactor(stats, tomorrowDayOfWeek);
  const { multiplier: eventMultiplier, eventName } = calculateEventMultiplier(tomorrow, productCategory, activeEvents);

  // 5. Hybrid AI Calculation
  // Base WMA + linear trend, scaled by standard weekday seasonality, then multiplied by the special Event Factor
  let predictedQuantity = (wma7 + slope) * seasonalityFactor * eventMultiplier;
  predictedQuantity = Math.max(0, Math.round(predictedQuantity));

  // 6. Confidence Scoring
  const dataVolumeConfidence = Math.min(100, (dataPoints.length / 30) * 100); 
  const variance = Math.abs(wma7 - sma7);
  let stabilityConfidence = Math.max(0, 100 - (variance * 10)); 

  // Adjust confidence if an event multiplier is heavily skewing the data
  if (eventMultiplier !== 1.0) {
    stabilityConfidence = Math.max(50, stabilityConfidence - 10); // slightly lower confidence during chaotic event spikes
  }
  
  const confidencePercent = Math.round((dataVolumeConfidence * 0.4) + (stabilityConfidence * 0.6));
  const probabilityPercent = Math.max(10, Math.min(99, confidencePercent - Math.abs(slope * 5)));

  return {
    productId,
    predictedQuantityTomorrow: predictedQuantity,
    probabilityPercent: Math.round(probabilityPercent),
    confidencePercent,
    trendDirection,
    ...(eventName && { activeEventImpact: `Boosted by ${eventName}` })
  };
};
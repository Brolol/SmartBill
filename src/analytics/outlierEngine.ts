/**
 * Intelligent Outlier Detection Engine
 * Implements Z-Score, Interquartile Range (IQR), Rolling Mean Deviation,
 * and Sudden Drop detection to identify sales anomalies and inventory risks.
 */

export interface TimeSeriesPoint {
  date: string;
  value: number; // Can be revenue, quantity sold, or inventory level
}

export type Severity = 'info' | 'warning' | 'critical' | 'success';

export interface OutlierAlert {
  date: string;
  value: number;
  method: 'Z-Score' | 'IQR' | 'Rolling Mean' | 'Sudden Drop';
  severity: Severity;
  title: string;
  explanation: string;
}

// --- HELPER MATH FUNCTIONS ---

const getMean = (data: number[]): number => {
  if (data.length === 0) return 0;
  return data.reduce((sum, val) => sum + val, 0) / data.length;
};

const getStandardDeviation = (data: number[], mean: number): number => {
  if (data.length <= 1) return 0;
  const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
  return Math.sqrt(variance);
};


// --- DETECTION ALGORITHMS ---

/**
 * 1. Z-Score Detection
 * Identifies points that are statistically far from the mean.
 * Good for normally distributed data.
 */
export const detectZScoreAnomalies = (data: TimeSeriesPoint[], threshold: number = 2.5): OutlierAlert[] => {
  const values = data.map(d => d.value);
  const mean = getMean(values);
  const stdDev = getStandardDeviation(values, mean);
  const alerts: OutlierAlert[] = [];

  if (stdDev === 0) return alerts;

  data.forEach(point => {
    const zScore = (point.value - mean) / stdDev;
    if (Math.abs(zScore) > threshold) {
      const isSpike = zScore > 0;
      const percentChange = Math.round((Math.abs(point.value - mean) / (mean || 1)) * 100);
      
      alerts.push({
        date: point.date,
        value: point.value,
        method: 'Z-Score',
        severity: isSpike ? 'success' : 'warning',
        title: isSpike ? 'Sudden Popularity Spike' : 'Unusual Activity Drop',
        explanation: `Value deviated significantly from the historical average (a ${percentChange}% difference).`
      });
    }
  });

  return alerts;
};

/**
 * 2. IQR (Interquartile Range) Detection
 * Robust to extreme outliers, good for skewed data.
 */
export const detectIQRAnomalies = (data: TimeSeriesPoint[]): OutlierAlert[] => {
  const values = [...data.map(d => d.value)].sort((a, b) => a - b);
  if (values.length < 4) return []; // Need enough data for quartiles

  const q1Index = Math.floor(values.length * 0.25);
  const q3Index = Math.floor(values.length * 0.75);
  
  const q1 = values[q1Index];
  const q3 = values[q3Index];
  const iqr = q3 - q1;
  
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  const alerts: OutlierAlert[] = [];

  data.forEach(point => {
    if (point.value < lowerBound || point.value > upperBound) {
      alerts.push({
        date: point.date,
        value: point.value,
        method: 'IQR',
        severity: point.value > upperBound ? 'success' : 'warning',
        title: 'Statistical Outlier Detected',
        explanation: `Value of ${point.value} falls completely outside expected normal operating bounds.`
      });
    }
  });

  return alerts;
};

/**
 * 3. Sudden Drop Detector (Inventory/Supply Focus)
 * Specifically looks for a sharp percentage drop in the most recent periods
 * compared to a rolling average.
 */
export const detectSuddenDrops = (data: TimeSeriesPoint[], dropThresholdPercent: number = 40, windowSize: number = 7): OutlierAlert[] => {
  const alerts: OutlierAlert[] = [];
  if (data.length < windowSize + 1) return alerts;

  // We loop through the data, ensuring we have a sufficient window behind the current point
  for (let i = windowSize; i < data.length; i++) {
    const currentPoint = data[i];
    const historicalWindow = data.slice(i - windowSize, i).map(d => d.value);
    const windowAverage = getMean(historicalWindow);

    if (windowAverage === 0) continue;

    const dropPercent = ((windowAverage - currentPoint.value) / windowAverage) * 100;

    if (dropPercent >= dropThresholdPercent) {
      alerts.push({
        date: currentPoint.date,
        value: currentPoint.value,
        method: 'Sudden Drop',
        severity: 'critical',
        title: 'Possible Supply Issue',
        explanation: `Volume dropped ${Math.round(dropPercent)}% compared to the preceding ${windowSize}-day moving average.`
      });
    }
  }

  return alerts;
};

/**
 * Main Controller: Run all checks and deduplicate alerts for a specific point in time (usually 'today' or 'yesterday')
 */
export const runComprehensiveAnomalyCheck = (data: TimeSeriesPoint[]): OutlierAlert[] => {
  if (data.length === 0) return [];

  const zScoreAlerts = detectZScoreAnomalies(data);
  const iqrAlerts = detectIQRAnomalies(data);
  const dropAlerts = detectSuddenDrops(data);

  const allAlerts = [...zScoreAlerts, ...iqrAlerts, ...dropAlerts];

  // Deduplicate: If multiple algorithms flag the exact same date, keep the highest severity/most specific one
  const uniqueAlertsMap = new Map<string, OutlierAlert>();
  
  allAlerts.forEach(alert => {
    const existing = uniqueAlertsMap.get(alert.date);
    if (!existing) {
      uniqueAlertsMap.set(alert.date, alert);
    } else {
      // Prioritize Critical -> Warning -> Success -> Info
      const severityRank = { 'critical': 4, 'warning': 3, 'success': 2, 'info': 1 };
      if (severityRank[alert.severity] > severityRank[existing.severity]) {
        uniqueAlertsMap.set(alert.date, alert);
      }
    }
  });

  // Return sorted by most recent date first
  return Array.from(uniqueAlertsMap.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};
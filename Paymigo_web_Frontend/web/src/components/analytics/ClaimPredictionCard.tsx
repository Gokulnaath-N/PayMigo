import React from 'react';

interface ClaimsData {
  historical: {
    totalClaims: number;
    averageDailyClaims: number;
    claimsByDay: Record<string, number>;
    claimsByZone: Record<string, number>;
    totalPayout: number;
  };
  predicted: {
    expectedClaims: number[];
    peakDay: string;
    confidence: number;
  };
  trends: {
    trend: 'INCREASING' | 'DECREASING' | 'STABLE';
    weekOverWeekChange: string;
  };
}

interface ForecastData {
  global: {
    totalWorkers: number;
    avgRiskScore: number;
    riskScores: number[];
    expectedClaims: number[];
    projectedPayout: number;
  };
  zones: Array<{
    zoneId: string;
    zoneName: string;
    city: string;
    workerCount: number;
    riskScores: number[];
    expectedClaims: number[];
    avgRiskScore: number;
  }>;
  highRiskZones: number;
  forecastDates: string[];
}

interface ClaimPredictionCardProps {
  claimsData: ClaimsData;
  forecastData?: ForecastData;
}

export default function ClaimPredictionCard({ claimsData, forecastData }: ClaimPredictionCardProps) {
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'INCREASING':
        return <span className="text-red-500">trending_up</span>;
      case 'DECREASING':
        return <span className="text-green-500">trending_down</span>;
      default:
        return <span className="text-gray-500">trending_flat</span>;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'INCREASING':
        return 'text-red-600';
      case 'DECREASING':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatPeakDay = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Calculate claim rate (per day)
  const claimRate = claimsData.historical.averageDailyClaims;

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <h3 className="text-lg font-semibold mb-4">Claim Prediction Analysis</h3>
      
      {/* Historical vs Predicted */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900">
            {claimsData.historical.totalClaims.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">Historical Claims (30 days)</div>
          <div className="text-xs text-gray-500 mt-1">
            Avg: {claimsData.historical.averageDailyClaims.toFixed(1)}/day
          </div>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600">
            {forecastData?.global.expectedClaims[0]?.toLocaleString() || 0}
          </div>
          <div className="text-sm text-gray-600">Expected Claims (Tomorrow)</div>
          <div className="text-xs text-gray-500 mt-1">
            Peak: {formatPeakDay(claimsData.predicted.peakDay)}
          </div>
        </div>
      </div>

      {/* Trend Analysis */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Claim Trend</span>
          <div className="flex items-center">
            {getTrendIcon(claimsData.trends.trend)}
            <span className={`ml-1 text-sm font-medium ${getTrendColor(claimsData.trends.trend)}`}>
              {claimsData.trends.trend}
            </span>
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${
              claimsData.trends.trend === 'INCREASING' ? 'bg-red-500' :
              claimsData.trends.trend === 'DECREASING' ? 'bg-green-500' :
              'bg-gray-500'
            }`}
            style={{ width: '60%' }}
          />
        </div>
      </div>

      {/* Key Metrics */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Model Confidence</span>
          <span className="text-sm font-medium">
            {(claimsData.predicted.confidence * 100).toFixed(0)}%
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Avg Daily Claims</span>
          <span className="text-sm font-medium">{claimRate.toFixed(1)}/day</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Avg Payout per Claim</span>
          <span className="text-sm font-medium">
            {claimsData.historical.totalClaims > 0 
              ? formatCurrency(claimsData.historical.totalPayout / claimsData.historical.totalClaims)
              : 'N/A'
            }
          </span>
        </div>
      </div>

      {/* Top Zones by Claims */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Top Zones by Claims</h4>
        <div className="space-y-2">
          {Object.entries(claimsData.historical.claimsByZone)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([zone, claims]) => (
              <div key={zone} className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{zone}</span>
                <span className="text-sm font-medium">{claims} claims</span>
              </div>
            ))}
        </div>
      </div>

      {/* Alert for High Volume */}
      {(forecastData?.global.expectedClaims[0] ?? 0) > claimsData.historical.averageDailyClaims * 1.5 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <span className="text-yellow-600 mr-2">warning</span>
            <div>
              <div className="text-sm font-medium text-yellow-800">
                High Claim Volume Expected
              </div>
              <div className="text-xs text-yellow-600">
                Tomorrow's claims expected to be 50% higher than average
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

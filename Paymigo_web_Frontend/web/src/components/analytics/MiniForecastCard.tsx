import React from 'react';

interface GlobalForecast {
  totalWorkers: number;
  avgRiskScore: number;
  riskScores: number[];
  expectedClaims: number[];
  projectedPayout: number;
}

interface MiniForecastCardProps {
  forecastData: GlobalForecast;
  forecastDates: string[];
}

export default function MiniForecastCard({ forecastData, forecastDates }: MiniForecastCardProps) {
  const getRiskLevel = (score: number) => {
    if (score > 0.7) return { level: 'HIGH', color: 'text-red-600', bg: 'bg-red-50' };
    if (score > 0.4) return { level: 'MEDIUM', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    return { level: 'LOW', color: 'text-green-600', bg: 'bg-green-50' };
  };

  const currentRisk = getRiskLevel(forecastData.avgRiskScore);
  const tomorrowRisk = getRiskLevel(forecastData.riskScores[1] || forecastData.avgRiskScore);

  // Mini chart using simple bars
  const maxScore = Math.max(...forecastData.riskScores);
  const barHeight = 40;

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Weekly Risk Outlook</h3>
        <div className={`px-3 py-1 rounded-full ${currentRisk.bg} ${currentRisk.color} text-sm font-medium`}>
          {currentRisk.level} RISK
        </div>
      </div>

      {/* Risk Status */}
      <div className="mb-4">
        {forecastData.avgRiskScore > 0.7 && (
          <div className="flex items-center p-3 bg-red-50 rounded-lg border border-red-200">
            <span className="text-red-600 mr-2">warning</span>
            <span className="text-red-800 text-sm font-medium">High Risk This Week</span>
          </div>
        )}
        {forecastData.avgRiskScore <= 0.7 && (
          <div className="flex items-center p-3 bg-green-50 rounded-lg border border-green-200">
            <span className="text-green-600 mr-2">check_circle</span>
            <span className="text-green-800 text-sm font-medium">Moderate Risk Levels</span>
          </div>
        )}
      </div>

      {/* Mini Risk Chart */}
      <div className="mb-4">
        <div className="flex items-end justify-between h-12 mb-2">
          {forecastData.riskScores.slice(0, 7).map((score, index) => {
            const height = maxScore > 0 ? (score / maxScore) * barHeight : 0;
            const risk = getRiskLevel(score);
            
            return (
              <div key={index} className="flex-1 mx-1">
                <div 
                  className={`w-full rounded-t ${risk.bg}`}
                  style={{ height: `${height}px` }}
                />
                <div className="text-xs text-center mt-1 text-gray-500">
                  ['S', 'M', 'T', 'W', 'T', 'F', 'S'][index]
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Average Risk Score</span>
          <span className={`text-sm font-medium ${currentRisk.color}`}>
            {forecastData.avgRiskScore.toFixed(2)}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Tomorrow's Risk</span>
          <span className={`text-sm font-medium ${tomorrowRisk.color}`}>
            {tomorrowRisk.level}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Protected Workers</span>
          <span className="text-sm font-medium text-gray-900">
            {forecastData.totalWorkers.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Protection Message */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-blue-800 text-sm font-medium text-center">
          "Stay active - you are protected"
        </p>
      </div>
    </div>
  );
}

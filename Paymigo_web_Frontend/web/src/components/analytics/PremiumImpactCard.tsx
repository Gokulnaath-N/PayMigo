import React from 'react';

interface PremiumAdjustment {
  percentage: number;
  amount: string;
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

interface PremiumImpactCardProps {
  premiumAdjustment: PremiumAdjustment;
  forecastData?: ForecastData;
}

export default function PremiumImpactCard({ premiumAdjustment, forecastData }: PremiumImpactCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getAdjustmentColor = (percentage: number) => {
    if (percentage > 15) return 'text-red-600';
    if (percentage > 5) return 'text-yellow-600';
    if (percentage < -5) return 'text-green-600';
    return 'text-gray-600';
  };

  const getAdjustmentBgColor = (percentage: number) => {
    if (percentage > 15) return 'bg-red-50 border-red-200';
    if (percentage > 5) return 'bg-yellow-50 border-yellow-200';
    if (percentage < -5) return 'bg-green-50 border-green-200';
    return 'bg-gray-50 border-gray-200';
  };

  // Calculate projected revenue impact
  const basePremium = 640; // Average weekly premium
  const projectedWorkers = forecastData?.global.totalWorkers || 0;
  const weeklyRevenue = basePremium * projectedWorkers;
  const adjustedRevenue = weeklyRevenue * (1 + premiumAdjustment.percentage / 100);
  const revenueImpact = adjustedRevenue - weeklyRevenue;

  // Calculate risk-based premium by zone
  const zonePremiums = forecastData?.zones.map(zone => ({
    zoneName: zone.zoneName,
    city: zone.city,
    basePremium,
    riskMultiplier: 1 + (zone.avgRiskScore * 0.5), // Risk-based multiplier
    adjustedPremium: basePremium * (1 + (zone.avgRiskScore * 0.5)),
    workerCount: zone.workerCount
  })) || [];

  const highRiskZones = zonePremiums.filter(z => z.riskMultiplier > 1.3);

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <h3 className="text-lg font-semibold mb-4">Premium Impact Analysis</h3>
      
      {/* Current Adjustment */}
      <div className={`p-4 rounded-lg border mb-6 ${getAdjustmentBgColor(premiumAdjustment.percentage)}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Recommended Adjustment</span>
          <span className={`text-lg font-bold ${getAdjustmentColor(premiumAdjustment.percentage)}`}>
            {premiumAdjustment.percentage > 0 ? '+' : ''}{premiumAdjustment.percentage}%
          </span>
        </div>
        <div className="text-sm text-gray-600">
          Action: {premiumAdjustment.amount}
        </div>
      </div>

      {/* Revenue Impact */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-lg font-bold text-gray-900">
            {formatCurrency(weeklyRevenue)}
          </div>
          <div className="text-sm text-gray-600">Current Weekly Revenue</div>
          <div className="text-xs text-gray-500 mt-1">
            {projectedWorkers.toLocaleString()} workers × {formatCurrency(basePremium)}
          </div>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-lg font-bold text-blue-600">
            {formatCurrency(adjustedRevenue)}
          </div>
          <div className="text-sm text-gray-600">Adjusted Weekly Revenue</div>
          <div className={`text-xs mt-1 font-medium ${getAdjustmentColor(revenueImpact)}`}>
            {revenueImpact > 0 ? '+' : ''}{formatCurrency(revenueImpact)} impact
          </div>
        </div>
      </div>

      {/* Risk-Based Premium by Zone */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Risk-Adjusted Premium by Zone</h4>
        <div className="space-y-2">
          {zonePremiums
            .sort((a, b) => b.riskMultiplier - a.riskMultiplier)
            .slice(0, 4)
            .map((zone) => (
              <div key={zone.zoneName} className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{zone.city}</div>
                  <div className="text-xs text-gray-500">
                    {zone.workerCount} workers
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {formatCurrency(zone.adjustedPremium)}
                  </div>
                  <div className="text-xs text-gray-500">
                    ×{zone.riskMultiplier.toFixed(2)} risk
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* High Risk Zones Alert */}
      {highRiskZones.length > 0 && (
        <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-start">
            <span className="text-orange-600 mr-2 mt-0.5">priority_high</span>
            <div>
              <div className="text-sm font-medium text-orange-800">
                {highRiskZones.length} High-Risk Zone{highRiskZones.length > 1 ? 's' : ''} Identified
              </div>
              <div className="text-xs text-orange-600 mt-1">
                Consider zone-specific premium adjustments for {highRiskZones.map(z => z.city).join(', ')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Implementation Timeline */}
      <div className="border-t pt-4 mt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Implementation Impact</h4>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Next Week Revenue</span>
            <span className="text-sm font-medium">
              {formatCurrency(adjustedRevenue)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Monthly Impact</span>
            <span className={`text-sm font-medium ${getAdjustmentColor(revenueImpact * 4)}`}>
              {revenueImpact > 0 ? '+' : ''}{formatCurrency(revenueImpact * 4)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Quarterly Impact</span>
            <span className={`text-sm font-medium ${getAdjustmentColor(revenueImpact * 12)}`}>
              {revenueImpact > 0 ? '+' : ''}{formatCurrency(revenueImpact * 12)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

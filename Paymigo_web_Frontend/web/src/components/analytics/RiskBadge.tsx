import React from 'react';

interface RiskBadgeProps {
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export default function RiskBadge({ riskScore, riskLevel }: RiskBadgeProps) {
  const getRiskConfig = (level: string) => {
    switch (level) {
      case 'HIGH':
        return {
          bg: 'bg-red-100',
          text: 'text-red-800',
          border: 'border-red-200',
          icon: 'warning',
          description: 'High risk conditions detected'
        };
      case 'MEDIUM':
        return {
          bg: 'bg-yellow-100',
          text: 'text-yellow-800',
          border: 'border-yellow-200',
          icon: 'priority_high',
          description: 'Moderate risk conditions'
        };
      case 'LOW':
        return {
          bg: 'bg-green-100',
          text: 'text-green-800',
          border: 'border-green-200',
          icon: 'check_circle',
          description: 'Low risk conditions'
        };
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          border: 'border-gray-200',
          icon: 'info',
          description: 'Risk level unknown'
        };
    }
  };

  const config = getRiskConfig(riskLevel);

  return (
    <div className={`inline-flex items-center px-3 py-2 rounded-full border ${config.bg} ${config.text} ${config.border}`}>
      <span className="mr-2">{config.icon}</span>
      <div className="text-left">
        <div className="font-medium text-sm">{riskLevel} RISK</div>
        <div className="text-xs opacity-75">Score: {riskScore.toFixed(2)}</div>
      </div>
    </div>
  );
}

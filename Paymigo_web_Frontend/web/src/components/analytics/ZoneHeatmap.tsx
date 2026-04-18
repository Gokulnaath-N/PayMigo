import React from 'react';

interface Zone {
  id: string;
  name: string;
  city: string;
  pincode: string;
  workerCount: number;
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  recentWeather: string;
  coordinates: { lat: number; lng: number };
}

interface ZoneHeatmapProps {
  zones: Zone[];
}

export default function ZoneHeatmap({ zones }: ZoneHeatmapProps) {
  // Simplified India map coordinates for major cities
  const getZonePosition = (city: string) => {
    const positions: Record<string, { x: number; y: number }> = {
      'Chennai': { x: 520, y: 380 },
      'Bangalore': { x: 450, y: 350 },
      'Coimbatore': { x: 480, y: 340 },
      'Delhi': { x: 400, y: 120 },
      'Mumbai': { x: 350, y: 280 },
      'Kolkata': { x: 550, y: 200 },
      'Hyderabad': { x: 420, y: 320 },
      'Pune': { x: 360, y: 290 },
      'Ahmedabad': { x: 320, y: 240 }
    };
    return positions[city] || { x: 400, y: 250 }; // Default center
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'HIGH': return '#ef4444';
      case 'MEDIUM': return '#eab308';
      case 'LOW': return '#22c55e';
      default: return '#6b7280';
    }
  };

  const getRiskOpacity = (riskScore: number) => {
    return 0.3 + (riskScore * 0.7); // Opacity based on risk score
  };

  // Simplified India SVG path
  const indiaPath = "M 300 100 Q 350 80, 400 100 L 450 120 Q 500 140, 520 180 L 540 220 Q 560 260, 550 300 L 540 340 Q 530 380, 500 400 L 460 420 Q 420 440, 380 430 L 340 420 Q 300 400, 280 360 L 260 320 Q 240 280, 250 240 L 260 200 Q 280 160, 300 140 Z";

  return (
    <div className="w-full">
      <svg width="600" height="450" viewBox="0 0 600 450" className="w-full h-auto">
        {/* India map outline */}
        <path
          d={indiaPath}
          fill="#f3f4f6"
          stroke="#d1d5db"
          strokeWidth="2"
        />

        {/* Zone markers */}
        {zones.map((zone) => {
          const position = getZonePosition(zone.city);
          const color = getRiskColor(zone.riskLevel);
          const opacity = getRiskOpacity(zone.riskScore);
          
          return (
            <g key={zone.id}>
              {/* Risk circle */}
              <circle
                cx={position.x}
                cy={position.y}
                r={15 + zone.workerCount / 100} // Size based on worker count
                fill={color}
                fillOpacity={opacity}
                stroke={color}
                strokeWidth="2"
                className="hover:stroke-width-3 transition-all cursor-pointer"
              >
                <title>
                  {zone.name} ({zone.city})
                  Risk: {zone.riskLevel} ({zone.riskScore.toFixed(2)})
                  Workers: {zone.workerCount}
                  Weather: {zone.recentWeather}
                </title>
              </circle>

              {/* City label */}
              <text
                x={position.x}
                y={position.y - 20}
                textAnchor="middle"
                className="text-xs font-medium fill-gray-700"
              >
                {zone.city}
              </text>

              {/* Risk level indicator */}
              <text
                x={position.x}
                y={position.y + 4}
                textAnchor="middle"
                className="text-xs font-bold fill-white"
              >
                {zone.riskLevel[0]}
              </text>
            </g>
          );
        })}

        {/* Scale indicator */}
        <g transform="translate(50, 400)">
          <text x="0" y="0" className="text-xs fill-gray-600">Risk Level:</text>
          
          <circle cx="80" cy="-5" r="8" fill="#22c55e" fillOpacity="0.7" />
          <text x="95" y="0" className="text-xs fill-gray-600">Low</text>
          
          <circle cx="140" cy="-5" r="8" fill="#eab308" fillOpacity="0.7" />
          <text x="155" y="0" className="text-xs fill-gray-600">Medium</text>
          
          <circle cx="210" cy="-5" r="8" fill="#ef4444" fillOpacity="0.7" />
          <text x="225" y="0" className="text-xs fill-gray-600">High</text>
        </g>
      </svg>

      {/* Zone details table */}
      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Zone
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Risk Level
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Risk Score
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Workers
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Weather
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {zones.map((zone) => (
              <tr key={zone.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                  {zone.name}
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    zone.riskLevel === 'HIGH' ? 'bg-red-100 text-red-800' :
                    zone.riskLevel === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {zone.riskLevel}
                  </span>
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                  {zone.riskScore.toFixed(3)}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                  {zone.workerCount}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                  {zone.recentWeather}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

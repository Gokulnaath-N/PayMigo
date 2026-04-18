import React, { useState } from 'react';

interface Insight {
  type: string;
  title: string;
  description: string;
  impact: string;
  action: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  zoneId?: string;
}

interface Alert {
  type: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
  recommendation: string;
  zoneId?: string;
}

interface Summary {
  totalInsights: number;
  totalAlerts: number;
  highPriorityItems: number;
}

interface InsightsPanelProps {
  insights: Insight[];
  alerts: Alert[];
  summary: Summary;
}

export default function InsightsPanel({ insights, alerts, summary }: InsightsPanelProps) {
  const [activeTab, setActiveTab] = useState<'insights' | 'alerts'>('insights');

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-800 border-red-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'HIGH': return 'bg-red-100 text-red-800 border-red-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'RISK': return 'warning';
      case 'ZONE': return 'location_on';
      case 'PRICING': return 'currency_rupee';
      case 'WEATHER': return 'thunderstorm';
      default: return 'info';
    }
  };

  const filteredInsights = insights.sort((a, b) => {
    const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  const filteredAlerts = alerts.sort((a, b) => {
    const severityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  return (
    <div>
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{summary.totalInsights}</div>
          <div className="text-sm text-gray-600">Insights</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{summary.totalAlerts}</div>
          <div className="text-sm text-gray-600">Alerts</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{summary.highPriorityItems}</div>
          <div className="text-sm text-gray-600">High Priority</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('insights')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'insights'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Insights ({insights.length})
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'alerts'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Alerts ({alerts.length})
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'insights' && (
        <div className="space-y-4">
          {filteredInsights.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No insights available at this time
            </div>
          ) : (
            filteredInsights.map((insight, index) => (
              <div key={index} className={`p-4 rounded-lg border ${getPriorityColor(insight.priority)}`}>
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-3">
                    <span className="text-xl">
                      {getTypeIcon(insight.type)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{insight.title}</h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(insight.priority)}`}>
                        {insight.priority}
                      </span>
                    </div>
                    <p className="text-sm mb-2">{insight.description}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="font-medium">Impact:</span> {insight.impact}
                      </div>
                      <div>
                        <span className="font-medium">Action:</span> {insight.action}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="space-y-4">
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No active alerts
            </div>
          ) : (
            filteredAlerts.map((alert, index) => (
              <div key={index} className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}>
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-3">
                    <span className="text-xl">
                      {getTypeIcon(alert.type)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(alert.severity)}`}>
                        {alert.severity}
                      </span>
                    </div>
                    <p className="text-sm font-medium mb-1">{alert.message}</p>
                    <p className="text-xs">{alert.recommendation}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Actions</h4>
        <div className="flex flex-wrap gap-2">
          <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
            Export Report
          </button>
          <button className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700">
            Schedule Review
          </button>
          <button className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700">
            Apply Premium Changes
          </button>
          <button className="px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50">
            Configure Alerts
          </button>
        </div>
      </div>
    </div>
  );
}

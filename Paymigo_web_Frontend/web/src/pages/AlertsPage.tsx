import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, MapPin, Eye, X, CheckCircle, AlertCircle, RefreshCw, Trash2 } from 'lucide-react';
import axios from 'axios';

// Configure axios with base URL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface NLPEvent {
  id: string;
  text: string;
  label: string;
  confidence: number;
  source: string;
  zone: string;
  status: string;
  createdAt: string;
}

interface NLPStats {
  total: number;
  active: number;
  breakdown: Array<{
    label: string;
    status: string;
    _count: { id: number };
  }>;
}

const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<NLPEvent[]>([]);
  const [stats, setStats] = useState<NLPStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<NLPEvent | null>(null);
  const [filterZone, setFilterZone] = useState('all');
  const [filterStatus, setFilterStatus] = useState('active');

  const zones = ['all', 'chennai-central', 'mumbai-western', 'delhi-ncr', 'bangalore-electronic-city', 'hyderabad-hitech-city'];

  useEffect(() => {
    fetchAlerts();
    fetchStats();
  }, [filterZone, filterStatus]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/nlp/alerts?status=${filterStatus}&zone=${filterZone}`);
      setAlerts(response.data);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/api/nlp/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const processHeadlines = async () => {
    try {
      setProcessing(true);
      
      // First get simulated headlines from ML service
      const mlResponse = await fetch('http://localhost:8000/curfew/simulate-news');
      const mlData = await mlResponse.json();
      const headlines = mlData.headlines;
      
      // Then process them through our backend
      const backendResponse = await api.post('/api/nlp/process-headlines', {
        headlines: headlines
      });
      
      // Refresh alerts and stats
      await fetchAlerts();
      await fetchStats();
      
      alert(`Processed ${backendResponse.data.processed} new alerts!`);
    } catch (error) {
      console.error('Error processing headlines:', error);
      alert('Failed to process headlines. Please check ML service connection.');
    } finally {
      setProcessing(false);
    }
  };

  const convertToTrigger = async (alertId: string) => {
    try {
      setProcessing(true);
      await api.post('/api/nlp/convert-to-trigger', {
        nlpEventId: alertId,
        threshold: 0.8
      });
      
      await fetchAlerts();
      await fetchStats();
      setSelectedAlert(null);
      alert('Alert successfully converted to system trigger!');
    } catch (error) {
      console.error('Error converting to trigger:', error);
      alert('Failed to convert alert to trigger.');
    } finally {
      setProcessing(false);
    }
  };

  const ignoreAlert = async (alertId: string) => {
    try {
      setProcessing(true);
      await api.post('/api/nlp/ignore-alert', {
        nlpEventId: alertId
      });
      
      await fetchAlerts();
      await fetchStats();
      setSelectedAlert(null);
    } catch (error) {
      console.error('Error ignoring alert:', error);
      alert('Failed to ignore alert.');
    } finally {
      setProcessing(false);
    }
  };

  const clearOldAlerts = async () => {
    try {
      setProcessing(true);
      const response = await api.delete('/api/nlp/clear-old');
      await fetchStats();
      alert(`Cleared ${response.data.deleted} old alerts.`);
    } catch (error) {
      console.error('Error clearing old alerts:', error);
      alert('Failed to clear old alerts.');
    } finally {
      setProcessing(false);
    }
  };

  const getLabelColor = (label: string) => {
    switch (label) {
      case 'curfew': return 'bg-red-100 text-red-800 border-red-200';
      case 'strike': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'triggered': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'ignored': return <X className="w-4 h-4 text-gray-500" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">NLP Alert Command Center</h1>
              <p className="text-gray-600 mt-1">Monitor and manage city-wide disruption alerts</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={processHeadlines}
                disabled={processing}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${processing ? 'animate-spin' : ''}`} />
                Process Headlines
              </button>
              <button
                onClick={clearOldAlerts}
                disabled={processing}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                Clear Old
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Events</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-yellow-600">{stats.active}</div>
              <div className="text-sm text-gray-600">Active Alerts</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-red-600">
                {stats.breakdown.find(b => b.label === 'curfew')?._count?.id || 0}
              </div>
              <div className="text-sm text-gray-600">Curfew Alerts</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-orange-600">
                {stats.breakdown.find(b => b.label === 'strike')?._count?.id || 0}
              </div>
              <div className="text-sm text-gray-600">Strike Alerts</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex gap-4 items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Zone</label>
              <select
                value={filterZone}
                onChange={(e) => setFilterZone(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {zones.map(zone => (
                  <option key={zone} value={zone}>
                    {zone === 'all' ? 'All Zones' : zone.replace('-', ' ').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="active">Active</option>
                <option value="triggered">Triggered</option>
                <option value="ignored">Ignored</option>
              </select>
            </div>
          </div>
        </div>

        {/* Alerts List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Alerts Feed */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Alerts Feed</h2>
              </div>
              <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="p-8 text-center text-gray-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading alerts...
                  </div>
                ) : alerts.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    No alerts found
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <div
                      key={alert.id}
                      onClick={() => setSelectedAlert(alert)}
                      className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getLabelColor(alert.label)}`}>
                              {alert.label.toUpperCase()}
                            </span>
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              {getStatusIcon(alert.status)}
                              {alert.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-900 mb-2">{alert.text}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {alert.zone}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(alert.createdAt).toLocaleString()}
                            </span>
                            <span>Confidence: {(alert.confidence * 100).toFixed(1)}%</span>
                          </div>
                        </div>
                        <Eye className="w-4 h-4 text-gray-400 mt-1" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Alert Detail & Actions */}
          <div className="lg:col-span-1">
            {selectedAlert ? (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Alert Details</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Type</label>
                    <div className="mt-1">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getLabelColor(selectedAlert.label)}`}>
                        {selectedAlert.label.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Headline</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedAlert.text}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Zone</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedAlert.zone}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Confidence</label>
                    <div className="mt-1">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${selectedAlert.confidence * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-900">
                          {(selectedAlert.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Source</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedAlert.source}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Created</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(selectedAlert.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {selectedAlert.status === 'active' && (
                  <div className="mt-6 space-y-3">
                    <button
                      onClick={() => convertToTrigger(selectedAlert.id)}
                      disabled={processing}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      Escalate to Trigger
                    </button>
                    <button
                      onClick={() => ignoreAlert(selectedAlert.id)}
                      disabled={processing}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                      Ignore Alert
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-6 text-center text-gray-500">
                <AlertTriangle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                Select an alert to view details
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertsPage;

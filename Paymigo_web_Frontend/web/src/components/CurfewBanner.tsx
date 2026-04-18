import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, MapPin, Clock, Shield } from 'lucide-react';
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

interface CurfewBannerProps {
  userZone?: string;
}

const CurfewBanner: React.FC<CurfewBannerProps> = ({ userZone = 'chennai-central' }) => {
  const [alerts, setAlerts] = useState<NLPEvent[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [userZone]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/nlp/alerts?status=active&zone=${userZone}`);
      setAlerts(response.data);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const dismissAlert = (alertId: string) => {
    setDismissed(prev => new Set(prev).add(alertId));
  };

  const getAlertColor = (label: string) => {
    switch (label) {
      case 'curfew':
        return 'bg-red-500 border-red-600 text-white';
      case 'strike':
        return 'bg-orange-500 border-orange-600 text-white';
      default:
        return 'bg-gray-500 border-gray-600 text-white';
    }
  };

  const getAlertIcon = (label: string) => {
    switch (label) {
      case 'curfew':
        return <Shield className="w-5 h-5" />;
      case 'strike':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <AlertTriangle className="w-5 h-5" />;
    }
  };

  const activeAlerts = alerts.filter(alert => !dismissed.has(alert.id));

  if (loading) {
    return null;
  }

  if (activeAlerts.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 animate-pulse">
      {activeAlerts.map((alert, index) => (
        <div
          key={alert.id}
          className={`${getAlertColor(alert.label)} border-b-2 shadow-lg`}
          style={{ top: `${index * 80}px` }}
        >
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1">
                <div className="flex-shrink-0 animate-pulse">
                  {getAlertIcon(alert.label)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider">
                      {alert.label} ALERT
                    </span>
                    <span className="text-xs opacity-75">
                      • {(alert.confidence * 100).toFixed(0)}% Confidence
                    </span>
                  </div>
                  
                  <p className="text-sm font-medium truncate">
                    {alert.text}
                  </p>
                  
                  <div className="flex items-center space-x-3 text-xs opacity-75 mt-1">
                    <span className="flex items-center space-x-1">
                      <MapPin className="w-3 h-3" />
                      <span>{alert.zone}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(alert.createdAt).toLocaleTimeString()}</span>
                    </span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => dismissAlert(alert.id)}
                className="flex-shrink-0 p-1 hover:bg-white/10 rounded-full transition-colors"
                aria-label="Dismiss alert"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      ))}
      
      {/* Spacer to prevent content from being hidden under the banner */}
      <div style={{ height: `${activeAlerts.length * 80}px` }} />
    </div>
  );
};

export default CurfewBanner;

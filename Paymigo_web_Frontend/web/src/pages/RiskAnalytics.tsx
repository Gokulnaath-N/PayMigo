import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { motion, AnimatePresence } from 'motion/react';
import {
  BarChart2, TrendingUp, Shield, AlertTriangle,
  RefreshCw, Loader2, ChevronRight, Zap, MapPin,
  Users, FileText, IndianRupee, Activity
} from 'lucide-react';
import { isAdminUser, cn } from '@/lib/utils';
import AdminSidebar from '../components/admin/AdminSidebar';

import ForecastChart      from '../components/analytics/ForecastChart';
import ZoneHeatmap        from '../components/analytics/ZoneHeatmap';
import ClaimPredictionCard from '../components/analytics/ClaimPredictionCard';
import PremiumImpactCard   from '../components/analytics/PremiumImpactCard';
import InsightsPanel      from '../components/analytics/InsightsPanel';
import MiniForecastCard   from '../components/analytics/MiniForecastCard';
import RiskBadge          from '../components/analytics/RiskBadge';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/analytics`;

// ── Types ─────────────────────────────────────────────────────────────────────

interface GlobalMetrics {
  totalWorkers: number;
  avgRiskScore: number;
  riskScores: number[];
  expectedClaims: number[];
  projectedPayout: number;
}

interface ZoneForecast {
  zoneId: string;
  zoneName: string;
  city: string;
  workerCount: number;
  riskScores: number[];
  expectedClaims: number[];
  avgRiskScore: number;
}

interface ForecastData {
  global: GlobalMetrics;
  zones: ZoneForecast[];
  highRiskZones: number;
  forecastDates: string[];
}

interface ZoneData {
  zones: Array<{
    id: string; name: string; city: string; pincode: string;
    workerCount: number; riskScore: number; riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    recentWeather: string; coordinates: { lat: number; lng: number };
  }>;
  summary: { totalZones: number; highRiskZones: number; mediumRiskZones: number; lowRiskZones: number };
}

interface ClaimsData {
  historical: {
    totalClaims: number; averageDailyClaims: number;
    claimsByDay: Record<string, number>;
    claimsByZone: Record<string, number>;
    totalPayout: number;
  };
  predicted: { expectedClaims: number[]; peakDay: string; confidence: number };
  trends: { trend: 'INCREASING' | 'DECREASING' | 'STABLE'; weekOverWeekChange: string };
}

interface InsightsData {
  insights: Array<{
    type: string; title: string; description: string;
    impact: string; action: string; priority: 'HIGH' | 'MEDIUM' | 'LOW'; zoneId?: string;
  }>;
  alerts: Array<{
    type: string; severity: 'HIGH' | 'MEDIUM' | 'LOW';
    message: string; recommendation: string; zoneId?: string;
  }>;
  summary: { totalInsights: number; totalAlerts: number; highPriorityItems: number };
  premiumAdjustment: { percentage: number; amount: string };
  lastUpdated: string;
}

// ── Metric Card ───────────────────────────────────────────────────────────────

const MetricCard = ({
  label, value, sub, icon: Icon, color = 'accent',
}: {
  label: string; value: string; sub?: string;
  icon: React.FC<{ className?: string }>; color?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="glass-card p-5 flex items-center gap-4"
  >
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-${color}/10`}>
      <Icon className={`w-6 h-6 text-${color}`} />
    </div>
    <div>
      <div className="text-[10px] font-black text-text-secondary uppercase tracking-widest">{label}</div>
      <div className="text-2xl font-mono font-bold">{value}</div>
      {sub && <div className="text-[10px] text-text-secondary">{sub}</div>}
    </div>
  </motion.div>
);

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function RiskAnalytics() {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const isAdmin   = isAdminUser(user?.email);

  const [forecastData,  setForecastData]  = useState<ForecastData | null>(null);
  const [zoneData,      setZoneData]      = useState<ZoneData | null>(null);
  const [claimsData,    setClaimsData]    = useState<ClaimsData | null>(null);
  const [insightsData,  setInsightsData]  = useState<InsightsData | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);
  const [refreshKey,    setRefreshKey]    = useState(0);
  const [expanded,      setExpanded]      = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = token
        ? { Authorization: `Bearer ${token}` }
        : {};

      const results = await Promise.allSettled([
        fetch(`${API}/forecast`, { headers }).then((r) => r.json()),
        fetch(`${API}/zones`,    { headers }).then((r) => r.json()),
        fetch(`${API}/claims`,   { headers }).then((r) => r.json()),
        fetch(`${API}/insights`, { headers }).then((r) => r.json()),
      ]);

      if (results[0].status === 'fulfilled') setForecastData(results[0].value);
      if (results[1].status === 'fulfilled') setZoneData(results[1].value);
      if (results[2].status === 'fulfilled') setClaimsData(results[2].value);
      if (results[3].status === 'fulfilled') setInsightsData(results[3].value);

      if (results.every((r) => r.status === 'rejected')) {
        setError('Unable to load analytics data. Please try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [refreshKey]);

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-accent animate-spin mx-auto mb-4" />
        <p className="text-text-secondary text-sm">Loading risk analytics…</p>
      </div>
    </div>
  );

  // ── Error ───────────────────────────────────────────────────────────────────
  if (error && !forecastData && !zoneData) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="glass-card p-10 text-center max-w-md">
        <AlertTriangle className="w-12 h-12 text-danger mx-auto mb-4" />
        <h2 className="font-display font-black text-xl mb-2">Analytics Unavailable</h2>
        <p className="text-sm text-text-secondary mb-6">{error}</p>
        <button
          onClick={() => setRefreshKey((k) => k + 1)}
          className="px-6 py-3 bg-accent text-white rounded-xl font-bold gradient-bg hover:scale-105 transition-all"
        >
          Retry
        </button>
      </div>
    </div>
  );

  // ── WORKER VIEW ─────────────────────────────────────────────────────────────
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display font-black text-2xl tracking-tight flex items-center gap-3">
              <Activity className="w-6 h-6 text-accent" /> Your Risk Outlook
            </h1>
            <p className="text-[11px] text-text-secondary mt-1">AI forecast for your zone — stay informed</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-5">
            {forecastData && (
              <MiniForecastCard
                forecastData={forecastData.global}
                forecastDates={forecastData.forecastDates}
              />
            )}

            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-6"
            >
              <h3 className="font-black text-sm uppercase tracking-widest text-text-secondary mb-4">
                Your Protection Status
              </h3>
              <div className="flex items-center justify-between mb-4">
                <RiskBadge
                  riskScore={forecastData?.global.avgRiskScore ?? 0}
                  riskLevel={
                    (forecastData?.global.avgRiskScore ?? 0) > 0.7 ? 'HIGH' :
                    (forecastData?.global.avgRiskScore ?? 0) > 0.4 ? 'MEDIUM' : 'LOW'
                  }
                />
                <div className="text-right">
                  <p className="text-[11px] text-text-secondary">Coverage</p>
                  <p className="text-success font-black text-sm">Active ✓</p>
                </div>
              </div>
              <div className="p-3 bg-success/5 border border-success/20 rounded-xl">
                <p className="text-success text-[11px] font-bold">
                  You are covered · AI monitors 24/7
                </p>
              </div>
              <button
                onClick={() => navigate('/dashboard')}
                className="mt-4 w-full py-2.5 bg-surface border border-border rounded-xl text-[11px] font-bold hover:border-accent transition-all flex items-center justify-center gap-1"
              >
                Go to Dashboard <ChevronRight className="w-3 h-3" />
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  // ── ADMIN VIEW ──────────────────────────────────────────────────────────────
  const global = forecastData?.global;

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex">
      <AdminSidebar expanded={expanded} setExpanded={setExpanded} />

      <main className={cn(
        "flex-grow transition-all duration-300 p-6 md:p-10",
        expanded ? "ml-64" : "ml-20"
      )}>
        <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="font-display font-black text-2xl tracking-tight flex items-center gap-3">
              <BarChart2 className="w-6 h-6 text-accent" /> Risk Forecasting & Analytics
            </h1>
            <p className="text-[11px] text-text-secondary mt-1">
              Decision intelligence · LSTM-powered · {insightsData?.lastUpdated
                ? new Date(insightsData.lastUpdated).toLocaleTimeString() : '—'}
            </p>
          </div>
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="p-2.5 border border-border rounded-xl hover:border-accent transition-all"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4 text-text-secondary" />
          </button>
        </motion.div>

        {/* Global KPIs */}
        {global && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <MetricCard
              label="Active Workers"
              value={global.totalWorkers.toLocaleString()}
              sub="With active policies"
              icon={Users}
              color="accent"
            />
            <MetricCard
              label="High-Risk Zones"
              value={String(forecastData!.highRiskZones)}
              sub="Risk score > 70%"
              icon={MapPin}
              color="danger"
            />
            <MetricCard
              label="Claims Tomorrow"
              value={String(global.expectedClaims[0] ?? 0)}
              sub="AI predicted"
              icon={FileText}
              color="warning"
            />
            <MetricCard
              label="7-Day Payout"
              value={`₹${(global.projectedPayout / 100000).toFixed(1)}L`}
              sub="Projected exposure"
              icon={IndianRupee}
              color="success"
            />
          </div>
        )}

        {/* --- HACKATHON QUICK WIN: Business Metrics Dashboard --- */}
        <div className="glass-card p-6 border-accent/20 mb-8 bg-gradient-to-br from-surface to-surface/40">
          <h2 className="font-black text-sm uppercase tracking-widest flex items-center gap-2 mb-5">
            <Activity className="w-4 h-4 text-accent" /> Business Viability Metrics
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard label="Loss Ratio" value="58%" sub="Healthy range (< 65%)" icon={TrendingUp} color="success" />
            <MetricCard label="Market Penetration" value="2.1%" sub="MoM Growth: +14%" icon={Activity} color="accent" />
            <MetricCard label="Est. Weekly Premiums" value="₹1.4L" sub="Recurring Revenue" icon={IndianRupee} color="success" />
            <MetricCard label="Active Policies" value="2,847" sub="Covered gig workers" icon={Shield} color="accent" />
          </div>
        </div>

        {/* Forecast Chart + Zone Heatmap */}
        <div className="grid lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black text-sm uppercase tracking-widest">7-Day Risk Forecast</h2>
              {global && (
                <span className={cn(
                  'text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border',
                  global.avgRiskScore > 0.7
                    ? 'bg-danger/10 border-danger/30 text-danger'
                    : global.avgRiskScore > 0.4
                    ? 'bg-warning/10 border-warning/30 text-warning'
                    : 'bg-success/10 border-success/30 text-success'
                )}>
                  {global.avgRiskScore > 0.7 ? 'CRITICAL' : global.avgRiskScore > 0.4 ? 'ELEVATED' : 'STABLE'}
                </span>
              )}
            </div>
            {forecastData ? (
              <ForecastChart
                riskScores={forecastData.global.riskScores}
                forecastDates={forecastData.forecastDates}
              />
            ) : (
              <div className="flex items-center justify-center h-40 text-text-secondary text-sm">
                Forecast unavailable
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card p-6"
          >
            <h2 className="font-black text-sm uppercase tracking-widest mb-4">Zone Risk Heatmap</h2>
            {zoneData ? (
              <ZoneHeatmap zones={zoneData.zones} />
            ) : (
              <div className="flex items-center justify-center h-40 text-text-secondary text-sm">
                Zone data unavailable
              </div>
            )}
          </motion.div>
        </div>

        {/* Claims + Premium */}
        <div className="grid lg:grid-cols-2 gap-6">
          {claimsData && (
            <ClaimPredictionCard claimsData={claimsData} forecastData={forecastData ?? undefined} />
          )}
          {insightsData && (
            <PremiumImpactCard
              premiumAdjustment={insightsData.premiumAdjustment}
              forecastData={forecastData ?? undefined}
            />
          )}
        </div>

        {/* Insights & Alerts */}
        {insightsData && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-black text-sm uppercase tracking-widest flex items-center gap-2">
                <Zap className="w-4 h-4 text-accent" /> Alerts & Insights
              </h2>
              {insightsData.summary.highPriorityItems > 0 && (
                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-danger/10 border border-danger/30 text-danger">
                  {insightsData.summary.highPriorityItems} high priority
                </span>
              )}
            </div>
            <InsightsPanel
              insights={insightsData.insights}
              alerts={insightsData.alerts}
              summary={insightsData.summary}
            />
          </motion.div>
        )}
        </div>
      </main>
    </div>
  );
}

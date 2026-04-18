import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  BarChart2, AlertTriangle, TrendingUp, ChevronRight,
  Zap, Users, Activity, Radio, ShieldAlert,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SummaryData {
  totalWorkers: number;
  recentClaims: number;
  highRiskZones: number;
  riskIndicator: number;
  riskLabel: 'LOW' | 'MEDIUM' | 'HIGH';
  activeAlerts: number;
  latestAlert: string | null;
  lastUpdated: string;
}

const RISK_CFG = {
  LOW:    {
    barFrom: '#10B981', barTo: '#34D399',
    glow: '0 0 32px 4px rgba(16,185,129,0.25)',
    badge: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300',
    dot: 'bg-emerald-400',
    label: 'LOW RISK',
    orb: 'rgba(16,185,129,0.15)',
  },
  MEDIUM: {
    barFrom: '#F59E0B', barTo: '#FBBF24',
    glow: '0 0 32px 4px rgba(245,158,11,0.25)',
    badge: 'bg-amber-500/20 border-amber-500/40 text-amber-300',
    dot: 'bg-amber-400',
    label: 'MODERATE',
    orb: 'rgba(245,158,11,0.15)',
  },
  HIGH:   {
    barFrom: '#EF4444', barTo: '#F87171',
    glow: '0 0 32px 4px rgba(239,68,68,0.30)',
    badge: 'bg-red-500/20 border-red-500/40 text-red-300',
    dot: 'bg-red-400',
    label: 'HIGH RISK',
    orb: 'rgba(239,68,68,0.15)',
  },
};

const STATS = (d: SummaryData) => [
  {
    label: 'Workers',
    value: d.totalWorkers.toLocaleString(),
    icon: Users,
    sub: 'Active now',
    tileGrad: 'from-blue-900/60 to-blue-800/30',
    border: 'border-blue-500/25',
    iconColor: 'text-blue-400',
    numColor: 'text-blue-200',
    glowColor: 'rgba(59,130,246,0.15)',
  },
  {
    label: 'Claims',
    value: String(d.recentClaims),
    icon: TrendingUp,
    sub: 'Last 7 days',
    tileGrad: 'from-amber-900/60 to-amber-800/30',
    border: 'border-amber-500/25',
    iconColor: 'text-amber-400',
    numColor: 'text-amber-200',
    glowColor: 'rgba(245,158,11,0.15)',
  },
  {
    label: 'Risk Zones',
    value: String(d.highRiskZones),
    icon: ShieldAlert,
    sub: 'High risk tier',
    tileGrad: 'from-red-900/60 to-red-800/30',
    border: 'border-red-500/25',
    iconColor: 'text-red-400',
    numColor: 'text-red-200',
    glowColor: 'rgba(239,68,68,0.15)',
  },
  {
    label: 'Alerts',
    value: String(d.activeAlerts),
    icon: Zap,
    sub: 'Live triggers',
    tileGrad: 'from-violet-900/60 to-violet-800/30',
    border: 'border-violet-500/25',
    iconColor: 'text-violet-400',
    numColor: 'text-violet-200',
    glowColor: 'rgba(139,92,246,0.15)',
  },
];

// ── Shimmer skeleton ──────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="relative rounded-2xl overflow-hidden p-6 space-y-4"
      style={{ background: 'linear-gradient(135deg, #111827 0%, #0F172A 100%)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-white/8 animate-pulse" />
        <div className="h-4 w-20 rounded bg-white/8 animate-pulse" />
        <div className="ml-auto h-6 w-24 rounded-full bg-white/8 animate-pulse" />
      </div>
      <div className="h-2 w-full rounded-full bg-white/8 animate-pulse" />
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-white/5 animate-pulse" />
        ))}
      </div>
      <div className="h-11 rounded-xl bg-white/8 animate-pulse" />
    </div>
  );
}

export default function RiskSummaryWidget() {
  const navigate  = useNavigate();
  const [data,    setData]    = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/analytics/summary`, { headers })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  if (loading) return <Skeleton />;
  if (error || !data) return null;

  const cfg   = RISK_CFG[data.riskLabel];
  const stats = STATS(data);
  const pct   = Math.max(Math.round(data.riskIndicator * 100), 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, type: 'spring', stiffness: 100 }}
      className="relative rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #111827 0%, #0F172A 100%)',
        border: '1px solid rgba(255,255,255,0.09)',
        boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
      }}
    >
      {/* ── Ambient glow orb (risk-coloured) ─────────────────────────────── */}
      <div
        className="absolute -top-20 -right-20 w-56 h-56 rounded-full blur-3xl pointer-events-none"
        style={{ background: cfg.orb }}
      />
      <div
        className="absolute -bottom-16 -left-16 w-44 h-44 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'rgba(99,102,241,0.10)' }}
      />

      <div className="relative p-6 space-y-5">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Live pulse indicator */}
            <span className="relative flex h-2.5 w-2.5">
              <span className={cn('animate-ping absolute inline-flex h-full w-full rounded-full opacity-60', cfg.dot)} />
              <span className={cn('relative inline-flex rounded-full h-2.5 w-2.5', cfg.dot)} />
            </span>
            <BarChart2 className="w-4 h-4 text-white/40" />
            <span className="font-black text-white text-sm tracking-widest uppercase">Risk Pulse</span>
          </div>

          {/* Risk badge */}
          <motion.span
            key={data.riskLabel}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest',
              cfg.badge
            )}
          >
            <Activity className="w-2.5 h-2.5" />
            {cfg.label}
          </motion.span>
        </div>

        {/* ── Risk progress bar ───────────────────────────────────────────── */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-white/35 uppercase tracking-widest font-semibold">Global Risk Index</span>
            <span className="text-[11px] font-mono font-black text-white/70">{pct}%</span>
          </div>
          <div className="h-2 bg-white/8 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              style={{
                height: '100%',
                borderRadius: '999px',
                background: `linear-gradient(90deg, ${cfg.barFrom}, ${cfg.barTo})`,
                boxShadow: cfg.glow,
              }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-white/20 font-medium">
            <span>Safe</span><span>Moderate</span><span>Critical</span>
          </div>
        </div>

        {/* ── 4 stat tiles ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-2.5">
          {stats.map(({ label, value, icon: Icon, sub, tileGrad, border, iconColor, numColor, glowColor }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * i + 0.25, type: 'spring', stiffness: 150 }}
              whileHover={{ scale: 1.04, transition: { duration: 0.15 } }}
              className={cn(
                'p-4 rounded-xl border bg-gradient-to-br relative overflow-hidden cursor-default',
                tileGrad, border
              )}
              style={{ boxShadow: `0 4px 20px ${glowColor}` }}
            >
              <div className="flex items-start justify-between mb-2">
                <Icon className={cn('w-4 h-4', iconColor)} />
                <div className={cn('w-1.5 h-1.5 rounded-full mt-0.5', iconColor.replace('text-', 'bg-'))} />
              </div>
              <div className={cn('font-mono font-black text-2xl leading-none', numColor)}>{value}</div>
              <div className="text-[9px] text-white/30 uppercase tracking-widest mt-1 font-semibold">{label}</div>
              <div className="text-[9px] text-white/20 mt-0.5">{sub}</div>
            </motion.div>
          ))}
        </div>

        {/* ── Alert banner ────────────────────────────────────────────────── */}
        <AnimatePresence>
          {data.latestAlert && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2.5 p-3.5 rounded-xl overflow-hidden"
              style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)' }}
            >
              <span className="relative shrink-0">
                <Radio className="w-3.5 h-3.5 text-red-400" />
                <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-30" />
              </span>
              <div>
                <div className="text-[9px] text-red-400 uppercase tracking-widest font-black mb-0.5">Live Alert</div>
                <p className="text-[11px] text-red-200 font-semibold leading-snug">{data.latestAlert}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── CTA button ──────────────────────────────────────────────────── */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/admin/analytics')}
          className="w-full py-3 rounded-xl font-black text-[12px] flex items-center justify-center gap-2 text-white relative overflow-hidden uppercase tracking-widest"
          style={{
            background: 'linear-gradient(135deg, #FF5500 0%, #FF8800 100%)',
            boxShadow: '0 8px 24px rgba(255,85,0,0.35)',
          }}
        >
          {/* Shimmer sweep */}
          <motion.span
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
            initial={{ x: '-200%' }}
            animate={{ x: '200%' }}
            transition={{ repeat: Infinity, repeatDelay: 2.5, duration: 0.7, ease: 'easeInOut' }}
          />
          <BarChart2 className="w-4 h-4 relative z-10" />
          <span className="relative z-10">Open Full Analytics</span>
          <ChevronRight className="w-4 h-4 relative z-10" />
        </motion.button>

        {/* ── Timestamp ─────────────────────────────────────────────────── */}
        <p className="text-center text-[9px] text-white/15 font-mono">
          ⟳ {new Date(data.lastUpdated).toLocaleTimeString()}
        </p>

      </div>
    </motion.div>
  );
}

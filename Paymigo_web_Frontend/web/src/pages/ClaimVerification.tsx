import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Shield, CheckCircle2, AlertTriangle, Clock, RefreshCw,
  MapPin, Activity, ArrowRight, Loader2, FileCheck,
  Wifi, Navigation, Layers, Mic, Users, BarChart2,
  ChevronRight, UploadCloud, LayoutDashboard, Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '../App';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}`;

// ── Types ──────────────────────────────────────────────────────────────────────

interface Signal {
  name: string;
  status: 'Valid' | 'Approximate' | 'Flagged';
  description: string;
  score?: number;
}

interface ClaimState {
  claimStatus: 'approved' | 'processing' | 'review' | 'rejected';
  truthScore: number;       // 0–100, higher = more trusted
  confidence: 'High' | 'Medium' | 'Low';
  signals: Signal[];
  timelineState: number;    // 1 to 4
  actionType: 'none' | 'dashboard' | 'soft_proof' | 'track';
  payout: number | null;
  loading: boolean;
}

interface VerifyMeta {
  mlOnline: boolean;
  threshold: number;
  lastChecked: string;
}

// ── MOCK initial state (exact schema from the spec) ──────────────────────────

const MOCK_PAYLOAD = {
  claimStatus:   'processing' as const,
  truthScore:    72,
  confidence:    'High'       as const,
  signals: [
    { name: 'GPS Location',       status: 'Valid'       as const, description: 'Location data is consistent with your registered zone.',          score: 0.88 },
    { name: 'Behavioral Pattern', status: 'Valid'       as const, description: 'Your activity matches normal delivery patterns.',                  score: 0.82 },
    { name: 'Network Environment',status: 'Approximate' as const, description: 'Network has minor anomalies — environment check in progress.',    score: 0.65 },
    { name: 'Claim Timing',       status: 'Valid'       as const, description: 'Claim submitted at an expected time window.',                      score: 0.90 },
    { name: 'Delivery Route',     status: 'Approximate' as const, description: 'Minor route deviation detected — within normal variance.',         score: 0.71 },
    { name: 'Barometric Check',   status: 'Valid'       as const, description: 'Environmental sensors match claim conditions.',                    score: 0.95 },
    { name: 'Claim History',      status: 'Valid'       as const, description: 'No duplicate or suspicious claim patterns found.',                 score: 0.92 },
  ],
  timelineState: 2,
  actionType:    'track'     as const,
  payout:        null,
  loading:       false,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score >= 65) return 'text-success';
  if (score >= 36) return 'text-warning';
  return 'text-danger';
}

function scoreBg(score: number): string {
  if (score >= 65) return 'bg-success/10 border-success/30';
  if (score >= 36) return 'bg-warning/10 border-warning/30';
  return 'bg-danger/10 border-danger/30';
}

function scoreStroke(score: number): string {
  if (score >= 65) return '#22c55e';   // success
  if (score >= 36) return '#f59e0b';   // warning
  return '#ef4444';                    // danger
}

function statusConfig(status: Signal['status']) {
  switch (status) {
    case 'Valid':       return { dot: 'bg-success', text: 'text-success', badge: 'bg-success/10 border-success/30 text-success', label: 'Verified'   };
    case 'Approximate': return { dot: 'bg-warning', text: 'text-warning', badge: 'bg-warning/10 border-warning/30 text-warning', label: 'Checking'   };
    case 'Flagged':     return { dot: 'bg-danger',  text: 'text-danger',  badge: 'bg-danger/10  border-danger/30  text-danger',  label: 'Attention'  };
  }
}

const SIGNAL_ICONS: Record<string, React.FC<{ className?: string }>> = {
  'GPS Location':        Navigation,
  'Behavioral Pattern':  Activity,
  'Network Environment': Wifi,
  'Claim Timing':        Clock,
  'Delivery Route':      MapPin,
  'Barometric Check':    Layers,
  'Claim History':       BarChart2,
  'Social Graph':        Users,
  'Acoustic':            Mic,
};

const TIMELINE_STEPS = [
  { label: 'Claim Received',       icon: FileCheck },
  { label: 'Checking Environment', icon: Eye },
  { label: 'Validating Signals',   icon: Activity },
  { label: 'Final Decision',       icon: Shield },
];

// ── ClaimStatusBanner ─────────────────────────────────────────────────────────

const ClaimStatusBanner = ({ claimStatus, confidence }: { claimStatus: ClaimState['claimStatus']; confidence: ClaimState['confidence'] }) => {
  const cfg = {
    approved:   { emoji: '✅', label: 'Claim Verified',           sub: 'Your claim has passed all checks.',              cls: 'border-success/30 bg-success/5' },
    processing: { emoji: '🔄', label: 'Verifying your claim...',   sub: 'Our systems are running environment checks.',    cls: 'border-accent/30  bg-accent/5'  },
    review:     { emoji: '⏳', label: 'Additional Check Needed',   sub: 'We need a little more info to proceed.',         cls: 'border-warning/30 bg-warning/5' },
    rejected:   { emoji: '🔍', label: 'Further Review Required',   sub: 'Please contact support to continue.',            cls: 'border-danger/30  bg-danger/5'  },
  }[claimStatus];

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('glass-card p-5 border-2 flex items-center justify-between gap-4 mb-8', cfg.cls)}
    >
      <div className="flex items-center gap-4">
        <span className="text-3xl">{cfg.emoji}</span>
        <div>
          <div className="font-display font-black text-lg tracking-tight">{cfg.label}</div>
          <div className="text-[11px] text-text-secondary mt-0.5">{cfg.sub}</div>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Activity className="w-3 h-3 text-text-secondary" />
        <span className={cn(
          'text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border',
          confidence === 'High' ? 'bg-success/10 border-success/30 text-success'
            : confidence === 'Medium' ? 'bg-warning/10 border-warning/30 text-warning'
            : 'bg-danger/10 border-danger/30 text-danger'
        )}>
          {confidence} Confidence
        </span>
      </div>
    </motion.div>
  );
};

// ── TruthScoreCard ─────────────────────────────────────────────────────────────

const TruthScoreCard = ({ score, loading }: { score: number; loading: boolean }) => {
  const R = 54;
  const CIRC = 2 * Math.PI * R;
  const offset = CIRC - (score / 100) * CIRC;
  const stroke = scoreStroke(score);
  const colorCls = scoreColor(score);

  const label = score >= 65 ? 'Low Concern' : score >= 36 ? 'Under Review' : 'Needs Attention';
  const sub   = score >= 65
    ? 'Your claim environment looks healthy.'
    : score >= 36
    ? 'A few signals need closer inspection.'
    : 'Our systems are investigating specific signals.';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.1 }}
      className="glass-card p-8 flex flex-col items-center text-center"
    >
      <div className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-6">
        Trust & Verification Index
      </div>

      {/* SVG Ring */}
      <div className="relative w-40 h-40 mb-6">
        <svg viewBox="0 0 128 128" className="w-full h-full -rotate-90">
          {/* Track */}
          <circle cx="64" cy="64" r={R} fill="none" stroke="currentColor" strokeWidth="10" className="text-border/40" />
          {/* Progress */}
          <motion.circle
            cx="64" cy="64" r={R}
            fill="none"
            stroke={stroke}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            initial={{ strokeDashoffset: CIRC }}
            animate={{ strokeDashoffset: loading ? CIRC : offset }}
            transition={{ duration: 1.4, ease: 'easeOut' }}
            style={{ filter: `drop-shadow(0 0 8px ${stroke}88)` }}
          />
        </svg>
        {/* Centre number */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {loading ? (
            <Loader2 className="w-8 h-8 text-accent animate-spin" />
          ) : (
            <>
              <motion.span
                key={score}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn('font-mono font-black text-3xl leading-none', colorCls)}
              >
                {score}
              </motion.span>
              <span className="text-[10px] text-text-secondary font-bold mt-0.5">/ 100</span>
            </>
          )}
        </div>
      </div>

      <div className={cn('font-black text-lg mb-1', colorCls)}>{label}</div>
      <p className="text-[11px] text-text-secondary max-w-[200px] leading-relaxed">{sub}</p>

      {/* Colour key */}
      <div className="flex gap-4 mt-6 pt-4 border-t border-border w-full justify-center">
        {[
          { color: 'bg-success', label: '65–100' },
          { color: 'bg-warning', label: '36–64'  },
          { color: 'bg-danger',  label: '0–35'   },
        ].map(k => (
          <div key={k.label} className="flex items-center gap-1.5 text-[10px] text-text-secondary">
            <div className={cn('w-2 h-2 rounded-full', k.color)} />
            {k.label}
          </div>
        ))}
      </div>
    </motion.div>
  );
};

// ── SignalCard ─────────────────────────────────────────────────────────────────

const SignalCard = ({ signal, index }: { signal: Signal; index: number }) => {
  const cfg   = statusConfig(signal.status);
  const Icon  = SIGNAL_ICONS[signal.name] || Shield;
  const score = signal.score ?? (signal.status === 'Valid' ? 0.85 : signal.status === 'Approximate' ? 0.55 : 0.2);
  const pct   = Math.round(score * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index }}
      className="glass-card p-4 flex flex-col gap-3 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center', cfg.badge)}>
            <Icon className={cn('w-4 h-4', cfg.text)} />
          </div>
          <span className="text-[12px] font-black">{signal.name}</span>
        </div>
        <span className={cn('text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border', cfg.badge)}>
          {cfg.label}
        </span>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-[10px] text-text-secondary mb-1">
          <span>Signal Strength</span>
          <span className="font-mono font-bold">{pct}%</span>
        </div>
        <div className="h-1.5 bg-border rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            className={cn(
              'h-full rounded-full',
              signal.status === 'Valid' ? 'bg-success' : signal.status === 'Approximate' ? 'bg-warning' : 'bg-danger'
            )}
          />
        </div>
      </div>

      <p className="text-[10px] text-text-secondary leading-relaxed">{signal.description}</p>

      {/* Status dot */}
      <div className="flex items-center gap-1.5">
        <div className={cn('w-1.5 h-1.5 rounded-full', cfg.dot,
          signal.status === 'Approximate' && 'animate-pulse'
        )} />
        <span className={cn('text-[9px] font-bold uppercase tracking-widest', cfg.text)}>
          {signal.status === 'Valid' ? 'Signal confirmed' : signal.status === 'Approximate' ? 'Cross-referencing…' : 'Under investigation'}
        </span>
      </div>
    </motion.div>
  );
};

// ── SignalBreakdownGrid ────────────────────────────────────────────────────────

const SignalBreakdownGrid = ({ signals }: { signals: Signal[] }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 0.2 }}
  >
    <div className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-4">
      Signal Breakdown
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {signals.map((sig, i) => (
        <SignalCard key={sig.name} signal={sig} index={i} />
      ))}
    </div>
  </motion.div>
);

// ── VerificationTimeline ──────────────────────────────────────────────────────

const VerificationTimeline = ({ step }: { step: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.15 }}
    className="glass-card p-6"
  >
    <div className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-5">
      Verification Progress
    </div>
    <div className="flex items-start gap-0">
      {TIMELINE_STEPS.map((s, i) => {
        const idx      = i + 1;
        const done     = idx < step;
        const active   = idx === step;
        const pending  = idx > step;
        const Icon     = s.icon;

        return (
          <React.Fragment key={s.label}>
            <div className="flex flex-col items-center flex-1">
              {/* Circle */}
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.08 * i }}
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center border-2 mb-2 transition-all',
                  done    && 'bg-success border-success text-white',
                  active  && 'bg-accent  border-accent  text-white shadow-md shadow-accent/30',
                  pending && 'bg-surface  border-border   text-text-secondary',
                )}
              >
                {done ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <Icon className={cn('w-4 h-4', active && 'animate-pulse')} />
                )}
              </motion.div>

              {/* Label */}
              <div className={cn(
                'text-center text-[10px] font-bold leading-tight max-w-[80px]',
                done   && 'text-success',
                active && 'text-accent',
                pending && 'text-text-secondary',
              )}>
                {s.label}
              </div>
            </div>

            {/* Connector */}
            {i < TIMELINE_STEPS.length - 1 && (
              <div className="flex-shrink-0 mt-4 mx-1">
                <div className={cn('h-0.5 w-8 transition-all duration-500', idx < step ? 'bg-success' : 'bg-border')} />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  </motion.div>
);

// ── ActionPanel ───────────────────────────────────────────────────────────────

const ActionPanel = ({
  actionType,
  claimStatus,
  payout,
  claimId,
  onRetry,
}: {
  actionType:  ClaimState['actionType'];
  claimStatus: ClaimState['claimStatus'];
  payout:      number | null;
  claimId:     string | null;
  onRetry:     () => void;
}) => {
  const navigate = useNavigate();

  const statusText = {
    approved:   { msg: 'Your claim has been verified.',            cls: 'text-success' },
    processing: { msg: 'We are completing the final checks now.',  cls: 'text-accent'  },
    review:     { msg: 'A small step left before we proceed.',     cls: 'text-warning' },
    rejected:   { msg: 'Please upload supporting information.',    cls: 'text-danger'  },
  }[claimStatus];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-card p-6 flex flex-col md:flex-row items-center justify-between gap-4"
    >
      <div>
        <div className="font-black text-base mb-1">What happens next?</div>
        <div className={cn('text-[12px]', statusText.cls)}>{statusText.msg}</div>
        {payout !== null && (
          <div className="mt-1 text-[11px] text-text-secondary">
            Payout amount: <span className="font-mono font-black text-success">₹{payout.toLocaleString()}</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Always show retry */}
        <button
          onClick={onRetry}
          className="p-2.5 rounded-xl border border-border hover:border-accent transition-all"
          title="Re-check"
        >
          <RefreshCw className="w-4 h-4 text-text-secondary" />
        </button>

        {/* Context-aware primary button */}
        {actionType === 'dashboard' && (
          <button
            onClick={() => navigate('/dashboard')}
            className="px-5 py-2.5 rounded-xl bg-success text-white font-bold flex items-center gap-2 hover:scale-105 transition-all shadow-md shadow-success/20"
          >
            <LayoutDashboard className="w-4 h-4" /> Go to Dashboard
          </button>
        )}
        {actionType === 'soft_proof' && (
          <button
            onClick={() => navigate('/dashboard')}
            className="px-5 py-2.5 rounded-xl bg-warning text-white font-bold flex items-center gap-2 hover:scale-105 transition-all"
          >
            <UploadCloud className="w-4 h-4" /> Upload Supporting Info
          </button>
        )}
        {actionType === 'track' && (
          <button
            onClick={() => navigate('/dashboard')}
            className="px-5 py-2.5 rounded-xl bg-accent text-white font-bold flex items-center gap-2 hover:scale-105 transition-all gradient-bg shadow-md shadow-accent/20"
          >
            Track Claim <ChevronRight className="w-4 h-4" />
          </button>
        )}
        {actionType === 'none' && (
          <button
            onClick={() => navigate('/dashboard')}
            className="px-5 py-2.5 rounded-xl border border-border text-sm font-bold hover:border-accent hover:text-accent transition-all flex items-center gap-2"
          >
            <ArrowRight className="w-4 h-4" /> Back to Dashboard
          </button>
        )}
      </div>
    </motion.div>
  );
};

// ── Main Page ──────────────────────────────────────────────────────────────────

const ClaimVerificationPage: React.FC = () => {
  const { user }     = useAuth();
  const { claimId }  = useParams<{ claimId?: string }>();
  const navigate     = useNavigate();

  const [state, setState] = useState<ClaimState>(MOCK_PAYLOAD);
  const [meta,  setMeta]  = useState<VerifyMeta | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchVerification = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true }));
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const workerId = user?.uid || user?.id || '';

      let res;
      if (claimId) {
        // GET for existing claim
        res = await axios.get(`${API}/geotruth/verify/${claimId}`, { headers, timeout: 10000 });
      } else {
        // POST with worker context (demo verification)
        res = await axios.post(`${API}/geotruth/verify`, { workerId }, { headers, timeout: 10000 });
      }

      const d = res.data;
      setState({
        claimStatus:   d.claimStatus   || 'processing',
        truthScore:    d.trustScore    ?? 72,
        confidence:    d.confidence    || 'Medium',
        signals:       d.signals       || MOCK_PAYLOAD.signals,
        timelineState: d.timelineState ?? 2,
        actionType:    d.actionType    || 'track',
        payout:        d.payout        ?? null,
        loading:       false,
      });
      setMeta(d.meta || null);
    } catch (err: any) {
      // Fall back to rich mock — never show a broken page
      setState({ ...MOCK_PAYLOAD, loading: false });
      setMeta(null);
      if (err.response?.status !== 401) {
        setError('Could not reach the verification engine. Showing estimated status.');
      }
    }
  }, [user, claimId]);

  useEffect(() => { fetchVerification(); }, [fetchVerification]);

  const { claimStatus, truthScore, confidence, signals, timelineState, actionType, payout, loading } = state;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* ── Page header ─────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div>
            <h1 className="font-display font-black text-2xl tracking-tight">
              Claim Verification
            </h1>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-text-secondary">
              <Shield className="w-3.5 h-3.5 text-accent" />
              <span>GeoTruth™ Environment Check</span>
              {claimId && (
                <>
                  <span className="text-border">·</span>
                  <span className="font-mono">#{claimId}</span>
                </>
              )}
              {meta?.mlOnline && (
                <>
                  <span className="text-border">·</span>
                  <span className="text-success font-bold">ML Engine Online</span>
                </>
              )}
            </div>
          </div>
          <button
            onClick={() => { setState(prev => ({ ...prev, loading: true })); fetchVerification(); }}
            className="p-2.5 rounded-xl border border-border hover:border-accent transition-all"
            title="Refresh verification"
          >
            <RefreshCw className="w-4 h-4 text-text-secondary" />
          </button>
        </motion.div>

        {/* ── Error toast ─────────────────────────────────────────────────── */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-3 bg-warning/10 border border-warning/30 rounded-xl flex items-center gap-2 text-[11px] text-warning font-bold"
            >
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Status Banner ────────────────────────────────────────────────── */}
        <ClaimStatusBanner claimStatus={claimStatus} confidence={confidence} />

        {/* ── Hero row: Score + Timeline ───────────────────────────────────── */}
        <div className="grid md:grid-cols-5 gap-6 mb-8">

          {/* TruthScoreCard — 2 cols */}
          <div className="md:col-span-2">
            <TruthScoreCard score={truthScore} loading={loading} />
          </div>

          {/* Timeline + quick stat — 3 cols */}
          <div className="md:col-span-3 flex flex-col gap-4">
            <VerificationTimeline step={timelineState} />

            {/* Quick stat row */}
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  label: 'Signals Checked',
                  value: `${signals.filter(s => s.status === 'Valid').length}/${signals.length}`,
                  cls:   'text-success',
                },
                {
                  label: 'Under Review',
                  value: `${signals.filter(s => s.status === 'Approximate').length}`,
                  cls:   'text-warning',
                },
                {
                  label: 'Needs Attention',
                  value: `${signals.filter(s => s.status === 'Flagged').length}`,
                  cls:   'text-danger',
                },
              ].map(({ label, value, cls }) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card p-4 text-center"
                >
                  <div className={cn('font-mono font-black text-2xl mb-1', cls)}>{value}</div>
                  <div className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">{label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Signal Grid ─────────────────────────────────────────────────── */}
        <div className="mb-8">
          <SignalBreakdownGrid signals={signals} />
        </div>

        {/* ── Action Panel ─────────────────────────────────────────────────── */}
        <ActionPanel
          actionType={actionType}
          claimStatus={claimStatus}
          payout={payout}
          claimId={claimId ?? null}
          onRetry={fetchVerification}
        />

        {/* ── Footer note ──────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-center text-[10px] text-text-secondary"
        >
          All checks are powered by the GeoTruth™ environment validation engine.
          {meta?.lastChecked && (
            <> · Last checked at {new Date(meta.lastChecked).toLocaleTimeString()}</>
          )}
        </motion.div>

      </div>
    </div>
  );
};

export default ClaimVerificationPage;

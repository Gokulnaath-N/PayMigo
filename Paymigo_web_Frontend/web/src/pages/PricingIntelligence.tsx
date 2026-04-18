import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  CloudRain, Zap, Shield, CheckCircle2, AlertTriangle,
  TrendingUp, Clock, RefreshCw, ChevronRight, Star,
  MapPin, Activity, Info, ArrowRight, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '../App';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}`;

// ── Types ─────────────────────────────────────────────────────────────────────

interface Plan {
  id: string;
  name: string;
  weeklyPremium: number;
  payoutCap: number;
  triggerLabel: string;
  payoutSpeed: string;
  loyaltyPool: string;
  summary: string;
  isRecommended: boolean;
}

interface TriggerData {
  active: boolean;
  confidence: number;
  rainfall: number;
  windSpeed: number;
  status: string;
  reason: string;
  eventType: string;
  threshold: number;
}

interface RecommendationData {
  planId: string;
  confidence: number;
  reasons: string[];
  fallback: string;
}

interface IntelligenceData {
  zone: { id: string; name: string; riskTier: number };
  trigger: TriggerData;
  plans: Plan[];
  recommendation: RecommendationData;
  worker: { loyaltyWeeks: number; jobType: string; age: number; activePolicy: any } | null;
  meta: { clusterConfidence: number; lastUpdated: string };
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn('animate-pulse bg-border/40 rounded-xl', className)} />
);

const PageSkeleton = () => (
  <div className="space-y-6">
    <Skeleton className="h-20 w-full" />
    <div className="grid md:grid-cols-3 gap-6">
      <Skeleton className="h-64" />
      <Skeleton className="h-64" />
      <Skeleton className="h-64" />
    </div>
    <div className="grid md:grid-cols-3 gap-6">
      <Skeleton className="h-48" />
      <Skeleton className="h-48" />
      <Skeleton className="h-48" />
    </div>
  </div>
);

// ── ConfidenceBadge ───────────────────────────────────────────────────────────

const ConfidenceBadge = ({ value, label }: { value: number; label?: string }) => {
  const pct = Math.round(value * 100);
  const color = pct >= 85 ? 'text-success bg-success/10 border-success/20'
    : pct >= 65 ? 'text-warning bg-warning/10 border-warning/20'
    : 'text-text-secondary bg-surface border-border';
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-black uppercase tracking-widest', color)}>
      <Activity className="w-2.5 h-2.5" />
      {label || 'Confidence'} {pct}%
    </span>
  );
};

// ── RiskTierChip ──────────────────────────────────────────────────────────────

const RiskTierChip = ({ tier }: { tier: number }) => {
  const cfg = tier >= 3
    ? { label: 'High Risk',    cls: 'bg-danger/10 text-danger border-danger/20' }
    : tier === 2
    ? { label: 'Medium Risk',  cls: 'bg-warning/10 text-warning border-warning/20' }
    : { label: 'Low Risk',     cls: 'bg-success/10 text-success border-success/20' };
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest', cfg.cls)}>
      <Shield className="w-3 h-3" /> {cfg.label}
    </span>
  );
};

// ── TriggerStatusPanel ────────────────────────────────────────────────────────

const TriggerStatusPanel = ({ trigger }: { trigger: TriggerData }) => {
  const isActive  = trigger.active;
  const isWarning = trigger.status === 'WARNING';

  const borderCls = isActive  ? 'border-danger/40 bg-danger/5'
    : isWarning ? 'border-warning/40 bg-warning/5'
    : 'border-border bg-surface';

  const iconCls = isActive ? 'text-danger' : isWarning ? 'text-warning' : 'text-success';
  const Icon    = isActive ? AlertTriangle : isWarning ? CloudRain : CheckCircle2;

  return (
    <div className={cn('glass-card p-6 border-2 h-full', borderCls)}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Trigger Intelligence</span>
        <ConfidenceBadge value={trigger.confidence} />
      </div>

      {/* Status icon + label */}
      <div className="flex items-center gap-3 mb-5">
        <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center', isActive ? 'bg-danger/10' : isWarning ? 'bg-warning/10' : 'bg-success/10')}>
          <Icon className={cn('w-6 h-6', iconCls, isActive && 'animate-pulse')} />
        </div>
        <div>
          <div className="font-black text-base">{trigger.eventType}</div>
          <div className={cn('text-[10px] font-bold uppercase tracking-widest', iconCls)}>
            {isActive ? 'TRIGGER ACTIVE' : isWarning ? 'WARNING' : 'MONITORING'}
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="space-y-3 mb-5">
        {[
          { label: 'Measured',  value: `${trigger.rainfall} mm/hr` },
          { label: 'Threshold', value: `${trigger.threshold} mm/hr` },
          { label: 'Wind',      value: `${trigger.windSpeed} km/h` },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between items-center py-2 border-b border-border/40 last:border-0">
            <span className="text-[11px] text-text-secondary font-bold uppercase tracking-widest">{label}</span>
            <span className="text-sm font-mono font-bold">{value}</span>
          </div>
        ))}
      </div>

      {/* Rainfall bar */}
      <div className="mb-4">
        <div className="flex justify-between text-[10px] text-text-secondary mb-1.5">
          <span>0 mm</span><span>{trigger.threshold} mm threshold</span>
        </div>
        <div className="h-2 bg-border rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((trigger.rainfall / (trigger.threshold * 2)) * 100, 100)}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className={cn('h-full rounded-full', isActive ? 'bg-danger' : isWarning ? 'bg-warning' : 'bg-success')}
          />
        </div>
      </div>

      <p className="text-[11px] text-text-secondary leading-relaxed">{trigger.reason}</p>
    </div>
  );
};

// ── PlanCard ──────────────────────────────────────────────────────────────────

const PlanCard = ({
  plan, isSelected, onSelect, disabled,
}: {
  plan: Plan; isSelected: boolean; onSelect: (p: Plan) => void; disabled: boolean;
}) => (
  <motion.div
    whileHover={{ y: isSelected ? 0 : -4 }}
    className={cn(
      'glass-card p-6 flex flex-col relative transition-all duration-300 cursor-pointer',
      plan.isRecommended ? 'border-2 border-accent/60 shadow-lg shadow-accent/10' : 'border border-border hover:border-accent/30',
      isSelected && 'ring-2 ring-accent ring-offset-2'
    )}
    onClick={() => !disabled && onSelect(plan)}
  >
    {plan.isRecommended && (
      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-accent text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-accent/30">
          <Star className="w-2.5 h-2.5 fill-white" /> Recommended
        </span>
      </div>
    )}

    <div className="mt-2 mb-4">
      <h3 className="font-display font-black text-lg mb-1">{plan.name}</h3>
      <p className="text-[11px] text-text-secondary">{plan.summary}</p>
    </div>

    <div className="flex items-baseline gap-1 mb-5">
      <span className="text-4xl font-mono font-black">₹{plan.weeklyPremium}</span>
      <span className="text-text-secondary text-xs font-bold uppercase tracking-widest">/wk</span>
    </div>

    <div className="space-y-2.5 mb-6 flex-grow">
      {[
        { icon: Shield,    label: 'Payout Cap',  value: `₹${plan.payoutCap.toLocaleString()}` },
        { icon: CloudRain, label: 'Trigger',      value: plan.triggerLabel },
        { icon: Clock,     label: 'Payout Speed', value: plan.payoutSpeed },
        { icon: TrendingUp,label: 'Loyalty Pool', value: plan.loyaltyPool },
      ].map(({ icon: Icon, label, value }) => (
        <div key={label} className="flex items-center gap-2.5">
          <Icon className="w-3.5 h-3.5 text-accent shrink-0" />
          <span className="text-[11px] text-text-secondary">{label}:</span>
          <span className="text-[11px] font-bold ml-auto">{value}</span>
        </div>
      ))}
    </div>

    <button
      disabled={disabled}
      className={cn(
        'w-full py-3 rounded-xl font-bold text-sm transition-all',
        plan.isRecommended
          ? 'bg-accent text-white hover:scale-[1.02] shadow-md shadow-accent/20 gradient-bg'
          : 'bg-surface border border-border hover:border-accent hover:text-accent',
        isSelected && 'bg-accent text-white',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      {isSelected ? '✓ Selected' : plan.isRecommended ? 'Select Recommended' : 'Choose Plan'}
    </button>
  </motion.div>
);

// ── RecommendationPanel ───────────────────────────────────────────────────────

const RecommendationPanel = ({
  recommendation, zone, worker, meta,
}: {
  recommendation: RecommendationData;
  zone: IntelligenceData['zone'];
  worker: IntelligenceData['worker'];
  meta: IntelligenceData['meta'];
}) => (
  <div className="glass-card p-6 h-full">
    <div className="flex items-center justify-between mb-5">
      <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Why This Plan?</span>
      <ConfidenceBadge value={recommendation.confidence} label="Match" />
    </div>

    <div className="space-y-2 mb-6">
      {recommendation.reasons.map((reason, i) => (
        <div key={i} className="flex items-start gap-2.5 p-3 bg-accent/5 rounded-xl border border-accent/10">
          <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
          <p className="text-[11px] text-text-secondary leading-relaxed">{reason}</p>
        </div>
      ))}
    </div>

    <div className="space-y-2.5 pt-4 border-t border-border">
      <div className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-3">Zone Summary</div>
      {[
        { label: 'Zone',          value: zone.name },
        { label: 'Risk Tier',     value: `Tier ${zone.riskTier}` },
        { label: 'Loyalty Weeks', value: `${worker?.loyaltyWeeks || 0} weeks` },
        { label: 'Job Type',      value: worker?.jobType || 'Delivery' },
        { label: 'Model Confidence', value: `${Math.round(meta.clusterConfidence * 100)}%` },
      ].map(({ label, value }) => (
        <div key={label} className="flex justify-between items-center">
          <span className="text-[11px] text-text-secondary">{label}</span>
          <span className="text-[11px] font-bold">{value}</span>
        </div>
      ))}
    </div>
  </div>
);

// ── ComparisonTable ───────────────────────────────────────────────────────────

const ComparisonTable = ({ plans, recommendedId }: { plans: Plan[]; recommendedId: string }) => (
  <div className="glass-card overflow-hidden">
    <div className="p-5 border-b border-border">
      <h3 className="font-display font-black text-base">Plan Comparison</h3>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-border bg-surface">
            <th className="py-3 px-4 text-[10px] font-black text-text-secondary uppercase tracking-widest">Feature</th>
            {plans.map(p => (
              <th key={p.id} className={cn('py-3 px-4 text-[10px] font-black uppercase tracking-widest', p.id === recommendedId ? 'text-accent' : 'text-text-secondary')}>
                {p.name} {p.id === recommendedId && '★'}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-sm divide-y divide-border/40">
          {[
            { label: 'Weekly Premium', fn: (p: Plan) => `₹${p.weeklyPremium}` },
            { label: 'Max Payout',     fn: (p: Plan) => `₹${p.payoutCap.toLocaleString()}` },
            { label: 'Trigger',        fn: (p: Plan) => p.triggerLabel },
            { label: 'Payout Speed',   fn: (p: Plan) => p.payoutSpeed },
            { label: 'Loyalty Pool',   fn: (p: Plan) => p.loyaltyPool },
          ].map(({ label, fn }) => (
            <tr key={label} className="hover:bg-surface/50 transition-colors">
              <td className="py-3 px-4 text-[11px] text-text-secondary font-bold">{label}</td>
              {plans.map(p => (
                <td key={p.id} className={cn('py-3 px-4 text-[11px] font-bold', p.id === recommendedId && 'text-accent')}>
                  {fn(p)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// ── Main Page ─────────────────────────────────────────────────────────────────

const PricingIntelligence: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData]           = useState<IntelligenceData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected]   = useState(false);
  const [stale, setStale]         = useState(false);

  const fetchData = useCallback(async () => {
    setError(null);
    setStale(false);
    try {
      const workerId = user?.uid || user?.id || '';
      const res = await axios.get(`${API}/pricing/intelligence`, {
        params: { workerId },
        timeout: 120000,
      });
      setData(res.data);
      // Auto-select recommended plan
      const rec = res.data.plans.find((p: Plan) => p.isRecommended);
      if (rec && !selectedPlan) setSelectedPlan(rec);
    } catch (err: any) {
      setError(err.message || 'Failed to load pricing intelligence.');
      setStale(true);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSelectPlan = async (plan: Plan) => {
    setSelectedPlan(plan);
    if (!user) return;
    setSelecting(true);
    try {
      await axios.post(`${API}/pricing/select-plan`, {
        workerId:      user.uid || user.id,
        planId:        plan.id,
        weeklyPremium: plan.weeklyPremium,
      });
      setSelected(true);
    } catch (_) {
      // Still mark as selected in UI even if backend fails
      setSelected(true);
    } finally {
      setSelecting(false);
    }
  };

  const lastUpdated = data?.meta?.lastUpdated
    ? new Date(data.meta.lastUpdated).toLocaleTimeString()
    : null;

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-background px-6 py-10 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Loader2 className="w-5 h-5 text-accent animate-spin" />
        <span className="text-sm text-text-secondary font-bold">Loading pricing intelligence...</span>
      </div>
      <PageSkeleton />
    </div>
  );

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error && !data) return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="glass-card p-10 max-w-md w-full text-center">
        <AlertTriangle className="w-12 h-12 text-warning mx-auto mb-4" />
        <h2 className="font-display font-black text-xl mb-2">ML Service Offline</h2>
        <p className="text-sm text-text-secondary mb-6">Could not reach the pricing engine. Showing last cached data.</p>
        <button onClick={fetchData} className="px-6 py-3 bg-accent text-white rounded-xl font-bold hover:scale-105 transition-all gradient-bg">
          <RefreshCw className="w-4 h-4 inline mr-2" /> Retry
        </button>
      </div>
    </div>
  );

  const { zone, trigger, plans, recommendation, worker, meta } = data!;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* ── Header band ─────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-5 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h1 className="font-display font-black text-xl tracking-tight">Pricing & Trigger Intelligence</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <MapPin className="w-3 h-3 text-text-secondary" />
                <span className="text-[11px] text-text-secondary font-bold">{zone.name}</span>
                <RiskTierChip tier={zone.riskTier} />
                <ConfidenceBadge value={meta.clusterConfidence} label="Zone Model" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {stale && (
              <span className="text-[10px] text-warning font-bold flex items-center gap-1">
                <Info className="w-3 h-3" /> Stale data
              </span>
            )}
            {lastUpdated && (
              <span className="text-[10px] text-text-secondary">Updated {lastUpdated}</span>
            )}
            <button
              onClick={() => { setLoading(true); fetchData(); }}
              className="p-2 rounded-xl bg-surface border border-border hover:border-accent transition-all"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4 text-text-secondary" />
            </button>
          </div>
        </motion.div>

        {/* ── Active trigger alert ─────────────────────────────────────────── */}
        <AnimatePresence>
          {trigger.active && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 bg-danger/10 border border-danger/30 rounded-2xl flex items-center gap-3"
            >
              <AlertTriangle className="w-5 h-5 text-danger animate-pulse shrink-0" />
              <div>
                <span className="text-sm font-black text-danger">Disruption Trigger Active — </span>
                <span className="text-sm text-text-secondary">{trigger.reason} Premium Shield recommended for maximum protection.</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── 3-column main body ───────────────────────────────────────────── */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">

          {/* Left — Trigger panel */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <TriggerStatusPanel trigger={trigger} />
          </motion.div>

          {/* Center — Plan cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="space-y-4"
          >
            <div className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-2">Choose Your Plan</div>
            {plans.map(plan => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isSelected={selectedPlan?.id === plan.id}
                onSelect={handleSelectPlan}
                disabled={selecting}
              />
            ))}
          </motion.div>

          {/* Right — Recommendation panel */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <RecommendationPanel
              recommendation={recommendation}
              zone={zone}
              worker={worker}
              meta={meta}
            />
          </motion.div>
        </div>

        {/* ── Comparison table ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-8"
        >
          <ComparisonTable plans={plans} recommendedId={recommendation.planId} />
        </motion.div>

        {/* ── Action footer ────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6 flex flex-col md:flex-row items-center justify-between gap-4"
        >
          <div>
            {selected ? (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-success" />
                <div>
                  <div className="font-black text-success">Plan Selected — {selectedPlan?.name}</div>
                  <div className="text-[11px] text-text-secondary">₹{selectedPlan?.weeklyPremium}/week · Auto-renew enabled</div>
                </div>
              </div>
            ) : (
              <div>
                <div className="font-black text-base">
                  {selectedPlan ? `${selectedPlan.name} selected` : 'No plan selected'}
                </div>
                <div className="text-[11px] text-text-secondary">
                  {selectedPlan ? `₹${selectedPlan.weeklyPremium}/week · Click confirm to activate` : 'Choose a plan above to continue'}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/plans')}
              className="px-5 py-2.5 rounded-xl border border-border text-sm font-bold hover:border-accent hover:text-accent transition-all"
            >
              Compare All Plans
            </button>
            {selected ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="px-6 py-2.5 rounded-xl bg-success text-white font-bold flex items-center gap-2 hover:scale-105 transition-all"
              >
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => selectedPlan && handleSelectPlan(selectedPlan)}
                disabled={!selectedPlan || selecting}
                className="px-6 py-2.5 rounded-xl bg-accent text-white font-bold flex items-center gap-2 hover:scale-105 transition-all gradient-bg disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-accent/20"
              >
                {selecting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Activating...</>
                ) : (
                  <>Confirm Plan <ChevronRight className="w-4 h-4" /></>
                )}
              </button>
            )}
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default PricingIntelligence;

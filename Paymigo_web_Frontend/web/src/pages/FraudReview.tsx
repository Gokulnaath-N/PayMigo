import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import axios from 'axios';
import {
  Shield, AlertTriangle, CheckCircle2, XCircle, Clock,
  Search, Filter, RefreshCw, Navigation, Activity, Wifi,
  BarChart2, Users, ChevronRight, Loader2, Eye,
  Flag, FileSearch, UploadCloud, MessageSquare, X,
  TrendingUp, MapPin, User, IndianRupee, Zap
} from 'lucide-react';
import { isAdminUser, cn } from '@/lib/utils';
import AdminSidebar from '../components/admin/AdminSidebar';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}`;

// ── Types ─────────────────────────────────────────────────────────────────────

interface ClaimRow {
  id: string;
  workerId: string;
  workerName: string;
  zone: string;
  type: string;
  amount: number;
  status: string;
  fraudScore: number;
  spoofProb: number;
  trustScore: number;
  riskLevel: string;
  color: string;
  decision: string;
  createdAt: string;
}

interface FraudSignal {
  category: string;
  icon: string;
  score: number;
  flags: string[];
  status: 'FLAGGED' | 'WARNING' | 'CLEAR';
}

interface ClaimDetail {
  claim: {
    id: string; workerId: string; workerName: string; zone: string;
    type: string; amount: number; status: string;
    description: string; statement: string; createdAt: string;
  };
  fraud: {
    fraudScore: number; spoofProb: number; trustScore: number;
    riskLevel: string; color: string; decision: string;
    mlOnline: boolean; threshold: number; signals: FraudSignal[];
  };
  existingDecision: any;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const SIGNAL_ICONS: Record<string, React.FC<{ className?: string }>> = {
  Navigation, Activity, Wifi, BarChart2, Clock, Users,
};

function riskColor(color: string) {
  if (color === 'red')    return 'text-danger';
  if (color === 'yellow') return 'text-warning';
  return 'text-success';
}

function riskBg(color: string) {
  if (color === 'red')    return 'bg-danger/10 border-danger/30';
  if (color === 'yellow') return 'bg-warning/10 border-warning/30';
  return 'bg-success/10 border-success/30';
}

function rowBorder(color: string) {
  if (color === 'red')    return 'border-l-danger';
  if (color === 'yellow') return 'border-l-warning';
  return 'border-l-success';
}

function signalStatusCfg(status: FraudSignal['status']) {
  if (status === 'FLAGGED') return { cls: 'bg-danger/10 border-danger/30 text-danger',   dot: 'bg-danger',  label: 'Flagged'  };
  if (status === 'WARNING') return { cls: 'bg-warning/10 border-warning/30 text-warning', dot: 'bg-warning', label: 'Warning'  };
  return                           { cls: 'bg-success/10 border-success/30 text-success', dot: 'bg-success', label: 'Clear'    };
}

const ScorePill = ({ score, label }: { score: number; label: string }) => {
  const pct = Math.round(score * 100);
  const cls = pct >= 70 ? 'bg-danger/10 text-danger border-danger/20'
    : pct >= 40 ? 'bg-warning/10 text-warning border-warning/20'
    : 'bg-success/10 text-success border-success/20';
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-black', cls)}>
      {label} {pct}%
    </span>
  );
};

// ── FraudSignalCard ───────────────────────────────────────────────────────────

const FraudSignalCard = ({ signal }: { signal: FraudSignal }) => {
  const cfg  = signalStatusCfg(signal.status);
  const Icon = SIGNAL_ICONS[signal.icon] || Shield;
  const pct  = Math.round(signal.score * 100);

  return (
    <div className={cn('glass-card p-4 border', cfg.cls)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className={cn('w-4 h-4', cfg.cls.split(' ').find(c => c.startsWith('text-')))} />
          <span className="font-black text-[12px]">{signal.category}</span>
        </div>
        <span className={cn('text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border', cfg.cls)}>
          {cfg.label}
        </span>
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-[10px] text-text-secondary mb-1">
          <span>Risk Score</span>
          <span className="font-mono font-bold">{pct}%</span>
        </div>
        <div className="h-1.5 bg-border rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={cn('h-full rounded-full',
              signal.status === 'FLAGGED' ? 'bg-danger' :
              signal.status === 'WARNING' ? 'bg-warning' : 'bg-success'
            )}
          />
        </div>
      </div>

      {signal.flags.length > 0 ? (
        <ul className="space-y-1">
          {signal.flags.map((f, i) => (
            <li key={i} className="flex items-center gap-1.5 text-[10px] text-text-secondary">
              <XCircle className="w-3 h-3 text-danger shrink-0" /> {f}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[10px] text-success flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> No issues detected
        </p>
      )}
    </div>
  );
};

// ── ActionModal ───────────────────────────────────────────────────────────────

const ACTIONS = [
  { id: 'APPROVE',       label: 'Approve Claim',      icon: CheckCircle2, cls: 'bg-success text-white hover:scale-105 shadow-success/20' },
  { id: 'REQUEST_PROOF', label: 'Request Proof',       icon: UploadCloud,  cls: 'bg-warning text-white hover:scale-105 shadow-warning/20' },
  { id: 'REJECT',        label: 'Reject Claim',        icon: XCircle,      cls: 'bg-danger text-white hover:scale-105 shadow-danger/20'   },
  { id: 'DEEP_REVIEW',   label: 'Send to Deep Review', icon: FileSearch,   cls: 'bg-surface border border-border hover:border-accent hover:text-accent' },
  { id: 'FLAG_WORKER',   label: 'Flag Worker',         icon: Flag,         cls: 'bg-surface border border-danger/30 text-danger hover:bg-danger/10' },
];

const ActionModal = ({
  claimId, onClose, onDone,
}: { claimId: string; onClose: () => void; onDone: () => void }) => {
  const [selected, setSelected] = useState('');
  const [notes, setNotes]       = useState('');
  const [flagWorker, setFlagWorker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]       = useState('');
  const token = localStorage.getItem('token');

  const submit = async () => {
    if (!selected) { setError('Select a decision.'); return; }
    setSubmitting(true);
    try {
      await axios.post(`${API}/fraud/decision`, {
        claimId, decision: selected, notes, flagWorker,
      }, { headers: { Authorization: `Bearer ${token}` } });
      onDone();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to submit decision.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-card p-8 w-full max-w-md shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display font-black text-lg">Take Action</h3>
          <button onClick={onClose} className="p-1 hover:bg-surface rounded-lg transition-colors">
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2 mb-5">
          {ACTIONS.map(a => {
            const Icon = a.icon;
            return (
              <button
                key={a.id}
                onClick={() => setSelected(a.id)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all shadow-md',
                  a.cls,
                  selected === a.id && 'ring-2 ring-offset-2 ring-accent'
                )}
              >
                <Icon className="w-4 h-4" /> {a.label}
                {selected === a.id && <CheckCircle2 className="w-4 h-4 ml-auto" />}
              </button>
            );
          })}
        </div>

        <div className="mb-4">
          <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-2 block">
            Reason / Notes
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Add reason for this decision..."
            className="w-full h-20 text-sm p-3 bg-surface border border-border rounded-xl outline-none focus:border-accent resize-none"
          />
        </div>

        <label className="flex items-center gap-2 mb-5 cursor-pointer">
          <input type="checkbox" checked={flagWorker} onChange={e => setFlagWorker(e.target.checked)}
            className="w-4 h-4 rounded border-border text-accent" />
          <span className="text-[11px] font-bold text-text-secondary">Also flag this worker account</span>
        </label>

        {error && <p className="text-[11px] text-danger font-bold mb-3">{error}</p>}

        <button
          onClick={submit}
          disabled={!selected || submitting}
          className="w-full py-3 bg-accent text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-all gradient-bg disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-accent/20"
        >
          {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <>Confirm Decision <ChevronRight className="w-4 h-4" /></>}
        </button>
      </motion.div>
    </div>
  );
};

// ── Main Admin Fraud Review Page ──────────────────────────────────────────────

const FraudReview: React.FC = () => {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const isAdmin    = isAdminUser(user?.email);
  const token      = localStorage.getItem('token');
  const headers    = { Authorization: `Bearer ${token}` };

  const [claims, setClaims]           = useState<ClaimRow[]>([]);
  const [detail, setDetail]           = useState<ClaimDetail | null>(null);
  const [loading, setLoading]         = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedId, setSelectedId]   = useState<string | null>(null);
  const [showModal, setShowModal]     = useState(false);
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [riskFilter, setRiskFilter]   = useState('ALL');
  const [expanded, setExpanded]       = useState(true);

  const fetchClaims = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/fraud/claims`, {
        headers,
        params: { status: statusFilter !== 'ALL' ? statusFilter : undefined },
      });
      setClaims(res.data.claims || []);
    } catch {
      setClaims([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const fetchDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    setDetail(null);
    try {
      const res = await axios.get(`${API}/fraud/claims/${id}`, { headers });
      setDetail(res.data);
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => { fetchClaims(); }, [fetchClaims]);

  const handleRowClick = (id: string) => {
    setSelectedId(id);
    fetchDetail(id);
  };

  const handleDecisionDone = () => {
    setShowModal(false);
    setSelectedId(null);
    setDetail(null);
    fetchClaims();
  };

  const filtered = claims.filter(c => {
    const matchSearch = c.workerName.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      c.zone.toLowerCase().includes(search.toLowerCase());
    const matchRisk = riskFilter === 'ALL' || c.riskLevel === riskFilter;
    return matchSearch && matchRisk;
  });

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-10 text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-danger mx-auto mb-4" />
          <h2 className="font-display font-black text-xl mb-2">Access Denied</h2>
          <p className="text-sm text-text-secondary mb-6">Admin privileges required.</p>
          <button onClick={() => navigate('/')} className="px-6 py-3 bg-accent text-white rounded-xl font-bold gradient-bg">
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex">
      <AdminSidebar expanded={expanded} setExpanded={setExpanded} />

      <main className={cn(
        "flex-grow transition-all duration-300 p-6 md:p-10",
        expanded ? "ml-64" : "ml-20"
      )}>
        <div className="max-w-7xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display font-black text-3xl tracking-tight flex items-center gap-3">
                <Shield className="w-8 h-8 text-accent" /> Fraud Investigation
              </h1>
              <p className="text-sm text-text-secondary mt-1">GeoTruth 7-layer signal analysis & decision intelligence.</p>
            </div>
            <button 
              onClick={fetchClaims} 
              disabled={loading}
              className="p-3.5 rounded-xl border border-white/10 hover:border-accent transition-all bg-white/5 active:scale-95"
            >
              <RefreshCw className={cn("w-5 h-5 text-text-secondary", loading && "animate-spin")} />
            </button>
          </div>
        </motion.div>

        {/* Filters */}
        <div className="glass-card p-4 mb-6 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="text" placeholder="Search worker, claim ID, zone..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-surface border border-border rounded-xl outline-none focus:border-accent"
            />
          </div>
          <div className="flex gap-2">
            {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={cn('px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all',
                  statusFilter === s ? 'bg-accent text-white' : 'bg-surface border border-border text-text-secondary hover:border-accent'
                )}>
                {s}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(r => (
              <button key={r} onClick={() => setRiskFilter(r)}
                className={cn('px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all',
                  riskFilter === r ? 'bg-accent text-white' : 'bg-surface border border-border text-text-secondary hover:border-accent'
                )}>
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Main grid */}
        <div className="grid lg:grid-cols-5 gap-6">

          {/* Claims Table — left 2 cols */}
          <div className="lg:col-span-2 space-y-2">
            <div className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-3">
              Suspicious Claims ({filtered.length})
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 text-accent animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="glass-card p-10 text-center">
                <Filter className="w-8 h-8 text-border mx-auto mb-3" />
                <p className="text-sm text-text-secondary">No claims match your filters.</p>
              </div>
            ) : (
              filtered.map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => handleRowClick(c.id)}
                  className={cn(
                    'glass-card p-4 cursor-pointer border-l-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200',
                    rowBorder(c.color),
                    selectedId === c.id && 'ring-2 ring-accent'
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-black text-[12px]">{c.workerName}</div>
                      <div className="text-[10px] text-text-secondary flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5" /> {c.zone}
                      </div>
                    </div>
                    <span className={cn('text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border', riskBg(c.color), riskColor(c.color))}>
                      {c.riskLevel}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <ScorePill score={c.fraudScore} label="Fraud" />
                    <ScorePill score={c.spoofProb}  label="Spoof" />
                    <span className="text-[10px] text-text-secondary ml-auto font-mono">
                      ₹{c.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className={cn('text-[9px] font-black uppercase tracking-widest',
                      c.status === 'APPROVED' ? 'text-success' : c.status === 'REJECTED' ? 'text-danger' : 'text-warning'
                    )}>
                      {c.status}
                    </span>
                    <span className="text-[9px] text-text-secondary">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Detail Panel — right 3 cols */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              {detailLoading ? (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="glass-card p-20 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-accent animate-spin" />
                </motion.div>
              ) : detail ? (
                <motion.div key={detail.claim.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                  className="space-y-4">

                  {/* Claim info */}
                  <div className="glass-card p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="font-display font-black text-lg">{detail.claim.workerName}</div>
                        <div className="text-[11px] text-text-secondary flex items-center gap-2 mt-0.5">
                          <MapPin className="w-3 h-3" /> {detail.claim.zone}
                          <span className="text-border">·</span>
                          <span className="font-mono">#{detail.claim.id.slice(0, 8)}</span>
                        </div>
                      </div>
                      <div className={cn('px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest', riskBg(detail.fraud.color), riskColor(detail.fraud.color))}>
                        {detail.fraud.riskLevel} Risk
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {[
                        { label: 'Fraud Score', value: `${Math.round(detail.fraud.fraudScore * 100)}%`, cls: riskColor(detail.fraud.color) },
                        { label: 'Spoof Prob',  value: `${Math.round(detail.fraud.spoofProb  * 100)}%`, cls: detail.fraud.spoofProb > 0.5 ? 'text-danger' : 'text-success' },
                        { label: 'Trust Score', value: `${detail.fraud.trustScore}`,                    cls: detail.fraud.trustScore > 60 ? 'text-success' : 'text-danger' },
                      ].map(({ label, value, cls }) => (
                        <div key={label} className="glass-card p-3 text-center">
                          <div className={cn('font-mono font-black text-xl', cls)}>{value}</div>
                          <div className="text-[10px] text-text-secondary uppercase tracking-widest">{label}</div>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-[11px]">
                      <div className="p-3 bg-surface rounded-xl">
                        <div className="text-[10px] text-text-secondary uppercase tracking-widest mb-1">Claim Type</div>
                        <div className="font-bold">{detail.claim.type}</div>
                      </div>
                      <div className="p-3 bg-surface rounded-xl">
                        <div className="text-[10px] text-text-secondary uppercase tracking-widest mb-1">Amount</div>
                        <div className="font-bold text-accent flex items-center gap-1">
                          <IndianRupee className="w-3 h-3" />{detail.claim.amount.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {detail.claim.description && (
                      <div className="mt-3 p-3 bg-surface rounded-xl">
                        <div className="text-[10px] text-text-secondary uppercase tracking-widest mb-1">Description</div>
                        <p className="text-[11px] text-text-secondary leading-relaxed">{detail.claim.description}</p>
                      </div>
                    )}

                    {/* AI Decision suggestion */}
                    <div className={cn('mt-3 p-3 rounded-xl border flex items-center gap-2', riskBg(detail.fraud.color))}>
                      <Zap className={cn('w-4 h-4 shrink-0', riskColor(detail.fraud.color))} />
                      <div>
                        <span className={cn('text-[10px] font-black uppercase tracking-widest', riskColor(detail.fraud.color))}>
                          AI Suggests: {detail.fraud.decision}
                        </span>
                        {!detail.fraud.mlOnline && (
                          <span className="text-[10px] text-text-secondary ml-2">(ML offline — rule-based)</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Fraud Signal Grid */}
                  <div>
                    <div className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-3">
                      Fraud Signal Breakdown
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {detail.fraud.signals.map(sig => (
                        <FraudSignalCard key={sig.category} signal={sig} />
                      ))}
                    </div>
                  </div>

                  {/* Action button */}
                  {detail.claim.status === 'PENDING' && (
                    <button
                      onClick={() => setShowModal(true)}
                      className="w-full py-3.5 bg-accent text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-[1.01] transition-all gradient-bg shadow-lg shadow-accent/20"
                    >
                      <MessageSquare className="w-4 h-4" /> Take Action on This Claim
                    </button>
                  )}

                  {detail.existingDecision && (
                    <div className="glass-card p-4 border border-success/20 bg-success/5">
                      <div className="text-[10px] font-black text-success uppercase tracking-widest mb-1">Decision Recorded</div>
                      <p className="text-[11px] text-text-secondary">{detail.existingDecision.decision} · {detail.existingDecision.notes || 'No notes'}</p>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="glass-card p-20 text-center flex flex-col items-center justify-center min-h-[400px]">
                  <Eye className="w-10 h-10 text-border mb-4" />
                  <h3 className="font-bold text-text-primary mb-2">Select a Claim</h3>
                  <p className="text-sm text-text-secondary">Click any claim from the list to view fraud signals and take action.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </main>

    {/* Action Modal */}
      <AnimatePresence>
        {showModal && selectedId && (
          <ActionModal
            claimId={selectedId}
            onClose={() => setShowModal(false)}
            onDone={handleDecisionDone}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default FraudReview;

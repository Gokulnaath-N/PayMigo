import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  Clock, CheckCircle2, AlertTriangle, UploadCloud,
  MapPin, Shield, RefreshCw, ChevronRight, Loader2,
  IndianRupee, ArrowRight, LayoutDashboard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '../App';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';

// ── Types ─────────────────────────────────────────────────────────────────────

interface WorkerClaim {
  id: string;
  type: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  description: string;
  createdAt: any;
}

// ── Status config ─────────────────────────────────────────────────────────────

function statusCfg(status: WorkerClaim['status']) {
  switch (status) {
    case 'APPROVED': return {
      emoji: '✅', label: 'Claim Approved',
      sub: 'Your claim has been verified and approved.',
      cls: 'border-success/30 bg-success/5',
      badge: 'bg-success/10 text-success border-success/20',
      steps: [
        { label: 'Claim Received',    done: true  },
        { label: 'Under Review',      done: true  },
        { label: 'Verification Done', done: true  },
        { label: 'Payout Processed',  done: true  },
      ],
    };
    case 'REJECTED': return {
      emoji: '❌', label: 'Claim Not Approved',
      sub: 'Your claim could not be verified at this time.',
      cls: 'border-danger/30 bg-danger/5',
      badge: 'bg-danger/10 text-danger border-danger/20',
      steps: [
        { label: 'Claim Received',    done: true  },
        { label: 'Under Review',      done: true  },
        { label: 'Verification Done', done: true  },
        { label: 'Payout Processed',  done: false },
      ],
    };
    default: return {
      emoji: '⏳', label: 'Under Review',
      sub: 'We are verifying your claim. This usually takes a few minutes.',
      cls: 'border-accent/30 bg-accent/5',
      badge: 'bg-accent/10 text-accent border-accent/20',
      steps: [
        { label: 'Claim Received',    done: true  },
        { label: 'Under Review',      done: true  },
        { label: 'Verification Done', done: false },
        { label: 'Payout Processed',  done: false },
      ],
    };
  }
}

// ── ClaimCard ─────────────────────────────────────────────────────────────────

const ClaimCard = ({ claim, isSelected, onClick }: {
  claim: WorkerClaim; isSelected: boolean; onClick: () => void;
}) => {
  const cfg = statusCfg(claim.status);
  return (
    <motion.div
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={cn(
        'glass-card p-4 cursor-pointer transition-all border-l-4',
        claim.status === 'APPROVED' ? 'border-l-success' :
        claim.status === 'REJECTED' ? 'border-l-danger'  : 'border-l-accent',
        isSelected && 'ring-2 ring-accent'
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{cfg.emoji}</span>
          <div>
            <div className="font-black text-[12px]">{claim.type}</div>
            <div className="text-[10px] text-text-secondary font-mono">#{claim.id.slice(0, 8)}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono font-black text-accent flex items-center gap-0.5">
            <IndianRupee className="w-3 h-3" />{claim.amount.toLocaleString()}
          </div>
          <span className={cn('text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border', cfg.badge)}>
            {claim.status}
          </span>
        </div>
      </div>
      <div className="text-[10px] text-text-secondary">
        {new Date(claim.createdAt?.toDate?.() || claim.createdAt).toLocaleDateString()}
      </div>
    </motion.div>
  );
};

// ── StatusTimeline ────────────────────────────────────────────────────────────

const StatusTimeline = ({ steps }: { steps: { label: string; done: boolean }[] }) => (
  <div className="flex items-start gap-0 w-full">
    {steps.map((s, i) => (
      <React.Fragment key={s.label}>
        <div className="flex flex-col items-center flex-1">
          <div className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center border-2 mb-2 transition-all',
            s.done ? 'bg-success border-success text-white' : 'bg-surface border-border text-text-secondary'
          )}>
            {s.done
              ? <CheckCircle2 className="w-4 h-4" />
              : <Clock className="w-3.5 h-3.5" />
            }
          </div>
          <div className={cn(
            'text-center text-[10px] font-bold leading-tight max-w-[70px]',
            s.done ? 'text-success' : 'text-text-secondary'
          )}>
            {s.label}
          </div>
        </div>
        {i < steps.length - 1 && (
          <div className="flex-shrink-0 mt-3.5 mx-0.5">
            <div className={cn('h-0.5 w-6 transition-all', s.done ? 'bg-success' : 'bg-border')} />
          </div>
        )}
      </React.Fragment>
    ))}
  </div>
);

// ── Main Page ─────────────────────────────────────────────────────────────────

const ClaimStatus: React.FC = () => {
  const { user }   = useAuth();
  const navigate   = useNavigate();

  const [claims, setClaims]         = useState<WorkerClaim[]>([]);
  const [selected, setSelected]     = useState<WorkerClaim | null>(null);
  const [loading, setLoading]       = useState(true);

  // Live Firestore listener
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, 'claims'),
      where('workerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as WorkerClaim));
      setClaims(data);
      if (data.length > 0 && !selected) setSelected(data[0]);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, [user]);

  const cfg = selected ? statusCfg(selected.status) : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="font-display font-black text-2xl tracking-tight flex items-center gap-3">
            <Shield className="w-6 h-6 text-accent" /> My Claims
          </h1>
          <p className="text-[11px] text-text-secondary mt-1">Track the status of your insurance claims</p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-accent animate-spin" />
          </div>
        ) : claims.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="glass-card p-16 text-center">
            <Shield className="w-12 h-12 text-border mx-auto mb-4" />
            <h3 className="font-bold text-lg mb-2">No Claims Yet</h3>
            <p className="text-sm text-text-secondary mb-6">
              Your claims will appear here once a weather trigger activates your policy.
            </p>
            <button onClick={() => navigate('/dashboard')}
              className="px-6 py-3 bg-accent text-white rounded-xl font-bold gradient-bg hover:scale-105 transition-all">
              Go to Dashboard
            </button>
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-5 gap-6">

            {/* Claims list */}
            <div className="md:col-span-2 space-y-3">
              <div className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-3">
                Your Claims ({claims.length})
              </div>
              {claims.map(c => (
                <ClaimCard
                  key={c.id}
                  claim={c}
                  isSelected={selected?.id === c.id}
                  onClick={() => setSelected(c)}
                />
              ))}
            </div>

            {/* Detail */}
            <div className="md:col-span-3">
              <AnimatePresence mode="wait">
                {selected && cfg && (
                  <motion.div
                    key={selected.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    {/* Status banner */}
                    <div className={cn('glass-card p-5 border-2', cfg.cls)}>
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-3xl">{cfg.emoji}</span>
                        <div>
                          <div className="font-display font-black text-lg">{cfg.label}</div>
                          <div className="text-[11px] text-text-secondary">{cfg.sub}</div>
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="flex items-center gap-2 p-3 bg-white/50 rounded-xl mb-4">
                        <IndianRupee className="w-4 h-4 text-accent" />
                        <span className="text-sm font-bold">Claim Amount:</span>
                        <span className="font-mono font-black text-accent text-lg ml-auto">
                          ₹{selected.amount.toLocaleString()}
                        </span>
                      </div>

                      {/* Timeline */}
                      <StatusTimeline steps={cfg.steps} />
                    </div>

                    {/* What this means — NO fraud details exposed */}
                    <div className="glass-card p-5">
                      <div className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-4">
                        What Happens Next
                      </div>
                      {selected.status === 'PENDING' && (
                        <div className="space-y-3">
                          <div className="flex items-start gap-3 p-3 bg-accent/5 rounded-xl border border-accent/10">
                            <Clock className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                            <p className="text-[11px] text-text-secondary leading-relaxed">
                              Our system is running environment checks on your claim. This usually completes within a few minutes.
                            </p>
                          </div>
                          <div className="flex items-start gap-3 p-3 bg-surface rounded-xl border border-border">
                            <Shield className="w-4 h-4 text-text-secondary shrink-0 mt-0.5" />
                            <p className="text-[11px] text-text-secondary leading-relaxed">
                              We verify weather conditions, your location, and policy status automatically — no action needed from you.
                            </p>
                          </div>
                        </div>
                      )}
                      {selected.status === 'APPROVED' && (
                        <div className="flex items-start gap-3 p-3 bg-success/5 rounded-xl border border-success/20">
                          <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                          <p className="text-[11px] text-text-secondary leading-relaxed">
                            Your claim has been approved. ₹{selected.amount.toLocaleString()} has been credited to your GigWallet. Check your wallet for the updated balance.
                          </p>
                        </div>
                      )}
                      {selected.status === 'REJECTED' && (
                        <div className="space-y-3">
                          <div className="flex items-start gap-3 p-3 bg-danger/5 rounded-xl border border-danger/20">
                            <AlertTriangle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
                            <p className="text-[11px] text-text-secondary leading-relaxed">
                              We were unable to verify this claim at this time. If you believe this is incorrect, you can upload supporting proof below.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="glass-card p-5 flex flex-wrap gap-3">
                      {selected.status === 'REJECTED' && (
                        <button className="flex-1 py-3 bg-warning text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-105 transition-all shadow-md shadow-warning/20">
                          <UploadCloud className="w-4 h-4" /> Upload Proof
                        </button>
                      )}
                      {selected.status === 'PENDING' && (
                        <button className="flex-1 py-3 bg-accent/10 text-accent rounded-xl font-bold flex items-center justify-center gap-2 border border-accent/20">
                          <MapPin className="w-4 h-4" /> Enable Location Access
                        </button>
                      )}
                      <button
                        onClick={() => navigate('/dashboard')}
                        className="flex-1 py-3 bg-surface border border-border rounded-xl font-bold flex items-center justify-center gap-2 hover:border-accent hover:text-accent transition-all"
                      >
                        <LayoutDashboard className="w-4 h-4" /> Dashboard
                      </button>
                    </div>

                    {/* Footer note */}
                    <p className="text-center text-[10px] text-text-secondary">
                      All claims are verified by our automated GeoTruth™ system.
                      For support, contact us from the dashboard.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClaimStatus;

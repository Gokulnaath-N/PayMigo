import React from 'react';
import { motion } from 'motion/react';
import { MapPin, AlertTriangle, CheckCircle2, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RiskCardProps {
  zone: string;
  riskLevel: 'high' | 'medium' | 'low';
  riskLabel: string;
  riskMessage: string;
}

const cfg = {
  high:   { icon: AlertTriangle, color: 'text-danger',  bg: 'bg-danger/10  border-danger/30',  dot: 'bg-danger'  },
  medium: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10 border-warning/30', dot: 'bg-warning' },
  low:    { icon: CheckCircle2,  color: 'text-success', bg: 'bg-success/10 border-success/30', dot: 'bg-success' },
};

const RiskCard: React.FC<RiskCardProps> = ({ zone, riskLevel, riskLabel, riskMessage }) => {
  const { icon: Icon, color, bg, dot } = cfg[riskLevel];
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('glass-card p-5 border', bg)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 text-[10px] font-black text-text-secondary uppercase tracking-widest">
          <MapPin className="w-3 h-3" /> Zone
        </div>
        <div className={cn('flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border', bg, color)}>
          <div className={cn('w-1.5 h-1.5 rounded-full', dot, riskLevel === 'high' && 'animate-pulse')} />
          {riskLabel}
        </div>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn('w-5 h-5 shrink-0', color)} />
        <span className="font-display font-black text-base">{zone}</span>
      </div>
      <p className="text-[11px] text-text-secondary leading-relaxed">{riskMessage}</p>
    </motion.div>
  );
};

export default RiskCard;

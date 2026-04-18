import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CloudRain, Zap } from 'lucide-react';

interface TriggerBannerProps {
  active: boolean;
  label: string;
}

const TriggerBanner: React.FC<TriggerBannerProps> = ({ active, label }) => (
  <AnimatePresence>
    {active && (
      <motion.div
        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
        animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
        className="overflow-hidden"
      >
        <div className="p-4 bg-danger/10 border border-danger/40 rounded-2xl flex items-center gap-3">
          <div className="w-9 h-9 bg-danger/20 rounded-xl flex items-center justify-center shrink-0">
            <CloudRain className="w-5 h-5 text-danger animate-pulse" />
          </div>
          <div className="flex-1">
            <div className="text-[11px] font-black text-danger uppercase tracking-widest flex items-center gap-1.5">
              <Zap className="w-3 h-3" /> {label}
            </div>
            <div className="text-[10px] text-text-secondary mt-0.5">
              Claim protection is active — payout will be processed automatically.
            </div>
          </div>
          <div className="w-2 h-2 rounded-full bg-danger animate-ping shrink-0" />
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default TriggerBanner;

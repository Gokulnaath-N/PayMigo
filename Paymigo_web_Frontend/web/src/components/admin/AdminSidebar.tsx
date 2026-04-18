import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShieldAlert, 
  TrendingUp, 
  Cpu, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Bell
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { label: 'Admin Dashboard', icon: LayoutDashboard, path: '/admin' },
  { label: 'Fraud Review',    icon: ShieldAlert,     path: '/admin/fraud-review' },
  { label: 'Risk Analytics',  icon: TrendingUp,      path: '/admin/analytics' },
  { label: 'NLP Alerts',      icon: Bell,            path: '/admin/alerts' },
  { label: 'AI Models',       icon: Cpu,             path: '/ai-models' },
];

export default function AdminSidebar({ expanded, setExpanded }: { expanded: boolean, setExpanded: (v: boolean) => void }) {
  return (
    <aside className={cn(
      "fixed left-0 top-0 h-screen bg-[#0A0A0B] border-r border-white/5 transition-all duration-300 z-50",
      expanded ? "w-64" : "w-20"
    )}>
      <div className="flex flex-col h-full p-4">
        {/* Header / Logo */}
        <div className="flex items-center gap-3 px-2 mb-10 h-10 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shrink-0 shadow-lg shadow-accent/20">
            <ShieldCheck className="w-6 h-6 text-background" />
          </div>
          <span className={cn(
            "font-display font-black text-xl tracking-tighter transition-opacity duration-300",
            expanded ? "opacity-100" : "opacity-0 pointer-events-none"
          )}>
            Paymigo <span className="text-accent underline decoration-2 underline-offset-4">Admin</span>
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-grow space-y-2">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "flex items-center gap-4 px-3 py-3 rounded-xl transition-all group relative",
                isActive 
                  ? "bg-accent text-background font-bold shadow-lg shadow-accent/20" 
                  : "text-text-secondary hover:bg-white/5 hover:text-text-primary"
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span className={cn(
                "whitespace-nowrap transition-opacity duration-300",
                expanded ? "opacity-100" : "opacity-0 pointer-events-none"
              )}>
                {item.label}
              </span>
              
              {!expanded && (
                <div className="absolute left-full ml-6 px-3 py-2 bg-text-primary text-background text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-2xl">
                  {item.label}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer actions */}
        <div className="pt-4 border-t border-white/5 space-y-2">
          <button 
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center gap-4 px-3 py-3 rounded-xl text-text-secondary hover:bg-white/5 transition-all"
          >
            {expanded ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            <span className={cn(
              "whitespace-nowrap transition-opacity",
              expanded ? "opacity-100" : "opacity-0 pointer-events-none"
            )}>
              Collapse Menu
            </span>
          </button>
          
          <button className="w-full flex items-center gap-4 px-3 py-3 rounded-xl text-danger hover:bg-danger/10 transition-all font-bold">
            <LogOut className="w-5 h-5" />
            <span className={cn(
              "whitespace-nowrap transition-opacity",
              expanded ? "opacity-100" : "opacity-0 pointer-events-none"
            )}>
              Logout
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
}

import React from 'react';
import { LayoutDashboard, Users, Bike, GitMerge, FileText, CheckCircle2, ShieldCheck, HelpCircle } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const groups = [
    {
      groupLabel: 'OVERVIEW',
      items: [
        { id: 'overview', label: 'Fleet Overview', icon: LayoutDashboard, badge: 'Summary' }
      ]
    },
    {
      groupLabel: 'INTELLIGENCE',
      items: [
        { id: 'drivers', label: 'Driver Behaviour', icon: Users, badge: '30 Drivers' },
        { id: 'vehicles', label: 'Vehicle Inspection', icon: Bike, badge: '30 Vehicles' },
        { id: 'attribution', label: 'Anomaly Attribution', icon: GitMerge, badge: '77 Trips' }
      ]
    },
    {
      groupLabel: 'UNDERSTAND',
      items: [
        { id: 'methodology', label: 'Methodology & Audit', icon: FileText, badge: 'Guide' }
      ]
    }
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between hidden md:flex min-h-[calc(100vh-65px)]">
      <div className="p-4 space-y-6">
        {groups.map((group, idx) => (
          <div key={idx}>
            <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest px-3 mb-2">
              {group.groupLabel}
            </div>
            <nav className="space-y-1">
              {group.items.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-semibold shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                      <span>{item.label}</span>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-700/50'
                          : 'bg-slate-800/80 text-slate-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        ))}

        {/* Product Purpose Card */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Product Purpose</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Identifies fleet-relative operational signals to help prioritize driver coaching & vehicle inspection. <strong>No fake accident/failure probabilities.</strong>
          </p>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="font-medium text-slate-300">Explainable Signals</span>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">v4.0</span>
      </div>
    </aside>
  );
};

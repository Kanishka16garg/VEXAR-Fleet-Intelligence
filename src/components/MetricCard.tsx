import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  color?: 'cyan' | 'amber' | 'emerald' | 'purple' | 'slate';
  trend?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtext,
  icon: Icon,
  color = 'cyan',
  trend
}) => {
  const colorMap = {
    cyan: {
      bg: 'bg-cyan-950/30',
      border: 'border-cyan-900/40',
      iconBg: 'bg-cyan-900/40 text-cyan-400',
      valueText: 'text-cyan-300'
    },
    amber: {
      bg: 'bg-amber-950/30',
      border: 'border-amber-900/40',
      iconBg: 'bg-amber-900/40 text-amber-400',
      valueText: 'text-amber-300'
    },
    emerald: {
      bg: 'bg-emerald-950/30',
      border: 'border-emerald-900/40',
      iconBg: 'bg-emerald-900/40 text-emerald-400',
      valueText: 'text-emerald-300'
    },
    purple: {
      bg: 'bg-purple-950/30',
      border: 'border-purple-900/40',
      iconBg: 'bg-purple-900/40 text-purple-400',
      valueText: 'text-purple-300'
    },
    slate: {
      bg: 'bg-slate-900/50',
      border: 'border-slate-800',
      iconBg: 'bg-slate-800 text-slate-300',
      valueText: 'text-slate-100'
    }
  };

  const currentTheme = colorMap[color];

  return (
    <div className={`p-4 rounded-xl border ${currentTheme.bg} ${currentTheme.border} transition-all hover:border-slate-700`}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
        <div className={`p-2 rounded-lg ${currentTheme.iconBg}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="mt-2 flex items-baseline justify-between">
        <span className={`text-2xl font-bold tracking-tight font-mono ${currentTheme.valueText}`}>{value}</span>
        {trend && <span className="text-xs text-slate-400 font-medium">{trend}</span>}
      </div>
      {subtext && <p className="mt-1 text-xs text-slate-400 leading-snug">{subtext}</p>}
    </div>
  );
};

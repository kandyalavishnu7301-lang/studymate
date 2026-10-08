import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  className?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  className = '',
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md transition-all duration-300 hover:border-slate-700 hover:bg-slate-900/80 shadow-lg shadow-black/20 ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      {/* Subtle top ambient glow */}
      <div className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-indigo-500/10 blur-2xl" />

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{title}</p>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold tracking-tight text-white">{value}</span>
            {trend && (
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  trend.isPositive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                }`}
              >
                {trend.value}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800/80 border border-slate-700/50 text-indigo-400">
          {icon}
        </div>
      </div>
    </div>
  );
};

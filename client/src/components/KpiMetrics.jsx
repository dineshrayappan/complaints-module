import React from 'react';
import {
  Clock,
  CheckCircle2,
  ClipboardCheck,
  Flame,
  ArrowUpRight,
} from 'lucide-react';

export const KpiMetrics = ({ metrics, onSelectTab }) => {
  const cards = [
    {
      title: 'Active Rectifications',
      value: metrics?.activeTickets ?? 0,
      subtext: 'In Progress & Line Assigned',
      icon: Clock,
      tabKey: 'action-pending',
      iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400',
      badgeText: null,
      borderStyle: 'border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500',
    },
    {
      title: 'Under Verification',
      value: metrics?.underVerification ?? 0,
      subtext: 'After Photo Proof Submitted',
      icon: ClipboardCheck,
      tabKey: 'under-verification',
      iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400',
      badgeText: metrics?.underVerification > 0 ? 'Pending Sign-Off' : null,
      badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
      borderStyle: 'border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500',
    },
    {
      title: 'Overdue SLA Alerts',
      value: metrics?.overdueCount ?? 0,
      subtext: 'Exceeded 12–24h Resolution Window',
      icon: Flame,
      tabKey: 'overdue',
      iconBg: metrics?.overdueCount > 0
        ? 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400'
        : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
      badgeText: metrics?.overdueCount > 0 ? 'CRITICAL' : null,
      badgeColor: 'bg-rose-600 text-white animate-pulse',
      borderStyle: metrics?.overdueCount > 0
        ? 'border-rose-300 dark:border-rose-600 bg-rose-50/40 dark:bg-rose-950/20'
        : 'border-slate-200 dark:border-slate-800',
    },
    {
      title: 'Rectified & Closed',
      value: metrics?.closedTickets ?? 0,
      subtext: 'Auditor Approved & Sealed',
      icon: CheckCircle2,
      tabKey: 'closed',
      iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400',
      badgeText: null,
      borderStyle: 'border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 my-4 sm:my-6">
      {cards.map((card, idx) => {
        const IconComponent = card.icon;
        return (
          <div
            key={idx}
            onClick={() => onSelectTab(card.tabKey)}
            className={`relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 p-3 sm:p-5 border ${card.borderStyle} transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md active:scale-[0.98] group flex flex-col justify-between`}
          >
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl ${card.iconBg} flex items-center justify-center transition-colors shrink-0`}
              >
                <IconComponent className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>

              <div className="flex items-center gap-1.5 ml-auto">
                {card.badgeText && (
                  <span
                    className={`px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider rounded-md shrink-0 ${card.badgeColor}`}
                  >
                    {card.badgeText}
                  </span>
                )}
                <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors" />
              </div>
            </div>

            <div>
              <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-sans">
                {card.value}
              </div>
              <div className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 mt-0.5 truncate">
                {card.title}
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {card.subtext}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KpiMetrics;

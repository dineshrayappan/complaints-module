import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, Flame, CheckCircle2 } from 'lucide-react';
import { calculateSlaStatus } from '../utils/timer';

export const CountdownBadge = ({ deadlineTimestamp, status, compact = false }) => {
  const [sla, setSla] = useState(() => calculateSlaStatus(deadlineTimestamp, status));

  useEffect(() => {
    const timer = setInterval(() => {
      setSla(calculateSlaStatus(deadlineTimestamp, status));
    }, 1000);

    return () => clearInterval(timer);
  }, [deadlineTimestamp, status]);

  if (sla.type === 'CLOSED') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        {compact ? 'Closed' : 'Closed (SLA Fulfilled)'}
      </span>
    );
  }

  if (sla.type === 'OVERDUE') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-50 text-rose-700 border border-rose-300 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-600 animate-overdue-alert shadow-sm">
        <Flame className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
        <span className="tracking-tight font-mono">
          {compact ? `OVERDUE ${sla.timeOnly}` : sla.formattedText}
        </span>
      </span>
    );
  }

  if (sla.type === 'WARNING') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-700 shadow-sm">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
        <span className="font-mono">{compact ? sla.timeOnly : sla.formattedText}</span>
      </span>
    );
  }

  // Normal state (>4h remaining)
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
      <Clock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
      <span className="font-mono">{compact ? sla.timeOnly : sla.formattedText}</span>
    </span>
  );
};

export default CountdownBadge;

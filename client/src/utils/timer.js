/**
 * Real-Time Countdown & SLA Status Calculator
 * Handles 12-24h resolution deadlines, amber warnings (< 4h), and pulsating overdue states.
 */

export const calculateSlaStatus = (deadlineTimestamp, complaintStatus) => {
  if (complaintStatus === 'Closed') {
    return {
      type: 'CLOSED',
      label: 'SLA Fulfilled',
      formattedText: 'Closed',
      isOverdue: false,
      isWarning: false,
      badgeColor: 'emerald',
      rawDiffMs: 0,
    };
  }

  const now = Date.now();
  const deadline = new Date(deadlineTimestamp).getTime();
  const diffMs = deadline - now;

  // OVERDUE: Time has expired
  if (diffMs <= 0) {
    const overdueMs = Math.abs(diffMs);
    const totalSecs = Math.floor(overdueMs / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;

    const formattedTime = hours > 0
      ? `-${hours}h ${minutes}m ${seconds}s`
      : `-${minutes}m ${seconds}s`;

    return {
      type: 'OVERDUE',
      label: 'OVERDUE SLA',
      formattedText: `OVERDUE (${formattedTime})`,
      timeOnly: formattedTime,
      isOverdue: true,
      isWarning: false,
      badgeColor: 'rose',
      rawDiffMs: diffMs,
    };
  }

  // ACTIVE SLA COUNTDOWN
  const totalSecs = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSecs / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const seconds = totalSecs % 60;

  const formattedTime = `${hours}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s remaining`;

  // WARNING: Less than 4 hours remaining
  if (hours < 4) {
    return {
      type: 'WARNING',
      label: 'SLA Critical (< 4h)',
      formattedText: formattedTime,
      timeOnly: `${hours}h ${minutes}m ${seconds}s`,
      isOverdue: false,
      isWarning: true,
      badgeColor: 'amber',
      rawDiffMs: diffMs,
    };
  }

  // NORMAL: More than 4 hours remaining
  return {
    type: 'NORMAL',
    label: 'Within SLA',
    formattedText: formattedTime,
    timeOnly: `${hours}h ${minutes}m ${seconds}s`,
    isOverdue: false,
    isWarning: false,
    badgeColor: 'slate',
    rawDiffMs: diffMs,
  };
};

export const formatAbsoluteTime = (dateInput) => {
  if (!dateInput) return '—';
  const d = new Date(dateInput);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

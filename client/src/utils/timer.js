/**
 * QMS Standards & Decoupled Status Architecture:
 * 1. Workflow Lifecycle Status: Draft -> Open -> CAP Submitted -> Under Review -> Rejected / Rework -> Verified -> Closed
 * 2. Deadline Condition: Open | Overdue | Due Soon | Closed
 */
export const WORKFLOW_STATUSES = [
  'Draft',
  'Open',
  'CAP Submitted',
  'Under Review',
  'Rejected / Rework',
  'Verified',
  'Closed',
];

export const DEADLINE_CONDITIONS = ['Open', 'Overdue', 'Due Soon', 'Closed'];

/**
 * Calculates separate deadline condition independent of workflow status:
 * - 'Closed': When NC is in Verified or Closed status
 * - 'Overdue': When target deadline has passed and NC is not closed
 * - 'Due Soon': Within 4 hours of target deadline
 * - 'Open': Within SLA (more than 4 hours remaining)
 */
export const calculateDeadlineCondition = (deadlineTimestamp, complaintStatus) => {
  const isTerminal = complaintStatus === 'Closed' || complaintStatus === 'Verified';
  if (isTerminal) return 'Closed';
  if (!deadlineTimestamp) return 'Open';

  const diffMs = new Date(deadlineTimestamp).getTime() - Date.now();
  if (diffMs <= 0) return 'Overdue';
  if (diffMs <= 4 * 60 * 60 * 1000) return 'Due Soon';
  return 'Open';
};

export const calculateSlaStatus = (deadlineTimestamp, complaintStatus) => {
  const isTerminal = complaintStatus === 'Closed' || complaintStatus === 'Verified';
  if (isTerminal) {
    return {
      condition: 'Closed',
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
      condition: 'Overdue',
      type: 'OVERDUE',
      label: 'OVERDUE',
      formattedText: `Overdue (${formattedTime})`,
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

  // WARNING: Less than 4 hours remaining (Due Soon)
  if (hours < 4) {
    return {
      condition: 'Due Soon',
      type: 'WARNING',
      label: 'Due Soon (< 4h)',
      formattedText: formattedTime,
      timeOnly: `${hours}h ${minutes}m ${seconds}s`,
      isOverdue: false,
      isWarning: true,
      badgeColor: 'amber',
      rawDiffMs: diffMs,
    };
  }

  // NORMAL: More than 4 hours remaining (Open)
  return {
    condition: 'Open',
    type: 'NORMAL',
    label: 'Open (Within SLA)',
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

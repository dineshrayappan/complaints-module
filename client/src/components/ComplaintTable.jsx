import React from 'react';
import { Eye, Camera, CheckCheck, Play, Phone } from 'lucide-react';
import CountdownBadge from './CountdownBadge';
import { useAuth } from '../context/AuthContext';

export const ComplaintTable = ({
  complaints,
  onViewDetails,
  onStartProgress,
  onSubmitAction,
}) => {
  const { isAuditor, isActionPerson, user } = useAuth();

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'CRITICAL':
        return 'text-rose-600 dark:text-rose-400 font-bold';
      case 'HIGH':
        return 'text-amber-600 dark:text-amber-400 font-semibold';
      case 'MEDIUM':
        return 'text-blue-600 dark:text-blue-400 font-medium';
      default:
        return 'text-slate-500 dark:text-slate-400';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Closed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800';
      case 'Under Verification':
        return 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-700 animate-pulse font-semibold';
      case 'In Progress':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-800';
      case 'Rejected / Sent Back':
        return 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  return (
    <div className="overflow-x-auto no-scrollbar sm:overflow-x-auto rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
      <table className="w-full min-w-[680px] text-left text-xs border-collapse">
        <thead className="bg-slate-50/90 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono text-[10px] sm:text-[11px] border-b border-slate-200 dark:border-slate-800">
          <tr>
            <th className="py-3 px-3.5 sm:py-3.5 sm:px-4 font-semibold">CMP ID</th>
            <th className="py-3 px-3.5 sm:py-3.5 sm:px-4 font-semibold">Priority</th>
            <th className="py-3 px-3.5 sm:py-3.5 sm:px-4 font-semibold">Defect & Location</th>
            <th className="py-3 px-3.5 sm:py-3.5 sm:px-4 font-semibold">Line In-Charge</th>
            <th className="py-3 px-3.5 sm:py-3.5 sm:px-4 font-semibold">Live SLA Countdown</th>
            <th className="py-3 px-3.5 sm:py-3.5 sm:px-4 font-semibold">Status</th>
            <th className="py-3 px-3.5 sm:py-3.5 sm:px-4 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
          {complaints.map((c) => {
            const assignedUserId =
              typeof c.assignedTo?.userId === 'object'
                ? c.assignedTo?.userId?._id?.toString()
                : c.assignedTo?.userId?.toString();
            const currentUserId = user?._id?.toString();

            const canAct =
              isActionPerson &&
              (assignedUserId === currentUserId ||
                c.assignedTo?.employeeId === user?.employeeId ||
                c.department === user?.department);

            return (
              <tr
                key={c._id}
                className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                onClick={() => onViewDetails(c)}
              >
                {/* ID */}
                <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-cyan-400 whitespace-nowrap">
                  {c.complaintId}
                </td>

                {/* Priority */}
                <td className="py-3 px-4 whitespace-nowrap">
                  <span className={getPriorityStyle(c.priority)}>
                    {c.priority}
                  </span>
                </td>

                {/* Category & Location */}
                <td className="py-3 px-4">
                  <div className="font-semibold text-slate-900 dark:text-slate-100">
                    {c.category}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {c.location} • <span className="text-slate-400 dark:text-slate-500">{c.department}</span>
                  </div>
                </td>

                {/* Line In-Charge */}
                <td className="py-3 px-4 whitespace-nowrap">
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    {c.assignedTo?.name}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1">
                    <Phone className="w-2.5 h-2.5 text-slate-400" />
                    {c.assignedTo?.mobileNumber}
                  </div>
                </td>

                {/* Live SLA Countdown */}
                <td className="py-3 px-4 whitespace-nowrap">
                  <CountdownBadge
                    deadlineTimestamp={c.deadlineTimestamp}
                    status={c.status}
                    compact={true}
                  />
                </td>

                {/* Status */}
                <td className="py-3 px-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusBadge(
                      c.status
                    )}`}
                  >
                    {c.status}
                  </span>
                </td>

                {/* Actions */}
                <td
                  className="py-3 px-4 text-right whitespace-nowrap"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-end gap-2">
                    {canAct && c.status === 'Assigned' && (
                      <button
                        onClick={() => onStartProgress(c)}
                        className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs"
                        title="Start Rework"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {canAct &&
                      ['In Progress', 'Rejected / Sent Back'].includes(
                        c.status
                      ) && (
                        <button
                          onClick={() => onSubmitAction(c)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1 shadow-xs"
                          title="Submit Action Resolution Proof"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Submit Proof</span>
                        </button>
                      )}

                    {isAuditor && c.status === 'Under Verification' && (
                      <button
                        onClick={() => onViewDetails(c)}
                        className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center gap-1 shadow-xs animate-pulse"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>Verify</span>
                      </button>
                    )}

                    <button
                      onClick={() => onViewDetails(c)}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                      title="Inspect Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ComplaintTable;

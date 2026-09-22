import React from 'react';
import {
  MapPin,
  Phone,
  Eye,
  Camera,
  Play,
  CheckCheck,
  User,
} from 'lucide-react';
import CountdownBadge from './CountdownBadge';
import { useAuth } from '../context/AuthContext';

export const ComplaintCard = ({
  complaint,
  onViewDetails,
  onStartProgress,
  onSubmitAction,
}) => {
  const { isAuditor, isActionPerson, user } = useAuth();

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800';
      case 'HIGH':
        return 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800';
      case 'MEDIUM':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-800';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Closed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800';
      case 'Under Verification':
        return 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800 animate-pulse font-semibold';
      case 'In Progress':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-800';
      case 'Rejected / Sent Back':
        return 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  const assignedUserId =
    typeof complaint.assignedTo?.userId === 'object'
      ? complaint.assignedTo?.userId?._id?.toString()
      : complaint.assignedTo?.userId?.toString();
  const currentUserId = user?._id?.toString();
  const assignedEmpId = (complaint.assignedTo?.employeeId || '').toUpperCase();
  const userEmpId = (user?.employeeId || '').toUpperCase();
  const compDept = (complaint.department || '').trim().toLowerCase();
  const userDept = (user?.department || '').trim().toLowerCase();

  const canActionPersonAct =
    isActionPerson || isAdmin;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-2xl p-3.5 sm:p-5 transition-all duration-200 shadow-xs hover:shadow-md flex flex-col justify-between group">
      <div>
        {/* Card Top Row: CMP ID, Priority & Countdown */}
        <div className="flex items-start justify-between gap-2 flex-wrap mb-2.5 sm:mb-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-cyan-400 border border-slate-200 dark:border-slate-800">
              {complaint.complaintId}
            </span>
            <span
              className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border ${getPriorityBadge(
                complaint.priority
              )}`}
            >
              {complaint.priority}
            </span>
          </div>

          <CountdownBadge
            deadlineTimestamp={complaint.deadlineTimestamp}
            status={complaint.status}
          />
        </div>

        {/* Defect Category & Status */}
        <div className="flex items-center justify-between mb-1.5">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-sans group-hover:text-indigo-600 dark:group-hover:text-blue-400 transition-colors truncate pr-2">
            {complaint.category}
          </h3>
          <span
            className={`text-[11px] sm:text-xs font-semibold px-2 sm:px-2.5 py-0.5 rounded-full border shrink-0 ${getStatusBadge(
              complaint.status
            )}`}
          >
            {complaint.status}
          </span>
        </div>

        {/* Machine Location & Department */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium mb-2.5 sm:mb-3 truncate">
          <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
          <span className="text-slate-800 dark:text-slate-200 font-semibold truncate">{complaint.location}</span>
          <span>•</span>
          <span className="truncate">{complaint.department}</span>
        </div>

        {/* Description Snippet */}
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-clamp-2 mb-3 sm:mb-4 leading-relaxed bg-slate-50/80 dark:bg-slate-950/60 p-2 sm:p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
          {complaint.description}
        </p>

        {/* Solution Details & Proof (Visible on Auditor & Supervisor pages once resolved) */}
        {(complaint.afterPhoto || complaint.actionNotes) && (
          <div className="mb-3 p-2.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-xs">
            <div className="flex items-center justify-between font-bold text-emerald-800 dark:text-emerald-300 text-[11px] mb-1">
              <span className="flex items-center gap-1">
                <CheckCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Solution & Rectification Details:
              </span>
              {complaint.actualCompletedAt && (
                <span className="text-[10px] font-mono text-emerald-700/80 dark:text-emerald-400/80">
                  {new Date(complaint.actualCompletedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
            {complaint.actionNotes && (
              <p className="text-slate-800 dark:text-slate-100 text-[11px] line-clamp-2 leading-relaxed">
                <strong className="text-slate-900 dark:text-white font-semibold">Action Taken: </strong>
                {complaint.actionNotes}
              </p>
            )}
            {complaint.feedbackRemarks && (
              <p className="text-slate-600 dark:text-slate-300 text-[10px] mt-1 line-clamp-1 italic">
                <strong className="not-italic font-semibold text-slate-700 dark:text-slate-200">Root Cause: </strong>
                {complaint.feedbackRemarks}
              </p>
            )}
          </div>
        )}

        {/* Proof Images preview row */}
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          {/* Before Photo */}
          <div
            onClick={() => onViewDetails(complaint)}
            className="relative cursor-pointer group/img shrink-0"
          >
            <img
              src={complaint.beforePhoto}
              alt="Before Defect Proof"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=400&q=80';
              }}
              className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-xl border border-slate-200 dark:border-slate-700 group-hover/img:border-indigo-500 transition-all shadow-xs"
            />
            <span className="absolute bottom-1 left-1 px-1 py-0.2 bg-slate-900/90 text-[8px] font-bold text-rose-300 rounded">
              BEFORE
            </span>
          </div>

          {/* After Photo (or Placeholder) */}
          {complaint.afterPhoto ? (
            <div
              onClick={() => onViewDetails(complaint)}
              className="relative cursor-pointer group/img shrink-0"
            >
              <img
                src={complaint.afterPhoto}
                alt="After Resolution Proof"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=400&q=80';
                }}
                className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-xl border border-emerald-300 dark:border-emerald-600 group-hover/img:border-emerald-500 transition-all shadow-xs"
              />
              <span className="absolute bottom-1 left-1 px-1 py-0.2 bg-slate-900/90 text-[8px] font-bold text-emerald-300 rounded">
                AFTER
              </span>
            </div>
          ) : (
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 text-[9px] sm:text-[10px] text-center p-1 shrink-0">
              <Camera className="w-3.5 h-3.5 mb-0.5" />
              <span>Pending</span>
            </div>
          )}

          {/* Line Supervisor Avatar & Info */}
          <div className="ml-auto text-right text-xs min-w-0">
            <div className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 tracking-wider truncate">
              Line In-Charge
            </div>
            <div className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[100px] sm:max-w-[140px]">
              {complaint.assignedTo?.name}
            </div>
            <div className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-[11px] font-mono flex items-center justify-end gap-1 mt-0.5 truncate">
              <Phone className="w-2.5 h-2.5 text-slate-400 shrink-0" />
              <span className="truncate">{complaint.assignedTo?.mobileNumber}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Card Footer Actions Bar */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2">
        <button
          onClick={() => onViewDetails(complaint)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
        >
          <Eye className="w-3.5 h-3.5 text-slate-500" />
          <span>Inspect Log</span>
        </button>

        {/* Action Button for Supervisor */}
        {canActionPersonAct && complaint.status === 'Assigned' && (
          <button
            onClick={() => onStartProgress(complaint)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all active:scale-95"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Start Rework</span>
          </button>
        )}

        {canActionPersonAct &&
          ['In Progress', 'Rejected / Sent Back'].includes(complaint.status) && (
            <button
              onClick={() => onSubmitAction(complaint)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all active:scale-95"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Submit Proof</span>
            </button>
          )}

        {/* Verification Action for Auditor */}
        {isAuditor && complaint.status === 'Under Verification' && (
          <button
            onClick={() => onViewDetails(complaint)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-sm transition-all animate-pulse active:scale-95"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Verify Defect</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default ComplaintCard;

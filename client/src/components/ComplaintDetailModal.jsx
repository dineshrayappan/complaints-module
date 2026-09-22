import React, { useState } from 'react';
import {
  X,
  Clock,
  MapPin,
  User,
  Phone,
  CheckCircle2,
  AlertTriangle,
  Send,
  ShieldCheck,
  Check,
  RotateCcw,
  ZoomIn,
} from 'lucide-react';
import CountdownBadge from './CountdownBadge';
import { formatAbsoluteTime } from '../utils/timer';
import { complaintService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const ComplaintDetailModal = ({
  complaint,
  isOpen,
  onClose,
  onUpdateComplaint,
}) => {
  const { user, isAuditor } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Verification state
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [activeZoomImage, setActiveZoomImage] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen || !complaint) return null;

  // Handle direct timeline remark
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      setSubmittingComment(true);
      setError(null);
      const res = await complaintService.addTimelineComment(
        complaint._id,
        commentText.trim()
      );
      if (res.data.success) {
        onUpdateComplaint({
          ...complaint,
          timeline: res.data.timeline,
        });
        setCommentText('');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post remark.');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Handle Auditor Verification (Approve or Reject)
  const handleVerify = async (decision) => {
    if (decision === 'REJECT' && !rejectionReason.trim()) {
      setError('A rejection reason is mandatory when returning a ticket to the line.');
      return;
    }

    try {
      setVerifying(true);
      setError(null);
      const res = await complaintService.verifyComplaint(complaint._id, {
        decision,
        rejectionReason: rejectionReason.trim(),
      });

      if (res.data.success) {
        onUpdateComplaint(res.data.complaint);
        setShowRejectBox(false);
        setRejectionReason('');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed.');
    } finally {
      setVerifying(false);
    }
  };

  const getTimelineEventBadge = (action) => {
    switch (action) {
      case 'CREATED':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/40';
      case 'IN_PROGRESS':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-500/20 dark:text-cyan-400 dark:border-cyan-500/40';
      case 'ACTION_SUBMITTED':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/40';
      case 'REJECTED':
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/40';
      case 'CLOSED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/40';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6 transition-colors">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <span className="font-mono text-base font-extrabold text-slate-900 dark:text-cyan-400 bg-slate-200/80 dark:bg-slate-950 px-3 py-1 rounded-xl border border-slate-300 dark:border-slate-800">
              {complaint.complaintId}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  {complaint.category}
                </h2>
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {complaint.priority}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                {complaint.location} • {complaint.department}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <CountdownBadge
              deadlineTimestamp={complaint.deadlineTimestamp}
              status={complaint.status}
            />
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Container */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-200 flex items-center gap-2 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Side-by-Side Before Photo vs After Photo Comparison */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
              <span>Photo Evidence Verification</span>
              <span>•</span>
              <span className="text-indigo-600 dark:text-blue-400">Click to Zoom</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Before Photo */}
              <div
                onClick={() => setActiveZoomImage(complaint.beforePhoto)}
                className="relative rounded-2xl overflow-hidden border border-rose-200 dark:border-rose-900/60 bg-slate-50 dark:bg-slate-950 group cursor-pointer shadow-xs hover:shadow-md transition-shadow"
              >
                <img
                  src={complaint.beforePhoto}
                  alt="Defect Before"
                  className="w-full h-52 sm:h-56 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-between p-3.5">
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wider bg-rose-600 text-white shadow">
                    BEFORE RECTIFICATION
                  </span>
                  <div className="p-1.5 rounded-lg bg-slate-900/80 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <ZoomIn className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* After Photo */}
              {complaint.afterPhoto ? (
                <div
                  onClick={() => setActiveZoomImage(complaint.afterPhoto)}
                  className="relative rounded-2xl overflow-hidden border border-emerald-300 dark:border-emerald-900/60 bg-slate-50 dark:bg-slate-950 group cursor-pointer shadow-xs hover:shadow-md transition-shadow"
                >
                  <img
                    src={complaint.afterPhoto}
                    alt="Defect After"
                    className="w-full h-52 sm:h-56 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-between p-3.5">
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wider bg-emerald-600 text-white shadow">
                      AFTER PROOF (RESOLVED)
                    </span>
                    <div className="p-1.5 rounded-lg bg-slate-900/80 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <ZoomIn className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex flex-col items-center justify-center p-6 text-center h-52 sm:h-56 text-slate-500">
                  <Clock className="w-8 h-8 text-slate-400 dark:text-slate-600 mb-2 animate-pulse" />
                  <span className="font-bold text-slate-700 dark:text-slate-400 text-sm">
                    Awaiting After Photo Proof
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-600 mt-1 max-w-xs">
                    Assigned Line In-Charge will capture proof from the shop floor once correction is completed.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Defect Details & Personnel Assignment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Defect Description */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                Defect Description & Instructions
              </span>
              <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-sans">
                {complaint.description}
              </p>
              <div className="pt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between border-t border-slate-200 dark:border-slate-900">
                <span>Logged by: {complaint.createdBy?.name} ({complaint.createdBy?.role})</span>
                <span className="font-mono">{formatAbsoluteTime(complaint.createdAt)}</span>
              </div>
            </div>

            {/* SLA & Line In-Charge Snapshot */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                Assignment & SLA Window
              </span>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 dark:text-slate-200 text-sm">
                    {complaint.assignedTo?.name}
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                    {complaint.assignedTo?.designation} • {complaint.assignedTo?.department}
                  </div>
                </div>
                <div className="font-mono text-slate-700 dark:text-slate-300 flex items-center gap-1 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs">
                  <Phone className="w-3 h-3 text-slate-400" />
                  {complaint.assignedTo?.mobileNumber}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-900 space-y-1 text-[11px]">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>SLA Duration:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-200">
                    {complaint.deadlineHours} Hours
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Target Deadline:</span>
                  <span className="font-mono text-indigo-700 dark:text-cyan-300 font-semibold">
                    {formatAbsoluteTime(complaint.deadlineTimestamp)}
                  </span>
                </div>
                {complaint.actualCompletedAt && (
                  <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-semibold">
                    <span>Approved & Closed At:</span>
                    <span className="font-mono">
                      {formatAbsoluteTime(complaint.actualCompletedAt)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Action Taken & Root Cause (if submitted) */}
          {(complaint.actionNotes || complaint.feedbackRemarks) && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-emerald-700 dark:text-emerald-400 tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  Supervisor Resolution & Root Cause Feedback
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  Shop-Floor Input
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-300 block mb-1">
                    Action Taken (Work Performed):
                  </span>
                  <p className="text-slate-700 dark:text-slate-200 leading-relaxed font-sans">
                    {complaint.actionNotes || 'No notes specified.'}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                  <span className="font-bold text-amber-700 dark:text-amber-300 block mb-1">
                    Root Cause & Preventive Measures:
                  </span>
                  <p className="text-slate-700 dark:text-slate-200 leading-relaxed font-sans">
                    {complaint.feedbackRemarks || 'No preventive feedback logged.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Rejection notice if status is Rejected */}
          {complaint.status === 'Rejected / Sent Back' && complaint.rejectionReason && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-rose-700 dark:text-rose-300">
                <AlertTriangle className="w-4 h-4" />
                Audit Rejection Notice: Returned to Line
              </div>
              <p className="text-rose-900 dark:text-rose-100">{complaint.rejectionReason}</p>
            </div>
          )}

          {/* Auditor Verification Gateway Action Box */}
          {isAuditor && complaint.status === 'Under Verification' && (
            <div className="p-5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border-2 border-purple-200 dark:border-purple-600 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-cyan-400" />
                    Auditor Sign-Off & Verification Gateway
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                    Inspect the Before vs. After photos above. Verify AQL standards are satisfied.
                  </p>
                </div>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-300 border border-purple-300 dark:border-purple-500/40">
                  Auditor Exclusive
                </span>
              </div>

              {showRejectBox ? (
                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-bold text-rose-700 dark:text-rose-300">
                    Mandatory Rejection Reason:
                  </label>
                  <textarea
                    rows="2"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Specify why the rectification was rejected (e.g., seam puckering still visible on sample #4, needle hole not covered)..."
                    className="w-full bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-3 rounded-xl border border-rose-300 dark:border-rose-800 text-xs focus:ring-2 focus:ring-rose-500"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowRejectBox(false)}
                      className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={verifying}
                      onClick={() => handleVerify('REJECT')}
                      className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors"
                    >
                      {verifying ? 'Rejecting...' : 'Confirm Rejection & Return'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRejectBox(true)}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950 hover:text-rose-700 dark:hover:text-rose-300 text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-300 dark:border-slate-700 transition-all active:scale-95 shadow-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reject & Return to Line</span>
                  </button>

                  <button
                    type="button"
                    disabled={verifying}
                    onClick={() => handleVerify('APPROVE')}
                    className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition-all active:scale-95"
                  >
                    <Check className="w-4 h-4" />
                    <span>{verifying ? 'Closing...' : 'Approve & Close Defect Ticket'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Section 4: In-Ticket Chronological Audit Timeline Log */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>Closed-Loop Audit Trail & Remark Log</span>
              <span className="font-mono text-slate-500">
                {complaint.timeline?.length || 0} Events Recorded
              </span>
            </h3>

            {/* Timeline Stream */}
            <div className="relative pl-6 space-y-3.5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
              {complaint.timeline?.map((item, idx) => (
                <div key={idx} className="relative group">
                  {/* Dot Node */}
                  <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-white dark:bg-slate-900 border-2 border-indigo-600 dark:border-blue-500 shadow-xs" />

                  <div className="bg-slate-50/80 dark:bg-slate-950/70 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 text-xs">
                    <div className="flex items-center justify-between flex-wrap gap-1 mb-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${getTimelineEventBadge(
                            item.action
                          )}`}
                        >
                          {item.action}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-slate-200">
                          {item.performedBy?.name}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                          ({item.performedBy?.role})
                        </span>
                      </div>
                      <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        {formatAbsoluteTime(item.timestamp)}
                      </span>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 text-xs mt-1 leading-relaxed">
                      {item.notes}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Remark Form */}
            <form onSubmit={handleAddComment} className="pt-2 flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Post direct auditor-supervisor remark into audit log..."
                className="flex-1 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500 font-sans"
              />
              <button
                type="submit"
                disabled={submittingComment || !commentText.trim()}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Post Remark</span>
              </button>
            </form>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="font-mono text-[11px]">
            Garment QMS Ref: {complaint.complaintId}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>

      {/* Full-Screen Zoom Lightbox Modal */}
      {activeZoomImage && (
        <div
          onClick={() => setActiveZoomImage(null)}
          className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4 cursor-zoom-out"
        >
          <img
            src={activeZoomImage}
            alt="Zoomed Inspection Proof"
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl border border-slate-700"
          />
          <button
            onClick={() => setActiveZoomImage(null)}
            className="absolute top-6 right-6 p-3 rounded-full bg-slate-900/80 text-white hover:bg-slate-800"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ComplaintDetailModal;

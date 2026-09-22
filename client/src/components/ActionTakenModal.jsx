import React, { useState, useRef } from 'react';
import {
  X,
  Camera,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { complaintService } from '../services/api';
import { compressImage, formatFileSize } from '../utils/imageCompressor';
import CountdownBadge from './CountdownBadge';

export const ActionTakenModal = ({ complaint, isOpen, onClose, onSuccess }) => {
  const fileInputRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Resolution Form State
  const [actionNotes, setActionNotes] = useState('');
  const [feedbackRemarks, setFeedbackRemarks] = useState('');

  // After Photo State
  const [afterFile, setAfterFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [imageMeta, setImageMeta] = useState(null);
  const [compressing, setCompressing] = useState(false);

  if (!isOpen || !complaint) return null;

  // Handle Rear Camera / Photo Selection with Client Canvas Compression
  const handlePhotoCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setCompressing(true);
      setError(null);
      const result = await compressImage(file, {
        maxWidth: 1600,
        maxHeight: 1600,
        quality: 0.82,
      });

      setAfterFile(result.file);
      setPreviewUrl(result.previewUrl);
      setImageMeta({
        originalSize: result.originalSize,
        compressedSize: result.compressedSize,
      });
    } catch (err) {
      setError('Image compression failed: ' + err.message);
    } finally {
      setCompressing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!afterFile) {
      setError('Mandatory After Photo proof is required to submit defect resolution.');
      return;
    }

    if (!actionNotes.trim()) {
      setError('Please provide Action Notes specifying what rework was performed.');
      return;
    }

    if (!feedbackRemarks.trim()) {
      setError(
        'Please provide Root Cause Feedback (why did it occur and what preventive measures were taken).'
      );
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('afterPhoto', afterFile);
      formData.append('actionNotes', actionNotes.trim());
      formData.append('feedbackRemarks', feedbackRemarks.trim());

      const res = await complaintService.submitAction(complaint._id, formData);
      if (res.data.success) {
        onSuccess(res.data.complaint);
        onClose();
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || 'Failed to submit resolution. Try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col transition-colors">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-5 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800 shrink-0">
              <FileCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h2 className="text-sm sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  Defect Rectification Proof
                </h2>
                <span className="font-mono text-[11px] sm:text-xs font-bold text-slate-700 dark:text-cyan-400 bg-slate-200/80 dark:bg-slate-950 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-800">
                  {complaint.complaintId}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                Action Taken • Mandatory After Photo • Audit Sign-off
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body - Scrollable on Mobile */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3.5 sm:space-y-4 text-xs sm:text-sm overflow-y-auto flex-1">
          {error && (
            <div className="p-3 sm:p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-200 flex items-center gap-2 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Reference: Defect Overview & Before Photo */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3.5 items-start sm:items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={complaint.beforePhoto}
                alt="Before Defect"
                className="w-16 h-16 object-cover rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs"
              />
              <div>
                <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 tracking-wider">
                  BEFORE PHOTO REFERENCE
                </span>
                <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  {complaint.category} • {complaint.location}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                  {complaint.description}
                </div>
              </div>
            </div>

            <div className="shrink-0">
              <CountdownBadge
                deadlineTimestamp={complaint.deadlineTimestamp}
                status={complaint.status}
              />
            </div>
          </div>

          {/* 1. Mandatory After Photo Proof Camera Capture */}
          <div>
            <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Proof of Correction: After Photo (Mandatory)
              </span>
              {imageMeta && (
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
                  Compressed: {formatFileSize(imageMeta.compressedSize)}
                </span>
              )}
            </label>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              capture="environment"
              onChange={handlePhotoCapture}
              className="hidden"
              id="camera-after-photo"
            />

            {previewUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-emerald-400 dark:border-emerald-600/80 bg-slate-100 dark:bg-slate-950 group shadow-xs">
                <img
                  src={previewUrl}
                  alt="Resolution Preview"
                  className="w-full h-48 sm:h-52 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-between p-3.5">
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-600 text-white shadow">
                    After Photo Ready
                  </span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 text-xs font-semibold hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-1.5"
                  >
                    <Camera className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Retake Proof
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-36 sm:h-40 border-2 border-dashed border-emerald-300 dark:border-emerald-600/50 hover:border-emerald-500 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-emerald-50/80 dark:hover:bg-emerald-950/30 group"
              >
                <div className="w-11 h-11 rounded-full bg-white dark:bg-emerald-900/40 group-hover:bg-emerald-100 flex items-center justify-center mb-1.5 transition-colors border border-emerald-200 dark:border-emerald-700 shadow-xs">
                  <Camera className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">
                  {compressing
                    ? 'Compressing Photo...'
                    : 'Tap to Open Rear Camera / Upload After Photo'}
                </span>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-400/80 mt-0.5 font-mono">
                  Show Rectified Seam / Cleaned Component
                </span>
              </div>
            )}
          </div>

          {/* 2. Action Notes */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Action Taken (Work Done)
            </label>
            <textarea
              rows="3"
              value={actionNotes}
              onChange={(e) => setActionNotes(e.target.value)}
              placeholder="Detail what rework was performed (e.g., resewn seam, replaced needle with Groz-Beckert 75/11, adjusted upper thread tension, spot cleaned)..."
              className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-emerald-500 font-sans"
            />
          </div>

          {/* 3. Root Cause Feedback & Preventive Measures */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1 flex items-center justify-between">
              <span>Root Cause Feedback & Preventive Measures</span>
              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-mono font-semibold">
                Mandatory for QMS
              </span>
            </label>
            <textarea
              rows="2"
              value={feedbackRemarks}
              onChange={(e) => setFeedbackRemarks(e.target.value)}
              placeholder="Why did this defect occur? What was done to prevent recurrence on the line (operator retrained, maintenance schedule adjusted, folder re-aligned)?"
              className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-emerald-500 font-sans"
            />
          </div>

          {/* Strict Role & Audit Verification Notice */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                Audit Verification Gateway:
              </span>{' '}
              Submitting this form shifts status to{' '}
              <span className="text-amber-700 dark:text-amber-300 font-mono font-bold">
                Under Verification
              </span>
              . Only an authorized Internal Auditor can approve and officially
              close this ticket.
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || compressing}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-600/30 transition-all active:scale-95 disabled:opacity-50"
            >
              {submitting ? 'Submitting Proof...' : 'Submit for Verification'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ActionTakenModal;

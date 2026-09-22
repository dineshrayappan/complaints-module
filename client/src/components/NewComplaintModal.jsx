import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Camera,
  Clock,
  AlertTriangle,
  User,
  MapPin,
  CheckCircle2,
  Phone,
  Building2,
  Sliders,
  Check,
} from 'lucide-react';
import { userService, complaintService } from '../services/api';
import { compressImage, formatFileSize } from '../utils/imageCompressor';

export const NewComplaintModal = ({ isOpen, onClose, onSuccess }) => {
  const fileInputRef = useRef(null);
  const [supervisors, setSupervisors] = useState([]);
  const [loadingSupervisors, setLoadingSupervisors] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Form State
  const [category, setCategory] = useState('Stitching Fault');
  const [location, setLocation] = useState('');
  const [priority, setPriority] = useState('HIGH');
  const [description, setDescription] = useState('');
  const [assignedToUserId, setAssignedToUserId] = useState('');
  // Strictly bounded 12 to 24 hours SLA slider
  const [deadlineHours, setDeadlineHours] = useState(16);

  // Photo State
  const [beforeFile, setBeforeFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [imageMeta, setImageMeta] = useState(null);
  const [compressing, setCompressing] = useState(false);

  // Fetch Master Contact List of Line Supervisors
  useEffect(() => {
    if (isOpen) {
      const loadSupervisors = async () => {
        setLoadingSupervisors(true);
        try {
          const res = await userService.getLineSupervisors();
          if (res.data.success && res.data.supervisors.length > 0) {
            setSupervisors(res.data.supervisors);
            setAssignedToUserId(res.data.supervisors[0]._id);
          }
        } catch (err) {
          setError('Failed to fetch Master Contact List of Line In-Charges.');
        } finally {
          setLoadingSupervisors(false);
        }
      };
      loadSupervisors();
    }
  }, [isOpen]);

  if (!isOpen) return null;

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

      setBeforeFile(result.file);
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

  // Target deadline calculation display
  const targetTime = new Date(Date.now() + deadlineHours * 60 * 60 * 1000);
  const formattedTargetDeadline = targetTime.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!beforeFile) {
      setError('Mandatory Before Photo proof is required to log a complaint.');
      return;
    }

    if (!location.trim()) {
      setError('Please specify the machine or workstation location.');
      return;
    }

    if (!description.trim()) {
      setError('Please provide a detailed defect description.');
      return;
    }

    if (!assignedToUserId) {
      setError('Please select a Line In-Charge from the Master Contact List.');
      return;
    }

    const selectedSupervisor = supervisors.find((s) => s._id === assignedToUserId);

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('beforePhoto', beforeFile);
      formData.append('category', category);
      formData.append('department', selectedSupervisor?.department || 'Sewing');
      formData.append('location', location.trim());
      formData.append('priority', priority);
      formData.append('description', description.trim());
      formData.append('assignedToUserId', assignedToUserId);
      formData.append('deadlineHours', deadlineHours.toString());

      const res = await complaintService.createComplaint(formData);
      if (res.data.success) {
        onSuccess(res.data.complaint);
        onClose();
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || 'Failed to submit complaint. Check all fields.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const selectedSupervisor = supervisors.find((s) => s._id === assignedToUserId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6 transition-colors">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800/80">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Log Audit Defect & Assign Line
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Mandatory Before Photo Proof • 12–24h SLA Slider
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs sm:text-sm">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-200 flex items-center gap-2 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Mandatory Before Photo Camera Capture */}
          <div>
            <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-indigo-600 dark:text-cyan-400" />
                Defect Proof: Before Photo (Mandatory)
              </span>
              {imageMeta && (
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
                  Compressed: {formatFileSize(imageMeta.compressedSize)} (Saved{' '}
                  {Math.round(
                    (1 - imageMeta.compressedSize / imageMeta.originalSize) * 100
                  )}
                  %)
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
              id="camera-before-photo"
            />

            {previewUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-emerald-300 dark:border-emerald-600/80 bg-slate-100 dark:bg-slate-950 group shadow-xs">
                <img
                  src={previewUrl}
                  alt="Defect Preview"
                  className="w-full h-48 sm:h-52 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-between p-3.5">
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-600 text-white shadow">
                    Photo Captured & Compressed
                  </span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 text-xs font-semibold hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-1.5"
                  >
                    <Camera className="w-3.5 h-3.5 text-indigo-600 dark:text-cyan-400" />
                    Retake
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-36 sm:h-40 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-blue-500 rounded-2xl bg-slate-50 dark:bg-slate-950/60 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-slate-100 dark:hover:bg-slate-900/50 group"
              >
                <div className="w-11 h-11 rounded-full bg-white dark:bg-slate-800 group-hover:bg-indigo-50 dark:group-hover:bg-blue-600/20 flex items-center justify-center mb-1.5 transition-colors border border-slate-200 dark:border-slate-700 shadow-xs">
                  <Camera className="w-5 h-5 text-indigo-600 dark:text-blue-400" />
                </div>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">
                  {compressing ? 'Compressing WebP Photo...' : 'Tap to Open Camera / Upload Photo'}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                  Triggers Rear Camera on Mobile • Canvas WebP &lt; 400KB
                </span>
              </div>
            )}
          </div>

          {/* 2. Category & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Defect Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500 cursor-pointer font-sans"
              >
                <option value="Stitching Fault">Stitching Fault (Skipped, Puckering, Open Seam)</option>
                <option value="Fabric Defect">Fabric Defect (Needle cut, Slub, Hole)</option>
                <option value="Oil / Stain">Oil / Stain (Lubricant drip, Dirt mark)</option>
                <option value="Measurement / Fit">Measurement / Fit (Out of tolerance)</option>
                <option value="Trims / Accessories">Trims / Accessories (Zipper, Snap button)</option>
                <option value="Finishing / Pressing">Finishing / Pressing (Iron shine, Wrinkle)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Defect Severity / Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500 cursor-pointer font-sans"
              >
                <option value="CRITICAL">🔥 CRITICAL (Shipment Risk / Halt Line)</option>
                <option value="HIGH">⚠️ HIGH (AQL Failure Risk)</option>
                <option value="MEDIUM">🔷 MEDIUM (Standard Rework)</option>
                <option value="LOW">◽ LOW (Minor Cosmetic Correction)</option>
              </select>
            </div>
          </div>

          {/* 3. Machine / Location */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Machine Location & Station
            </label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Machine #14 - 4-Thread Overlock, Table #2"
                className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500 font-sans"
              />
            </div>
          </div>

          {/* 4. Pre-configured Master Contact List for Line In-Charge */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
              <span>Assign Line In-Charge (Master Contact List)</span>
              <span className="text-[11px] text-indigo-600 dark:text-blue-400 font-mono font-semibold">
                Pre-configured contacts
              </span>
            </label>

            <select
              value={assignedToUserId}
              onChange={(e) => setAssignedToUserId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500 cursor-pointer font-sans"
            >
              {supervisors.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.employeeId}) — {s.department} [{s.designation}] • 📞{' '}
                  {s.mobileNumber}
                </option>
              ))}
            </select>

            {/* Selected Supervisor Quick Summary */}
            {selectedSupervisor && (
              <div className="mt-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 dark:bg-blue-500/20 dark:text-blue-400 flex items-center justify-center font-bold text-[11px]">
                    {selectedSupervisor.employeeId.slice(-3)}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-slate-200">
                      {selectedSupervisor.name}
                    </span>{' '}
                    • {selectedSupervisor.department}
                  </div>
                </div>
                <div className="font-mono text-[11px] text-slate-700 dark:text-slate-300 flex items-center gap-1 font-semibold">
                  <Phone className="w-3 h-3 text-slate-400" />
                  {selectedSupervisor.mobileNumber}
                </div>
              </div>
            )}
          </div>

          {/* 5. Strictly Bounded 12–24h Resolution SLA Slider */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-500" />
                Resolution SLA Duration (12–24 Hours)
              </span>
              <span className="font-mono font-extrabold text-sm px-2.5 py-0.5 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800">
                {deadlineHours} Hours SLA
              </span>
            </div>

            {/* Range Slider strictly locked with min 12, max 24 */}
            <input
              type="range"
              min="12"
              max="24"
              step="1"
              value={deadlineHours}
              onChange={(e) => setDeadlineHours(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />

            <div className="flex justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
              <span>Min: 12 Hours</span>
              <span>Standard: 16 Hours</span>
              <span>Max: 24 Hours</span>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-900 text-xs flex items-center justify-between text-slate-600 dark:text-slate-400">
              <span>Calculated SLA Deadline:</span>
              <span className="font-bold text-indigo-700 dark:text-cyan-300 font-mono">
                {formattedTargetDeadline} UTC
              </span>
            </div>
          </div>

          {/* 6. Description */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Defect Description & Specific Directives
            </label>
            <textarea
              rows="3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail the defect, order/bundle number, piece count, and immediate correction requirements..."
              className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500 font-sans"
            />
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
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-50"
            >
              {submitting ? 'Creating Ticket...' : 'Assign & Activate SLA'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewComplaintModal;

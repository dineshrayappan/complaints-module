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
  Search,
  Users,
  Briefcase,
  Mail,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { userService, complaintService } from '../services/api';
import { compressImage, formatFileSize } from '../utils/imageCompressor';

// 10 Pre-configured Dummy Contacts with Full Production Line Details
export const DUMMY_SUPERVISORS = [
  {
    _id: '6ab21322cd50706ee2a84637',
    employeeId: 'SUP-101',
    name: 'Mohammad Arif',
    email: 'arif@factory.com',
    role: 'ACTION_PERSON',
    department: 'Sewing Line 1',
    designation: 'Line 1 In-Charge',
    mobileNumber: '+91 98111 22334',
    shift: 'Shift A (07:00 - 15:30)',
    workstation: 'Main Floor, Bay 1',
    avatarColor: 'bg-blue-600',
  },
  {
    _id: '6ab21322cd50706ee2a84638',
    employeeId: 'SUP-102',
    name: 'Priya Sharma',
    email: 'priya@factory.com',
    role: 'ACTION_PERSON',
    department: 'Sewing Line 2',
    designation: 'Line 2 In-Charge',
    mobileNumber: '+91 98222 33445',
    shift: 'Shift A (07:00 - 15:30)',
    workstation: 'Main Floor, Bay 2',
    avatarColor: 'bg-emerald-600',
  },
  {
    _id: '6ab21322cd50706ee2a84639',
    employeeId: 'SUP-103',
    name: 'Kamal Hasan',
    email: 'kamal@factory.com',
    role: 'ACTION_PERSON',
    department: 'Spreading & Cutting',
    designation: 'Cutting Section Head',
    mobileNumber: '+91 98333 44556',
    shift: 'General Shift (08:30 - 17:00)',
    workstation: 'CAD & Auto-Cutter Bay',
    avatarColor: 'bg-amber-600',
  },
  {
    _id: '6ab21322cd50706ee2a84640',
    employeeId: 'SUP-104',
    name: 'Sunita Roy',
    email: 'sunita@factory.com',
    role: 'ACTION_PERSON',
    department: 'Finishing & Packing',
    designation: 'Finishing Floor Manager',
    mobileNumber: '+91 98444 55667',
    shift: 'General Shift (09:00 - 18:00)',
    workstation: 'Steam Tunnel & Tagging Area',
    avatarColor: 'bg-purple-600',
  },
  {
    _id: '6ab21322cd50706ee2a84641',
    employeeId: 'SUP-105',
    name: 'Ramesh Patel',
    email: 'ramesh@factory.com',
    role: 'ACTION_PERSON',
    department: 'Sewing Line 3',
    designation: 'Line 3 Supervisor',
    mobileNumber: '+91 98555 66778',
    shift: 'Shift A (07:00 - 15:30)',
    workstation: 'Main Floor, Bay 3',
    avatarColor: 'bg-teal-600',
  },
  {
    _id: '6ab21322cd50706ee2a84642',
    employeeId: 'SUP-106',
    name: 'Kavita Deshmukh',
    email: 'kavita@factory.com',
    role: 'ACTION_PERSON',
    department: 'Sewing Line 4',
    designation: 'Line 4 Supervisor',
    mobileNumber: '+91 98666 77889',
    shift: 'Shift B (15:30 - 00:00)',
    workstation: 'Main Floor, Bay 4',
    avatarColor: 'bg-pink-600',
  },
  {
    _id: '6ab21322cd50706ee2a84643',
    employeeId: 'SUP-107',
    name: "Anthony D'Souza",
    email: 'anthony@factory.com',
    role: 'ACTION_PERSON',
    department: 'Embroidery & Printing',
    designation: 'Embroidery Unit Master',
    mobileNumber: '+91 98777 88990',
    shift: 'General Shift (08:30 - 17:00)',
    workstation: 'Multi-head Tajima Unit 2',
    avatarColor: 'bg-indigo-600',
  },
  {
    _id: '6ab21322cd50706ee2a84644',
    employeeId: 'SUP-108',
    name: 'Meera Nambiar',
    email: 'meera@factory.com',
    role: 'ACTION_PERSON',
    department: 'Wet Processing & Washing',
    designation: 'Washing Lab In-Charge',
    mobileNumber: '+91 98888 99001',
    shift: 'General Shift (09:00 - 17:30)',
    workstation: 'Industrial Wash & Enzyme Plant',
    avatarColor: 'bg-cyan-600',
  },
  {
    _id: '6ab21322cd50706ee2a84645',
    employeeId: 'SUP-109',
    name: 'Gurpreet Singh',
    email: 'gurpreet@factory.com',
    role: 'ACTION_PERSON',
    department: 'Trims & Special Machinery',
    designation: 'Buttoning & Snap Rivet Master',
    mobileNumber: '+91 98999 00112',
    shift: 'Shift A (07:00 - 15:30)',
    workstation: 'Pneumatic Press Bay 5',
    avatarColor: 'bg-orange-600',
  },
  {
    _id: '6ab21322cd50706ee2a84646',
    employeeId: 'SUP-110',
    name: 'Lakshmi Narayanan',
    email: 'lakshmi@factory.com',
    role: 'ACTION_PERSON',
    department: 'End-Line Inspection',
    designation: 'Final QC & Audit Coordinator',
    mobileNumber: '+91 98012 34567',
    shift: 'Flexible Shift (08:00 - 18:00)',
    workstation: 'Final Audit Station 100% Inspection',
    avatarColor: 'bg-rose-600',
  },
];

export const NewComplaintModal = ({ isOpen, onClose, onSuccess }) => {
  const fileInputRef = useRef(null);
  // Initialize immediately with 10 dummy contacts so assignment is never blocked
  const [supervisors, setSupervisors] = useState(DUMMY_SUPERVISORS);
  const [loadingSupervisors, setLoadingSupervisors] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Form State
  const [category, setCategory] = useState('Stitching Fault');
  const [location, setLocation] = useState('');
  const [priority, setPriority] = useState('HIGH');
  const [description, setDescription] = useState('');
  // Always pre-selected to first supervisor
  const [assignedToUserId, setAssignedToUserId] = useState(DUMMY_SUPERVISORS[0]._id);
  // Strictly bounded 12 to 24 hours SLA slider
  const [deadlineHours, setDeadlineHours] = useState(16);

  // Contact Selection Controls
  const [contactSearch, setContactSearch] = useState('');
  const [showContactGrid, setShowContactGrid] = useState(true);

  // Photo State
  const [beforeFile, setBeforeFile] = useState(null);
  const [photoBase64, setPhotoBase64] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [imageMeta, setImageMeta] = useState(null);
  const [compressing, setCompressing] = useState(false);

  // Fetch Master Contact List of Line Supervisors & merge with dummy contacts
  useEffect(() => {
    if (isOpen) {
      const loadSupervisors = async () => {
        setLoadingSupervisors(true);
        try {
          const res = await userService.getLineSupervisors();
          if (res.data?.success && Array.isArray(res.data.supervisors) && res.data.supervisors.length > 0) {
            const serverList = res.data.supervisors;
            const existingEmpIds = new Set(serverList.map((s) => s.employeeId));
            const merged = [...serverList];
            // Ensure all 10 dummy supervisors are present
            DUMMY_SUPERVISORS.forEach((d) => {
              if (!existingEmpIds.has(d.employeeId)) {
                merged.push(d);
              }
            });
            setSupervisors(merged);
            // If current assignedToUserId is not in merged list, set to first
            if (!merged.some((m) => m._id === assignedToUserId)) {
              setAssignedToUserId(merged[0]._id);
            }
          }
        } catch (err) {
          // Gracefully fallback to DUMMY_SUPERVISORS without blocking user
          console.warn('Using built-in master contacts list:', err.message);
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

      setBeforeFile(result.file || file);
      setPreviewUrl(result.previewUrl);
      setPhotoBase64(result.dataUrl);
      setImageMeta({
        originalSize: result.originalSize || file.size,
        compressedSize: result.compressedSize || file.size,
      });
    } catch (err) {
      console.warn('Compression error fallback:', err);
      setBeforeFile(file);
      try {
        setPreviewUrl(URL.createObjectURL(file));
      } catch (e) {}
      const reader = new FileReader();
      reader.onloadend = () => setPhotoBase64(reader.result);
      reader.readAsDataURL(file);
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

  const effectiveAssignedId =
    assignedToUserId || supervisors[0]?._id || DUMMY_SUPERVISORS[0]._id;
  const selectedSupervisor =
    supervisors.find((s) => s._id === effectiveAssignedId) ||
    supervisors[0] ||
    DUMMY_SUPERVISORS[0];

  const filteredSupervisors = supervisors.filter((s) => {
    if (!contactSearch.trim()) return true;
    const term = contactSearch.toLowerCase();
    return (
      s.name?.toLowerCase().includes(term) ||
      s.employeeId?.toLowerCase().includes(term) ||
      s.department?.toLowerCase().includes(term) ||
      s.designation?.toLowerCase().includes(term) ||
      s.mobileNumber?.toLowerCase().includes(term) ||
      s.workstation?.toLowerCase().includes(term)
    );
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

    const assignedId = assignedToUserId || selectedSupervisor._id;

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('category', category || 'Stitching Fault');
      formData.append('department', selectedSupervisor?.department || 'Sewing Line 1');
      formData.append('location', location.trim() || 'Floor 1');
      formData.append('priority', priority || 'HIGH');
      formData.append('description', description.trim());
      formData.append('assignedToUserId', assignedId);
      formData.append('assignedToId', assignedId);
      formData.append('deadlineHours', (deadlineHours || 16).toString());
      if (photoBase64) {
        formData.append('beforePhotoBase64', photoBase64);
      } else if (previewUrl && previewUrl.startsWith('data:')) {
        formData.append('beforePhotoBase64', previewUrl);
      } else if (beforeFile) {
        formData.append('beforePhoto', beforeFile);
      }

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col transition-colors">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-5 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800/80 shrink-0">
              <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Log Audit Defect & Assign Line
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                Mandatory Before Photo Proof • 12–24h SLA Slider
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

        {/* Form Body - Smooth Scrollable on Mobile Viewport */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3.5 sm:space-y-4 text-xs sm:text-sm overflow-y-auto flex-1">
          {error && (
            <div className="p-3 sm:p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-200 flex items-center gap-2 text-xs">
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
              onClick={(e) => {
                e.target.value = null;
              }}
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

          {/* 4. Pre-configured Master Contact List for Line In-Charge (10 Factory Contacts) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-600 dark:text-cyan-400" />
                <span>Assign Line In-Charge (10 Factory Contacts)</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-cyan-300 font-semibold border border-indigo-200 dark:border-indigo-800">
                  {supervisors.length} Contacts
                </span>
                <button
                  type="button"
                  onClick={() => setShowContactGrid((prev) => !prev)}
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 dark:text-cyan-400 dark:hover:text-cyan-300 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {showContactGrid ? (
                    <>
                      <span>Compact Select</span>
                      <ChevronUp className="w-3.5 h-3.5" />
                    </>
                  ) : (
                    <>
                      <span>Browse 10 Cards</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Search across the 10 contacts */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                placeholder="Search by name, employee ID, line, or department (e.g. Arif, Line 3, SUP-105)..."
                className="w-full pl-8.5 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 font-sans"
              />
              {contactSearch && (
                <button
                  type="button"
                  onClick={() => setContactSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Visual Contact Cards Grid View */}
            {showContactGrid ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1 no-scrollbar border border-slate-200 dark:border-slate-800/80 rounded-2xl p-2 bg-slate-50/60 dark:bg-slate-950/60">
                {filteredSupervisors.length > 0 ? (
                  filteredSupervisors.map((s) => {
                    const isSelected = s._id === effectiveAssignedId;
                    const initials = s.name
                      ? s.name
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()
                      : 'AP';

                    return (
                      <button
                        key={s._id}
                        type="button"
                        onClick={() => {
                          setAssignedToUserId(s._id);
                          if (s.department && !location) {
                            setLocation(`${s.department} Workstation`);
                          }
                        }}
                        className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 relative group ${
                          isSelected
                            ? 'bg-indigo-50/90 dark:bg-indigo-950/70 border-indigo-500 dark:border-indigo-400 ring-2 ring-indigo-500/30 shadow-xs'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-xs'
                        }`}
                      >
                        {/* Avatar */}
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-xs ${
                            s.avatarColor || 'bg-indigo-600'
                          }`}
                        >
                          {initials}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0 pr-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                              {s.name}
                            </span>
                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                              {s.employeeId}
                            </span>
                          </div>

                          <div className="text-[11px] font-semibold text-indigo-600 dark:text-cyan-400 truncate">
                            {s.department}
                          </div>

                          <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            {s.designation}
                          </div>

                          <div className="text-[10px] font-mono text-slate-600 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                            <Phone className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                            <span>{s.mobileNumber}</span>
                          </div>
                        </div>

                        {/* Selected Checkmark Indicator */}
                        {isSelected && (
                          <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })
                ) : (
                  <div className="col-span-full py-4 text-center text-xs text-slate-500">
                    No contacts matching "{contactSearch}"
                  </div>
                )}
              </div>
            ) : (
              /* Dropdown Select Option */
              <select
                value={effectiveAssignedId}
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
            )}

            {/* Comprehensive Active In-Charge Profile Card */}
            {selectedSupervisor && (
              <div className="p-3 rounded-2xl bg-gradient-to-r from-indigo-50/70 to-blue-50/50 dark:from-indigo-950/40 dark:to-slate-900 border border-indigo-200/80 dark:border-indigo-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-white text-sm shrink-0 shadow-sm ${
                      selectedSupervisor.avatarColor || 'bg-indigo-600'
                    }`}
                  >
                    {selectedSupervisor.name
                      ? selectedSupervisor.name
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()
                      : 'AP'}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-extrabold text-slate-900 dark:text-white">
                        {selectedSupervisor.name}
                      </span>
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-cyan-300">
                        {selectedSupervisor.employeeId}
                      </span>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Selected for SLA
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                      <span className="font-semibold text-indigo-700 dark:text-cyan-400">
                        {selectedSupervisor.department}
                      </span>{' '}
                      • {selectedSupervisor.designation}
                      {selectedSupervisor.workstation && (
                        <span className="text-slate-500 dark:text-slate-400 font-normal">
                          {' '}
                          [{selectedSupervisor.workstation}]
                        </span>
                      )}
                    </div>
                    {selectedSupervisor.shift && (
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                        Shift: {selectedSupervisor.shift}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <a
                    href={`tel:${selectedSupervisor.mobileNumber}`}
                    className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-mono text-[11px] font-bold flex items-center gap-1 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-xs"
                    title="Direct Phone Call"
                  >
                    <Phone className="w-3 h-3 text-emerald-600" />
                    <span>{selectedSupervisor.mobileNumber}</span>
                  </a>
                  {selectedSupervisor.email && (
                    <a
                      href={`mailto:${selectedSupervisor.email}`}
                      className="p-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:text-slate-800 dark:hover:text-white transition-colors"
                      title={selectedSupervisor.email}
                    >
                      <Mail className="w-3.5 h-3.5" />
                    </a>
                  )}
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

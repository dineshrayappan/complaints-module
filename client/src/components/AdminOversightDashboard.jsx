import React, { useState, useEffect } from 'react';
import {
  Crown,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Wrench,
  Activity,
  ArrowRight,
  TrendingUp,
  Building2,
  RefreshCw,
  Eye,
  AlertOctagon,
  Flame,
  MessageSquare,
  Sparkles,
  Search,
} from 'lucide-react';
import { complaintService } from '../services/api';
import { supabase } from '../services/supabase';

export const AdminOversightDashboard = ({ onViewComplaint }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activityFilter, setActivityFilter] = useState('ALL'); // 'ALL', 'AUDITOR', 'SUPERVISOR', 'WARNINGS'
  const [searchQuery, setSearchQuery] = useState('');

  const loadOversightData = async (showSpinner = false) => {
    try {
      if (showSpinner) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }
      const res = await complaintService.getAdminOversight();
      if (res.data?.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load admin oversight data:', err);
    } finally {
      if (showSpinner) setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadOversightData(true);

    const interval = setInterval(() => {
      loadOversightData(false);
    }, 4000);

    const handleFocus = () => {
      loadOversightData(false);
    };

    window.addEventListener('focus', handleFocus);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadOversightData(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // Realtime push subscription for Admin Oversight
  useEffect(() => {
    if (!supabase) return;

    try {
      const channel = supabase
        .channel('admin-oversight-feed')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'complaints' },
          () => {
            loadOversightData(false);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.warn('[Realtime] Oversight subscription notice:', err.message);
    }
  }, []);

  if (loading && !data) {
    return (
      <div className="p-16 text-center text-slate-400 dark:text-slate-500 font-mono text-xs flex flex-col items-center justify-center">
        <div className="w-9 h-9 rounded-xl border-3 border-amber-500 border-t-transparent animate-spin mb-3" />
        <span>Aggregating Factory Operations & Auditor/Supervisor Telemetry...</span>
      </div>
    );
  }

  const bottlenecks = data?.bottlenecks || {};
  const supervisorScorecard = data?.supervisorScorecard || [];
  const auditorActivity = data?.auditorActivity || {};
  const activityStream = data?.activityStream || [];

  // Filter activity stream
  const filteredActivities = activityStream.filter((item) => {
    if (activityFilter === 'AUDITOR') {
      return item.performedBy?.role === 'AUDITOR';
    }
    if (activityFilter === 'SUPERVISOR') {
      return item.performedBy?.role === 'ACTION_PERSON' || item.performedBy?.role === 'SUPERVISOR';
    }
    if (activityFilter === 'WARNINGS') {
      return item.action === 'REJECTED' || item.currentStatus === 'Overdue';
    }
    return true;
  }).filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.complaintId?.toLowerCase().includes(q) ||
      item.performedBy?.name?.toLowerCase().includes(q) ||
      item.department?.toLowerCase().includes(q) ||
      item.notes?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner & Control Bar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-rose-500/10 border border-amber-300/40 dark:border-amber-700/30 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 sm:gap-4 shadow-sm backdrop-blur-md">
        <div className="flex items-start sm:items-center gap-3 sm:gap-3.5">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20 shrink-0">
            <Crown className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Executive Operations Control Center
              </h2>
              <span className="px-2 py-0.5 text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider rounded-md bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                Live
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              Continuous monitoring of Auditor defect logging vs Supervisor resolution • Bottlenecks & Inaction detection
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between lg:justify-end gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-amber-200/50 dark:border-amber-900/40">
          <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            Telemetry: {new Date(data?.timestamp || Date.now()).toLocaleTimeString()}
          </span>
          <button
            onClick={() => loadOversightData(false)}
            disabled={isRefreshing || loading}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold shadow-2xs transition-colors cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: INACTION & BOTTLENECK RADAR (WHAT THEY ARE NOT DOING) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-rose-500" />
            <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
              Inaction & Bottleneck Radar
            </h3>
          </div>
          <span className="text-[10px] sm:text-[11px] text-slate-400 font-mono">12–24h SLA Enforcement</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* 1. Breached SLAs */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              bottlenecks.totalBreachedSlas > 0
                ? 'bg-rose-50/80 border-rose-200 dark:bg-rose-950/40 dark:border-rose-900/60 shadow-sm'
                : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Flame className={`w-4 h-4 ${bottlenecks.totalBreachedSlas > 0 ? 'text-rose-600 animate-pulse' : 'text-slate-400'}`} />
                SLA Breaches (Overdue)
              </span>
              <span
                className={`text-xs font-mono font-extrabold px-2 py-0.5 rounded-full ${
                  bottlenecks.totalBreachedSlas > 0
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {bottlenecks.totalBreachedSlas}
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {bottlenecks.totalBreachedSlas}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
              {bottlenecks.totalBreachedSlas > 0
                ? 'Supervisors failed to resolve defect within mandatory 12–24h window.'
                : 'Zero overdue defects. All lines meeting closed-loop SLA targets.'}
            </p>
          </div>

          {/* 2. Unstarted Assigned Defects */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              bottlenecks.totalUnstartedTickets > 0
                ? 'bg-amber-50/80 border-amber-200 dark:bg-amber-950/40 dark:border-amber-900/60 shadow-sm'
                : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Clock className={`w-4 h-4 ${bottlenecks.totalUnstartedTickets > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
                Unstarted Defects
              </span>
              <span
                className={`text-xs font-mono font-extrabold px-2 py-0.5 rounded-full ${
                  bottlenecks.totalUnstartedTickets > 0
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {bottlenecks.totalUnstartedTickets}
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {bottlenecks.totalUnstartedTickets}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
              {bottlenecks.totalUnstartedTickets > 0
                ? 'Tickets assigned by auditor where supervisor has NOT started rectification.'
                : 'All assigned complaints have active progress started.'}
            </p>
          </div>

          {/* 3. Pending Audit Sign-Offs */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              bottlenecks.totalPendingAuditorSignOffs > 0
                ? 'bg-purple-50/80 border-purple-200 dark:bg-purple-950/40 dark:border-purple-900/60 shadow-sm'
                : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className={`w-4 h-4 ${bottlenecks.totalPendingAuditorSignOffs > 0 ? 'text-purple-600' : 'text-slate-400'}`} />
                Awaiting Auditor Sign-Off
              </span>
              <span
                className={`text-xs font-mono font-extrabold px-2 py-0.5 rounded-full ${
                  bottlenecks.totalPendingAuditorSignOffs > 0
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {bottlenecks.totalPendingAuditorSignOffs}
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {bottlenecks.totalPendingAuditorSignOffs}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
              {bottlenecks.totalPendingAuditorSignOffs > 0
                ? 'Supervisor submitted proof photo; Auditor has NOT verified or closed.'
                : 'No pending proof verifications queued for auditor.'}
            </p>
          </div>

          {/* 4. Rejected Tickets Awaiting Rework */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              bottlenecks.totalRejectedAwaitingRework > 0
                ? 'bg-orange-50/80 border-orange-200 dark:bg-orange-950/40 dark:border-orange-900/60 shadow-sm'
                : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <XCircle className={`w-4 h-4 ${bottlenecks.totalRejectedAwaitingRework > 0 ? 'text-orange-600' : 'text-slate-400'}`} />
                Rejections Awaiting Rework
              </span>
              <span
                className={`text-xs font-mono font-extrabold px-2 py-0.5 rounded-full ${
                  bottlenecks.totalRejectedAwaitingRework > 0
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {bottlenecks.totalRejectedAwaitingRework}
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {bottlenecks.totalRejectedAwaitingRework}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
              {bottlenecks.totalRejectedAwaitingRework > 0
                ? 'Auditor rejected proof & returned ticket; supervisor must re-rectify.'
                : 'Zero active defect rejections pending line re-work.'}
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 2: SUPERVISOR ACCOUNTABILITY SCORECARD & AUDITOR ACTIVITY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Supervisor Line-by-Line Table (2 Cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                <Wrench className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Line Supervisor Accountability Scorecard
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Performance and inaction tracking across all factory sections
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto no-scrollbar sm:overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-slate-800 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  <th className="py-2.5 px-3">Line & Supervisor</th>
                  <th className="py-2.5 px-2 text-center">Assigned</th>
                  <th className="py-2.5 px-2 text-center">Unstarted</th>
                  <th className="py-2.5 px-2 text-center">In Progress</th>
                  <th className="py-2.5 px-2 text-center">Under Review</th>
                  <th className="py-2.5 px-2 text-center">Closed</th>
                  <th className="py-2.5 px-2 text-center">Overdue</th>
                  <th className="py-2.5 px-3 text-right">SLA Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {supervisorScorecard.map((sup) => (
                  <tr key={sup._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {sup.name}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                        {sup.department} • {sup.employeeId}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center font-bold text-slate-700 dark:text-slate-200">
                      {sup.totalAssigned}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span
                        className={`px-1.5 py-0.5 rounded font-mono font-bold text-[10px] ${
                          sup.unstartedCount > 0
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'text-slate-400'
                        }`}
                      >
                        {sup.unstartedCount}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center text-blue-600 dark:text-blue-400 font-mono font-bold">
                      {sup.inProgressCount}
                    </td>
                    <td className="py-3 px-2 text-center text-purple-600 dark:text-purple-400 font-mono font-bold">
                      {sup.underVerificationCount}
                    </td>
                    <td className="py-3 px-2 text-center text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                      {sup.closedCount}
                    </td>
                    <td className="py-3 px-2 text-center">
                      {sup.overdueCount > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white font-mono font-bold text-[10px] animate-pulse">
                          {sup.overdueCount} 🚨
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono">0</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          {sup.complianceRate}%
                        </span>
                        <div className="w-12 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden hidden sm:block">
                          <div
                            className={`h-full rounded-full ${
                              sup.complianceRate >= 90
                                ? 'bg-emerald-500'
                                : sup.complianceRate >= 70
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${sup.complianceRate}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Auditor Quality Inspection Activity Card (1 Col) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Auditor Quality Governance
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Defects logged, severity profile & sign-off velocity
                </p>
              </div>
            </div>

            {/* Total Defects Metric */}
            <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 mb-4">
              <div className="text-[11px] font-bold text-indigo-900 dark:text-indigo-200 uppercase tracking-wider">
                Total Plant Defects Logged
              </div>
              <div className="text-3xl font-black text-indigo-700 dark:text-indigo-300 mt-0.5">
                {auditorActivity.totalDefectsLogged || 0}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                <span>Closed: <strong>{auditorActivity.closedComplaints || 0}</strong></span>
                <span>•</span>
                <span>Awaiting Review: <strong className="text-purple-600 dark:text-purple-400">{auditorActivity.pendingAuditorSignOff || 0}</strong></span>
              </div>
            </div>

            {/* Severity Distribution */}
            <div className="space-y-2 mb-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Defect Severity Breakdown
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-bold">
                    <span className="w-2 h-2 rounded-full bg-rose-600" /> Critical Defect
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {auditorActivity.severityBreakdown?.critical || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold">
                    <span className="w-2 h-2 rounded-full bg-amber-500" /> High Severity
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {auditorActivity.severityBreakdown?.high || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold">
                    <span className="w-2 h-2 rounded-full bg-blue-500" /> Medium
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {auditorActivity.severityBreakdown?.medium || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-500 font-bold">
                    <span className="w-2 h-2 rounded-full bg-slate-400" /> Low
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {auditorActivity.severityBreakdown?.low || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Active Auditor List */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Designated Quality Auditors
            </div>
            {auditorActivity.auditorsList?.map((aud) => (
              <div key={aud._id} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-xs">
                    {aud.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {aud.name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {aud.employeeId} • {aud.department}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                  {aud.ticketsLogged} logged
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 3: LIVE PLANT AUDIT TRAIL STREAM ("WHO DID WHAT & WHEN") */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Cross-Factory Live Audit Trail Stream
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Chronological event stream of Auditor inspections vs Supervisor rectifications
              </p>
            </div>
          </div>

          {/* Filter Pills with Horizontal Scroll on Mobile */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl overflow-x-auto no-scrollbar w-full sm:w-auto">
            <button
              onClick={() => setActivityFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap shrink-0 ${
                activityFilter === 'ALL'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All ({activityStream.length})
            </button>
            <button
              onClick={() => setActivityFilter('AUDITOR')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap shrink-0 ${
                activityFilter === 'AUDITOR'
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'text-slate-500 hover:text-purple-600'
              }`}
            >
              Auditors
            </button>
            <button
              onClick={() => setActivityFilter('SUPERVISOR')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap shrink-0 ${
                activityFilter === 'SUPERVISOR'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-500 hover:text-emerald-600'
              }`}
            >
              Supervisors
            </button>
            <button
              onClick={() => setActivityFilter('WARNINGS')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap shrink-0 ${
                activityFilter === 'WARNINGS'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'text-slate-500 hover:text-rose-600'
              }`}
            >
              Warnings
            </button>
          </div>
        </div>

        {/* Search in audit trail */}
        <div className="relative mb-3 sm:mb-4">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ticket ID (e.g. CMP-10492), actor name, or notes..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Timeline Events List */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800/70 max-h-[420px] overflow-y-auto pr-1">
          {filteredActivities.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 font-mono">
              No matching activity events found.
            </div>
          ) : (
            filteredActivities.map((event, idx) => {
              const isAud = event.performedBy?.role === 'AUDITOR';
              const isSup = event.performedBy?.role === 'ACTION_PERSON' || event.performedBy?.role === 'SUPERVISOR';
              const isRejected = event.action === 'REJECTED';
              const isClosed = event.action === 'CLOSED';
              const isSubmitted = event.action === 'ACTION_SUBMITTED';

              return (
                <div key={idx} className="py-3 flex items-start gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 px-2 rounded-xl transition-colors">
                  {/* Action Icon Badge */}
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white shadow-2xs ${
                      isRejected
                        ? 'bg-rose-600'
                        : isClosed
                        ? 'bg-emerald-600'
                        : isSubmitted
                        ? 'bg-purple-600'
                        : isAud
                        ? 'bg-indigo-600'
                        : 'bg-teal-600'
                    }`}
                  >
                    {isRejected ? (
                      <XCircle className="w-4 h-4" />
                    ) : isClosed ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : isAud ? (
                      <ShieldCheck className="w-4 h-4" />
                    ) : (
                      <Wrench className="w-4 h-4" />
                    )}
                  </div>

                  {/* Event Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                          {event.performedBy?.name}
                        </span>
                        <span
                          className={`text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded border ${
                            isAud
                              ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                          }`}
                        >
                          {isAud ? 'Auditor' : 'Supervisor'}
                        </span>
                        <span className="text-slate-400 text-xs">•</span>
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                          {event.action.replace('_', ' ')}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(event.timestamp).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      {event.notes}
                    </p>

                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400 font-mono">
                      <button
                        onClick={() => onViewComplaint && onViewComplaint({ complaintId: event.complaintId, _id: event.complaintId })}
                        className="text-indigo-600 dark:text-cyan-400 hover:underline font-bold"
                      >
                        {event.complaintId}
                      </button>
                      <span>•</span>
                      <span>{event.department}</span>
                      <span>•</span>
                      <span>{event.category}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminOversightDashboard;

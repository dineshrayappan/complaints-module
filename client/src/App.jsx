import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutGrid,
  List,
  PlusCircle,
  CheckCircle2,
  Factory,
  CheckCheck,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import { complaintService } from './services/api';
import { supabase } from './services/supabase';
import Header from './components/Header';
import KpiMetrics from './components/KpiMetrics';
import ComplaintFilters from './components/ComplaintFilters';
import ComplaintCard from './components/ComplaintCard';
import ComplaintTable from './components/ComplaintTable';
import NewComplaintModal from './components/NewComplaintModal';
import ActionTakenModal from './components/ActionTakenModal';
import ComplaintDetailModal from './components/ComplaintDetailModal';
import LoginPage from './components/LoginPage';
import AdminOversightDashboard from './components/AdminOversightDashboard';
import AdminUserManagement from './components/AdminUserManagement';
import { Crown, BarChart3, Users } from 'lucide-react';

export const App = () => {
  const { user, isAdmin, isAuditor, isActionPerson } = useAuth();
  const { isDark } = useTheme();

  // Data State
  const [complaints, setComplaints] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Filter States
  const [activeTab, setActiveTab] = useState('all');
  const [adminActiveTab, setAdminActiveTab] = useState('oversight'); // 'oversight' or 'register'
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'

  // Modal States
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Prevent jarring full-screen loading spinner on background updates / tab changes
  const initialLoadedRef = useRef(false);

  // Load complaints and metrics with silent background refresh capability
  const loadData = useCallback(async (showSpinner = false) => {
    if (!user) return;
    const isExplicitSpinner = showSpinner === true;
    try {
      if (isExplicitSpinner && !initialLoadedRef.current) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }

      const params = {
        tab: activeTab,
        category: categoryFilter || undefined,
        priority: priorityFilter || undefined,
        search: searchTerm || undefined,
      };

      const [complaintsRes, metricsRes] = await Promise.all([
        complaintService.getComplaints(params),
        complaintService.getKpiStats(),
      ]);

      if (complaintsRes.data?.success) {
        const incoming = complaintsRes.data.complaints || [];
        setComplaints((prev) => {
          const incomingIds = new Set(
            incoming.map((c) => String(c._id || c.id || c.complaintId))
          );
          // Protect any recently created optimistic ticket that might still be propagating to database
          const optimisticPending = prev.filter(
            (c) => c._isOptimistic && !incomingIds.has(String(c._id || c.id || c.complaintId))
          );
          return [...optimisticPending, ...incoming];
        });
      }

      if (metricsRes.data?.success) {
        setMetrics(metricsRes.data.metrics);
      }
    } catch (err) {
      console.error('Error fetching complaints data:', err);
    } finally {
      initialLoadedRef.current = true;
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [user, activeTab, categoryFilter, priorityFilter, searchTerm]);

  // Initial load
  useEffect(() => {
    loadData(!initialLoadedRef.current);
  }, [loadData]);

  // Periodic Auto-Refresh: Poll every 4 seconds silently so changes appear instantly across all users & devices
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      loadData(false);
    }, 4000);

    const handleFocus = () => {
      loadData(false);
    };

    window.addEventListener('focus', handleFocus);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadData(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [loadData, user]);

  // Real-time Push: Subscribe to Supabase database changes for sub-second instant updates
  useEffect(() => {
    if (!supabase || !user) return;

    try {
      const channel = supabase
        .channel('complaints-live-feed')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'complaints' },
          (payload) => {
            console.log('⚡ [Realtime] Live database mutation detected:', payload.eventType);
            loadData(false);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.warn('[Realtime] Subscription notice:', err.message);
    }
  }, [loadData, user]);

  // Handle Start Progress (Line Supervisor)
  const handleStartProgress = async (complaint) => {
    try {
      const res = await complaintService.markInProgress(complaint._id);
      if (res.data?.success) {
        showToast(`Ticket ${complaint.complaintId} marked In Progress`);
        setComplaints((prev) =>
          prev.map((c) =>
            (c._id || c.id) === (complaint._id || complaint.id) || c.complaintId === complaint.complaintId
              ? { ...c, status: 'In Progress' }
              : c
          )
        );
        loadData(false);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  // Open Action modal
  const handleOpenActionModal = (complaint) => {
    setSelectedComplaint(complaint);
    setIsActionModalOpen(true);
  };

  // Open Detail modal
  const handleOpenDetailModal = async (complaintOrId) => {
    if (!complaintOrId) return;
    if (complaintOrId.description) {
      setSelectedComplaint(complaintOrId);
      setIsDetailModalOpen(true);
      return;
    }
    const targetId = complaintOrId._id || complaintOrId.id || complaintOrId.complaintId || complaintOrId;
    const localMatch = complaints.find(
      (c) => (c._id || c.id) === targetId || c.complaintId === targetId
    );
    if (localMatch) {
      setSelectedComplaint(localMatch);
      setIsDetailModalOpen(true);
    } else {
      try {
        const res = await complaintService.getComplaintById(targetId);
        if (res.data?.success) {
          setSelectedComplaint(res.data.complaint);
          setIsDetailModalOpen(true);
        }
      } catch (err) {
        console.error('Failed to load complaint for modal:', err);
      }
    }
  };

  // On ticket created: Optimistic instant display + reset filters + background sync
  const handleNewComplaintSuccess = (newTicket) => {
    showToast(`Defect ${newTicket?.complaintId || 'Ticket'} logged & live synced!`);

    // Reset filters so the new ticket is immediately visible
    setCategoryFilter('');
    setPriorityFilter('');
    setSearchTerm('');
    setActiveTab('all');

    if (newTicket) {
      const ticketId = newTicket._id || newTicket.id;
      const optimisticTicket = { ...newTicket, _isOptimistic: true };
      setComplaints((prev) => {
        const withoutCurrent = prev.filter(
          (c) => (c._id || c.id) !== ticketId && c.complaintId !== newTicket.complaintId
        );
        return [optimisticTicket, ...withoutCurrent];
      });
    }

    // Refresh KPI metrics quietly in background
    complaintService.getKpiStats().then((res) => {
      if (res.data?.success) {
        setMetrics(res.data.metrics);
      }
    }).catch(() => {});
  };

  // On action submitted: Optimistic update + silent refresh
  const handleActionSuccess = (updatedTicket) => {
    showToast(`Proof for ${updatedTicket?.complaintId || 'Ticket'} submitted for Audit Verification!`);
    setActiveTab('all');
    if (updatedTicket) {
      const ticketId = updatedTicket._id || updatedTicket.id;
      setComplaints((prev) =>
        prev.map((c) =>
          (c._id || c.id) === ticketId || c.complaintId === updatedTicket.complaintId
            ? { ...c, ...updatedTicket }
            : c
        )
      );
      if (
        selectedComplaint &&
        ((selectedComplaint._id || selectedComplaint.id) === ticketId ||
          selectedComplaint.complaintId === updatedTicket.complaintId)
      ) {
        setSelectedComplaint(updatedTicket);
      }
    }
    loadData(false);
  };

  // On ticket update from detail modal
  const handleComplaintUpdated = (updatedTicket) => {
    if (updatedTicket) {
      const ticketId = updatedTicket._id || updatedTicket.id;
      setSelectedComplaint(updatedTicket);
      setComplaints((prev) =>
        prev.map((c) =>
          (c._id || c.id) === ticketId || c.complaintId === updatedTicket.complaintId
            ? { ...c, ...updatedTicket }
            : c
        )
      );
      showToast(`Ticket ${updatedTicket.complaintId} updated successfully.`);
    }
    loadData(false);
  };

  // Render dedicated Login Page when not authenticated
  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-900 text-white dark:bg-emerald-600 dark:text-white font-bold text-xs shadow-xl animate-bounce">
          <CheckCheck className="w-4 h-4 text-emerald-400 dark:text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation Header */}
      <Header
        onOpenNewComplaint={() => setIsNewModalOpen(true)}
        onRefresh={() => loadData(false)}
        isRefreshing={isRefreshing}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Active Persona Banner */}
        <div className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 text-xs mb-3.5 sm:mb-4 shadow-xs transition-colors">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <span className="flex h-2.5 w-2.5 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-slate-600 dark:text-slate-300 truncate">
              Active Persona:{' '}
              <strong className="text-slate-900 dark:text-white font-bold">{user?.name}</strong>{' '}
              <span className="text-indigo-600 dark:text-cyan-400 font-mono font-semibold">({user?.employeeId}</span> •{' '}
              <span className="text-slate-500 dark:text-slate-400">{user?.department})</span>
            </span>
          </div>

          <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-mono shrink-0">
            <span>
              Scope:{' '}
              <strong className="text-slate-700 dark:text-slate-200 font-semibold">
                {isAdmin
                  ? 'Executive Oversight'
                  : isAuditor
                  ? 'All 4 Plant Lines'
                  : user?.department}
              </strong>
            </span>
            <span>•</span>
            <span>12–24h SLA</span>
          </div>
        </div>

        {/* Executive Admin Mode Navigation Toggle */}
        {isAdmin && (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 sm:p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 mb-5 sm:mb-6 backdrop-blur-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs shrink-0">
                <Crown className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-amber-950 dark:text-amber-300 flex items-center gap-1.5">
                  <span>Executive Admin Operations Suite</span>
                  <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                    Live
                  </span>
                </h2>
                <p className="text-[10px] sm:text-[11px] text-amber-900/80 dark:text-amber-400/80 hidden sm:block">
                  Real-time accountability tracking for Auditors & Supervisors, SLA breaches, and audit trails
                </p>
              </div>
            </div>

            {/* Horizontally scrollable on mobile */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-amber-500/20 shadow-xs overflow-x-auto no-scrollbar w-full md:w-auto">
              <button
                onClick={() => setAdminActiveTab('oversight')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                  adminActiveTab === 'oversight'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Crown className="w-3.5 h-3.5" />
                <span>Oversight</span>
              </button>

              <button
                onClick={() => setAdminActiveTab('users')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                  adminActiveTab === 'users'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Personnel</span>
              </button>

              <button
                onClick={() => setAdminActiveTab('register')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                  adminActiveTab === 'register'
                    ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Defect Register ({complaints.length})</span>
              </button>
            </div>
          </div>
        )}

        {/* View Selection: Executive Oversight, User Management, or Plant Defect Register */}
        {isAdmin && adminActiveTab === 'oversight' ? (
          <AdminOversightDashboard onViewComplaint={handleOpenDetailModal} />
        ) : isAdmin && adminActiveTab === 'users' ? (
          <AdminUserManagement />
        ) : (
          <>
            {/* KPI Metric Cards */}
            <KpiMetrics metrics={metrics} onSelectTab={(tab) => setActiveTab(tab)} />

            {/* Filters & Search Navigation */}
            <ComplaintFilters
              activeTab={activeTab}
              onTabChange={setActiveTab}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              categoryFilter={categoryFilter}
              onCategoryChange={setCategoryFilter}
              priorityFilter={priorityFilter}
              onPriorityChange={setPriorityFilter}
              onRefresh={() => loadData(false)}
              loading={isRefreshing}
              counts={metrics}
            />

            {/* View Mode Bar */}
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Showing{' '}
                <span className="text-slate-900 dark:text-white font-bold">{complaints.length}</span>{' '}
                Defect Tickets
              </div>

              <div className="flex items-center bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <button
                  onClick={() => setViewMode('cards')}
                  title="Card Grid View"
                  className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                    viewMode === 'cards'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  title="Dense Table View"
                  className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                    viewMode === 'table'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Complaints Presentation */}
            {loading ? (
              <div className="p-16 text-center text-slate-400 dark:text-slate-500 font-mono text-xs flex flex-col items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin mb-3" />
                <span>Scanning Factory Floor Defects...</span>
              </div>
            ) : complaints.length === 0 ? (
              <div className="p-16 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800/80 text-center flex flex-col items-center justify-center my-6 shadow-xs">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                  Zero Active Defects Found
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mb-5 leading-relaxed">
                  No complaint tickets match the current filter. All production lines are operating within AQL 1.5 quality standards.
                </p>
                {isAuditor && (
                  <button
                    onClick={() => setIsNewModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-colors"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Log New Defect</span>
                  </button>
                )}
              </div>
            ) : viewMode === 'cards' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {complaints.map((c) => (
                  <ComplaintCard
                    key={c._id}
                    complaint={c}
                    onViewDetails={handleOpenDetailModal}
                    onStartProgress={handleStartProgress}
                    onSubmitAction={handleOpenActionModal}
                  />
                ))}
              </div>
            ) : (
              <ComplaintTable
                complaints={complaints}
                onViewDetails={handleOpenDetailModal}
                onStartProgress={handleStartProgress}
                onSubmitAction={handleOpenActionModal}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-950 border-t border-slate-200/90 dark:border-slate-900 py-6 text-center text-xs text-slate-500 transition-colors">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Factory className="w-4 h-4 text-slate-400 dark:text-slate-600" />
            <span className="font-medium text-slate-600 dark:text-slate-400">
              Textile & Garment QMS • Closed-Loop Defect Rectification Architecture
            </span>
          </div>
          <div className="font-mono text-[11px] text-slate-400 dark:text-slate-600">
            SLA Standard: 12h–24h • Camera Rear Capture • HTML5 Canvas WebP
          </div>
        </div>
      </footer>

      {/* Modals */}
      <NewComplaintModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSuccess={handleNewComplaintSuccess}
      />

      <ActionTakenModal
        complaint={selectedComplaint}
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        onSuccess={handleActionSuccess}
      />

      <ComplaintDetailModal
        complaint={selectedComplaint}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onUpdateComplaint={handleComplaintUpdated}
        onStartProgress={handleStartProgress}
        onSubmitAction={handleOpenActionModal}
      />
    </div>
  );
};

export default App;

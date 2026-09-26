import React from 'react';
import {
  Camera,
  Layers,
  Building2,
  Sun,
  Moon,
  LogOut,
  ShieldCheck,
  Wrench,
  Crown,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export const Header = ({ onOpenNewComplaint, onRefresh, isRefreshing }) => {
  const { user, isAdmin, isAuditor, isSupervisor, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="bg-white/95 dark:bg-slate-900/95 border-b border-slate-200/90 dark:border-slate-800/90 sticky top-0 z-30 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo & Plant Metadata */}
          <div className="flex items-center space-x-2.5 sm:space-x-3.5 min-w-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 p-0.5 shadow-md shadow-indigo-500/20 flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-white dark:bg-slate-950 rounded-[9px] sm:rounded-[10px] flex items-center justify-center">
                <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-cyan-400" />
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-sm sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight font-sans truncate">
                  TEXTILE QMS
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/70 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  <span className="hidden xs:inline">Plant QMS</span>
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-sans hidden sm:flex items-center gap-1.5 truncate">
                <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">Apparel Unit #4 • 12–24h Closed-Loop SLA</span>
              </p>
            </div>
          </div>

          {/* Right Actions: Theme Toggle, User Profile, Sign Out, & Log Defect Button */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Refresh Data Button */}
            {onRefresh && (
              <button
                onClick={onRefresh}
                type="button"
                id="btn-refresh-data"
                title="Refresh and reload all saved defect records"
                className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all shadow-xs cursor-pointer flex items-center gap-2"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 text-indigo-600 dark:text-cyan-400 transition-transform ${
                    isRefreshing ? 'animate-spin' : ''
                  }`}
                />
                <span className="text-[10px] sm:text-[11px] font-bold tracking-tight select-none">
                  {isRefreshing ? 'Refreshing...' : 'Refresh'}
                </span>
              </button>
            )}

            {/* Theme Toggle (Daylight Clean vs Night Shift) */}
            <button
              onClick={toggleTheme}
              title={isDark ? 'Switch to Daylight Clean Mode' : 'Switch to Night Shift Mode'}
              className="p-2 sm:p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-xs cursor-pointer"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>

            {/* Logged in User Profile Card */}
            <div className="flex items-center gap-2 sm:gap-2.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 shadow-2xs">
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center font-bold text-xs text-white shadow-xs shrink-0 ${
                  isAdmin
                    ? 'bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500'
                    : isAuditor
                    ? 'bg-gradient-to-tr from-purple-600 to-indigo-600'
                    : 'bg-gradient-to-tr from-emerald-600 to-teal-600'
                }`}
                title={`${user?.name} (${user?.employeeId})`}
              >
                {isAdmin ? <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : user?.name?.charAt(0) || 'U'}
              </div>

              {/* Text metadata: visible on sm+ screens, compact on mobile */}
              <div className="flex flex-col max-w-[90px] sm:max-w-none">
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <span className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-white leading-tight truncate">
                    {user?.name}
                  </span>
                  <span
                    className={`hidden sm:inline-block text-[9px] font-extrabold font-mono uppercase px-1.5 py-0.2 rounded border ${
                      isAdmin
                        ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-700'
                        : isAuditor
                        ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                    }`}
                  >
                    {user?.employeeId}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1 truncate">
                  {isAdmin ? (
                    <>
                      <Crown className="w-3 h-3 text-amber-500 shrink-0" />
                      <span className="font-semibold text-amber-600 dark:text-amber-400 truncate">Admin</span>
                    </>
                  ) : isAuditor ? (
                    <>
                      <ShieldCheck className="w-3 h-3 text-purple-600 dark:text-purple-400 shrink-0" />
                      <span className="truncate">Auditor</span>
                    </>
                  ) : (
                    <>
                      <Wrench className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="truncate">{user?.department || 'Supervisor'}</span>
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Sign Out Button */}
            <button
              onClick={logout}
              id="btn-sign-out"
              title="Sign out back to login screen"
              className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:border-rose-900 dark:hover:text-rose-300 text-slate-600 dark:text-slate-300 font-semibold text-xs transition-colors shadow-xs cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Sign Out</span>
            </button>

            {/* Log Defect Button (Auditors only) */}
            {isAuditor && (
              <button
                onClick={onOpenNewComplaint}
                id="btn-log-new-complaint"
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-indigo-600/25 transition-all transform active:scale-95 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Log Defect</span>
                <span className="xs:hidden">Log</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export const Header = ({ onOpenNewComplaint }) => {
  const { user, isAdmin, isAuditor, isSupervisor, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="bg-white/90 dark:bg-slate-900/90 border-b border-slate-200/90 dark:border-slate-800/90 sticky top-0 z-30 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo & Plant Metadata */}
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 p-0.5 shadow-md shadow-indigo-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-white dark:bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Layers className="w-5 h-5 text-indigo-600 dark:text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight font-sans">
                  TEXTILE QMS
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/70 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Cycle
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-sans flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                Apparel Unit #4 • 12–24h Closed-Loop SLA
              </p>
            </div>
          </div>

          {/* Right Actions: Theme Toggle, User Profile, Sign Out, & Log Defect Button */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle (Daylight Clean vs Night Shift) */}
            <button
              onClick={toggleTheme}
              title={isDark ? 'Switch to Daylight Clean Mode' : 'Switch to Night Shift Mode'}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-xs cursor-pointer"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>

            {/* Logged in User Profile Card */}
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 shadow-2xs">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs text-white shadow-xs shrink-0 ${
                  isAdmin
                    ? 'bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500'
                    : isAuditor
                    ? 'bg-gradient-to-tr from-purple-600 to-indigo-600'
                    : 'bg-gradient-to-tr from-emerald-600 to-teal-600'
                }`}
              >
                {isAdmin ? <Crown className="w-4 h-4" /> : user?.name?.charAt(0) || 'U'}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                    {user?.name}
                  </span>
                  <span
                    className={`text-[9px] font-extrabold font-mono uppercase px-1.5 py-0.2 rounded border ${
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
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                  {isAdmin ? (
                    <>
                      <Crown className="w-3 h-3 text-amber-500" />
                      <span className="font-semibold text-amber-600 dark:text-amber-400">Executive Admin</span>
                    </>
                  ) : isAuditor ? (
                    <>
                      <ShieldCheck className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                      <span>Quality Auditor</span>
                    </>
                  ) : (
                    <>
                      <Wrench className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span>{user?.department || 'Line Supervisor'}</span>
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
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:border-rose-900 dark:hover:text-rose-300 text-slate-600 dark:text-slate-300 font-semibold text-xs transition-colors shadow-xs cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>

            {/* Log Defect Button (Auditors only) */}
            {isAuditor && (
              <button
                onClick={onOpenNewComplaint}
                id="btn-log-new-complaint"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-indigo-600/25 transition-all transform active:scale-95 cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>Log Defect</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

import React, { useState } from 'react';
import {
  Crown,
  ShieldCheck,
  Wrench,
  Layers,
  Building2,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  ArrowRight,
  Sun,
  Moon,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Phone,
  Briefcase,
  Mail,
  Hash,
  BarChart3,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export const LoginPage = () => {
  const { login, register, demoUsers, switchUser } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  // Active portal: 'ADMIN', 'AUDITOR', or 'SUPERVISOR'
  const [activePortal, setActivePortal] = useState('ADMIN');
  
  // Credentials
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('Password123!');
  const [showPassword, setShowPassword] = useState(false);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Register modal / form toggle
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [regData, setRegData] = useState({
    role: 'ADMIN',
    name: '',
    employeeId: '',
    email: '',
    password: 'Password123!',
    department: 'Plant Operations & Executive Oversight',
    designation: 'Operations Director',
    mobileNumber: '+91 98000 11223',
  });
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');

  // Filter demo users by role
  const adminUsers = demoUsers.filter((u) => u.role === 'ADMIN');
  const auditorUsers = demoUsers.filter((u) => u.role === 'AUDITOR');
  const supervisorUsers = demoUsers.filter(
    (u) => u.role === 'ACTION_PERSON' || u.role === 'SUPERVISOR'
  );

  const handlePortalSwitch = (portal) => {
    setActivePortal(portal);
    setErrorMessage('');
    setSuccessMessage('');
    setIdentifier('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!identifier.trim()) {
      setErrorMessage('Please enter your Employee ID or Email.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setLoading(true);
    const expectedRole = activePortal;
    const result = await login(identifier, password, expectedRole);

    if (!result.success) {
      setErrorMessage(result.message);
      setLoading(false);
    } else {
      setSuccessMessage('Authentication successful. Loading workspace...');
    }
  };

  const handleQuickDemoLogin = async (userObj) => {
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);
    try {
      const res = await switchUser(userObj._id);
      if (res && !res.success) {
        setErrorMessage(res.message || 'Failed to sign in with selected profile.');
        setLoading(false);
      }
    } catch (err) {
      setErrorMessage('Failed to sign in with demo profile.');
      setLoading(false);
    }
  };

  // Direct login for default admin if not yet loaded in demoUsers list
  const handleQuickAdminDefault = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);
    const result = await login('ADM-001', 'Password123!', 'ADMIN');
    if (!result.success) {
      // Try with email
      const fallbackResult = await login('admin@factory.com', 'Password123!', 'ADMIN');
      if (!fallbackResult.success) {
        setErrorMessage(fallbackResult.message);
        setLoading(false);
      }
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegError('');
    setRegLoading(true);

    const res = await register(regData);
    if (!res.success) {
      setRegError(res.message);
      setRegLoading(false);
    } else {
      setIsRegisterOpen(false);
      setSuccessMessage(`Account created for ${res.user.name}! Logging in...`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between font-sans transition-colors relative overflow-hidden">
      {/* Background Ambience / Glow effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-40 -right-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <nav className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between z-10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 p-0.5 shadow-md shadow-indigo-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-white dark:bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Layers className="w-5 h-5 text-indigo-600 dark:text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                TEXTILE QMS
              </span>
              <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/70 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20">
                Unit #4
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Plant Quality Management & Executive Oversight
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            type="button"
            title={isDark ? 'Switch to Light Daylight Mode' : 'Switch to Night Shift Mode'}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-xs backdrop-blur-md"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* New User Modal Trigger */}
          <button
            onClick={() => {
              setRegData((prev) => ({
                ...prev,
                role: activePortal === 'ADMIN' ? 'ADMIN' : activePortal === 'AUDITOR' ? 'AUDITOR' : 'ACTION_PERSON',
                department:
                  activePortal === 'ADMIN'
                    ? 'Plant Operations & Executive Oversight'
                    : activePortal === 'AUDITOR'
                    ? 'Central Quality Audit'
                    : 'Sewing Line 3',
                designation:
                  activePortal === 'ADMIN'
                    ? 'Operations Director'
                    : activePortal === 'AUDITOR'
                    ? 'Senior QA Auditor'
                    : 'Line 3 Supervisor',
              }));
              setIsRegisterOpen(true);
            }}
            type="button"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors shadow-xs backdrop-blur-md cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5 text-indigo-600 dark:text-cyan-400" />
            <span className="hidden sm:inline">Register New User</span>
          </button>
        </div>
      </nav>

      {/* Main Login Card Area */}
      <main className="flex-1 flex items-center justify-center px-3 sm:px-4 py-4 sm:py-8 z-10">
        <div className="w-full max-w-xl">
          {/* Card Header & Portal Tabs */}
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800/90 rounded-3xl shadow-xl p-4 sm:p-8 transition-all">
            
            {/* Header Badge */}
            <div className="text-center mb-5 sm:mb-6">
              <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 mb-2 sm:mb-3 border border-slate-200 dark:border-slate-700">
                <Building2 className="w-3 h-3 text-indigo-600 dark:text-cyan-400" />
                Apparel Factory Access Control
              </span>
              <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Sign In to Your Workspace
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                Select your designated authority portal below to sign in.
              </p>
            </div>

            {/* SEPARATE 3-TIER USER PORTAL TABS */}
            <div className="grid grid-cols-3 gap-1 sm:gap-1.5 p-1 sm:p-1.5 bg-slate-100 dark:bg-slate-950 rounded-2xl mb-5 sm:mb-6 border border-slate-200 dark:border-slate-800/80 shadow-inner">
              {/* Admin Tab */}
              <button
                type="button"
                id="tab-admin-portal"
                onClick={() => handlePortalSwitch('ADMIN')}
                className={`flex flex-col items-center justify-center py-2 sm:py-2.5 px-1 sm:px-2 rounded-xl font-bold transition-all cursor-pointer ${
                  activePortal === 'ADMIN'
                    ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white shadow-md shadow-orange-500/25'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-900/50'
                }`}
              >
                <div className={`p-1 sm:p-1.5 rounded-lg mb-0.5 sm:mb-1 ${activePortal === 'ADMIN' ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-800'}`}>
                  <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div className="font-extrabold text-[10px] sm:text-xs">Admin Portal</div>
                <div className={`text-[9px] font-normal hidden sm:block ${activePortal === 'ADMIN' ? 'text-amber-100' : 'text-slate-400'}`}>
                  Plant Oversight
                </div>
              </button>

              {/* Auditor Tab */}
              <button
                type="button"
                id="tab-auditor-portal"
                onClick={() => handlePortalSwitch('AUDITOR')}
                className={`flex flex-col items-center justify-center py-2 sm:py-2.5 px-1 sm:px-2 rounded-xl font-bold transition-all cursor-pointer ${
                  activePortal === 'AUDITOR'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/25'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-900/50'
                }`}
              >
                <div className={`p-1 sm:p-1.5 rounded-lg mb-0.5 sm:mb-1 ${activePortal === 'AUDITOR' ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-800'}`}>
                  <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div className="font-extrabold text-[10px] sm:text-xs">Auditor Portal</div>
                <div className={`text-[9px] font-normal hidden sm:block ${activePortal === 'AUDITOR' ? 'text-indigo-100' : 'text-slate-400'}`}>
                  QA & Audit
                </div>
              </button>

              {/* Supervisor Tab */}
              <button
                type="button"
                id="tab-supervisor-portal"
                onClick={() => handlePortalSwitch('SUPERVISOR')}
                className={`flex flex-col items-center justify-center py-2 sm:py-2.5 px-1 sm:px-2 rounded-xl font-bold transition-all cursor-pointer ${
                  activePortal === 'SUPERVISOR'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/25'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-900/50'
                }`}
              >
                <div className={`p-1 sm:p-1.5 rounded-lg mb-0.5 sm:mb-1 ${activePortal === 'SUPERVISOR' ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-800'}`}>
                  <Wrench className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div className="font-extrabold text-[10px] sm:text-xs">Supervisor</div>
                <div className={`text-[9px] font-normal hidden sm:block ${activePortal === 'SUPERVISOR' ? 'text-emerald-100' : 'text-slate-400'}`}>
                  Line In-Charges
                </div>
              </button>
            </div>

            {/* Portal Context Banner */}
            <div
              className={`p-3 rounded-2xl text-xs font-medium mb-5 border transition-all flex items-start gap-2.5 ${
                activePortal === 'ADMIN'
                  ? 'bg-amber-50/80 border-amber-200 text-amber-950 dark:bg-amber-950/40 dark:border-amber-900/60 dark:text-amber-200'
                  : activePortal === 'AUDITOR'
                  ? 'bg-indigo-50/70 border-indigo-200/80 text-indigo-950 dark:bg-indigo-950/40 dark:border-indigo-900/60 dark:text-indigo-200'
                  : 'bg-emerald-50/70 border-emerald-200/80 text-emerald-950 dark:bg-emerald-950/40 dark:border-emerald-900/60 dark:text-emerald-200'
              }`}
            >
              <div className="p-1 rounded-md bg-white dark:bg-slate-900 shadow-xs shrink-0 mt-0.5">
                {activePortal === 'ADMIN' ? (
                  <Crown className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                ) : activePortal === 'AUDITOR' ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                ) : (
                  <Wrench className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                )}
              </div>
              <div className="text-[11px] leading-relaxed">
                {activePortal === 'ADMIN' ? (
                  <>
                    <strong>Executive Admin Authority:</strong> High-level plant monitoring, Auditor defect logging vs Supervisor rectification tracking, SLA bottleneck alerts, and accountability reports.
                  </>
                ) : activePortal === 'AUDITOR' ? (
                  <>
                    <strong>Quality Auditor Authority:</strong> Factory-wide roving inspection, Before-photo logging, 12–24h SLA governance, and final closure/rejection verification sign-off.
                  </>
                ) : (
                  <>
                    <strong>Line Supervisor Authority:</strong> Defect notifications for your assigned line, live 12–24h countdown clock, machine rectification, and After-photo proof uploads.
                  </>
                )}
              </div>
            </div>

            {/* Notification Messages */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/50 dark:border-rose-900 dark:text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/50 dark:border-emerald-900 dark:text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Credential Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  {activePortal === 'ADMIN'
                    ? 'Admin ID or Email'
                    : activePortal === 'AUDITOR'
                    ? 'Auditor ID or Email'
                    : 'Supervisor ID or Email'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    id="input-login-identifier"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={
                      activePortal === 'ADMIN'
                        ? 'e.g. ADM-001 or admin@factory.com'
                        : activePortal === 'AUDITOR'
                        ? 'e.g. AUD-001 or auditor@factory.com'
                        : 'e.g. SUP-101 or arif@factory.com'
                    }
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-cyan-500 transition-all shadow-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Password
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">Default: Password123!</span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="input-login-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-cyan-500 transition-all shadow-xs"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                id="btn-login-submit"
                disabled={loading}
                className={`w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-white flex items-center justify-center gap-2 shadow-lg transition-all transform active:scale-[0.99] disabled:opacity-50 cursor-pointer ${
                  activePortal === 'ADMIN'
                    ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 shadow-orange-500/30'
                    : activePortal === 'AUDITOR'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-indigo-600/30'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/30'
                }`}
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>
                      Sign In as{' '}
                      {activePortal === 'ADMIN'
                        ? 'Executive Administrator'
                        : activePortal === 'AUDITOR'
                        ? 'Quality Auditor'
                        : 'Line Supervisor'}
                    </span>
                  </>
                )}
              </button>
            </form>

            {/* ONE-CLICK INSTANT DEMO LOGINS */}
            <div className="mt-7 pt-6 border-t border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Instant 1-Click {activePortal === 'ADMIN' ? 'Admin' : activePortal === 'AUDITOR' ? 'Auditor' : 'Supervisor'} Profile:
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Quick Access</span>
              </div>

              {activePortal === 'ADMIN' ? (
                <div className="space-y-2">
                  {adminUsers.length > 0 ? (
                    adminUsers.map((adm) => (
                      <button
                        key={adm._id}
                        type="button"
                        onClick={() => handleQuickDemoLogin(adm)}
                        disabled={loading}
                        className="w-full text-left p-3 rounded-xl border border-amber-200 dark:border-amber-950/80 bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-100/60 dark:hover:bg-amber-900/30 transition-all flex items-center justify-between group shadow-2xs cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-rose-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                            <Crown className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                              <span>{adm.name}</span>
                              <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 text-[10px] font-mono font-semibold">
                                {adm.employeeId}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                              {adm.designation} • {adm.department}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 group-hover:translate-x-1 transition-transform">
                          <span>Access</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </button>
                    ))
                  ) : (
                    <button
                      type="button"
                      onClick={handleQuickAdminDefault}
                      disabled={loading}
                      className="w-full text-left p-3 rounded-xl border border-amber-200 dark:border-amber-950/80 bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-100/60 dark:hover:bg-amber-900/30 transition-all flex items-center justify-between group shadow-2xs cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-rose-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                          <Crown className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span>Anil Mehta</span>
                            <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 text-[10px] font-mono font-semibold">
                              ADM-001
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                            General Operations Director • Plant Operations & Executive Oversight
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 group-hover:translate-x-1 transition-transform">
                        <span>Access</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </button>
                  )}
                </div>
              ) : activePortal === 'AUDITOR' ? (
                <div className="space-y-2">
                  {auditorUsers.map((aud) => (
                    <button
                      key={aud._id}
                      type="button"
                      onClick={() => handleQuickDemoLogin(aud)}
                      disabled={loading}
                      className="w-full text-left p-3 rounded-xl border border-indigo-100 dark:border-indigo-950/80 bg-indigo-50/50 dark:bg-indigo-950/20 hover:bg-indigo-100/60 dark:hover:bg-indigo-900/30 transition-all flex items-center justify-between group shadow-2xs cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                          {aud.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span>{aud.name}</span>
                            <span className="px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-mono font-semibold">
                              {aud.employeeId}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                            {aud.designation} • {aud.department}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform">
                        <span>Access</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {supervisorUsers.map((sup) => (
                    <button
                      key={sup._id}
                      type="button"
                      onClick={() => handleQuickDemoLogin(sup)}
                      disabled={loading}
                      className="text-left p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-950/80 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/30 transition-all flex items-center justify-between group shadow-2xs cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                          {sup.name.charAt(0)}
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                            <span className="truncate">{sup.name}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">
                            {sup.department}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 shrink-0">
                        {sup.employeeId}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Registration Modal for Creating New Custom Admin, Auditor or Supervisor */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 max-w-lg w-full shadow-2xl relative my-auto max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-cyan-400">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Create New Factory User
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Register an Admin, Auditor, or Line Supervisor profile
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRegisterOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {regError && (
              <div className="mb-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/50 dark:border-rose-900 dark:text-rose-200 text-xs flex items-center gap-2 shrink-0">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{regError}</span>
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="space-y-3.5 overflow-y-auto pr-1 no-scrollbar flex-1">
                {/* Role Picker */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    User Role
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setRegData((prev) => ({
                          ...prev,
                          role: 'ADMIN',
                          department: 'Plant Operations & Executive Oversight',
                          designation: 'Operations Director',
                          employeeId: prev.employeeId || 'ADM-002',
                        }))
                      }
                      className={`py-2 px-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        regData.role === 'ADMIN'
                          ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <Crown className="w-3.5 h-3.5" />
                      <span>Admin</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setRegData((prev) => ({
                          ...prev,
                          role: 'AUDITOR',
                          department: 'Central Quality Audit',
                          designation: 'QA Auditor',
                          employeeId: prev.employeeId || 'AUD-002',
                        }))
                      }
                      className={`py-2 px-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        regData.role === 'AUDITOR'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Auditor</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setRegData((prev) => ({
                          ...prev,
                          role: 'ACTION_PERSON',
                          department: 'Sewing Line 3',
                          designation: 'Line 3 Supervisor',
                          employeeId: prev.employeeId || 'SUP-105',
                        }))
                      }
                      className={`py-2 px-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        regData.role === 'ACTION_PERSON'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Supervisor</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Employee ID */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Employee ID
                    </label>
                    <div className="relative">
                      <Hash className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={regData.employeeId}
                        onChange={(e) =>
                          setRegData({ ...regData, employeeId: e.target.value.toUpperCase() })
                        }
                        placeholder={
                          regData.role === 'ADMIN'
                            ? 'ADM-002'
                            : regData.role === 'AUDITOR'
                            ? 'AUD-002'
                            : 'SUP-105'
                        }
                        className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <UserIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={regData.name}
                        onChange={(e) => setRegData({ ...regData, name: e.target.value })}
                        placeholder="e.g. Ananya Sen"
                        className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Email */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Work Email
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        value={regData.email}
                        onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                        placeholder="user@factory.com"
                        className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Mobile Number */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Mobile Number
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={regData.mobileNumber}
                        onChange={(e) => setRegData({ ...regData, mobileNumber: e.target.value })}
                        placeholder="+91 98765 00000"
                        className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Department */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Department / Line
                    </label>
                    <div className="relative">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={regData.department}
                        onChange={(e) => setRegData({ ...regData, department: e.target.value })}
                        placeholder="e.g. Sewing Line 3"
                        className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Designation */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Designation
                    </label>
                    <div className="relative">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={regData.designation}
                        onChange={(e) => setRegData({ ...regData, designation: e.target.value })}
                        placeholder="e.g. Line 3 Supervisor"
                        className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Password (min 6 characters)
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      value={regData.password}
                      onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                      placeholder="Enter password"
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={regLoading}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  {regLoading ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Register & Log In</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 dark:text-slate-600 z-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Garment Manufacturing Quality Management System • Closed-Loop Architecture</span>
          <span className="font-mono text-[11px]">12h–24h Strict SLA • ISO 9001 / AQL 1.5 Compliant</span>
        </div>
      </footer>
    </div>
  );
};

export default LoginPage;

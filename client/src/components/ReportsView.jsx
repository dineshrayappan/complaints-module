import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  FileSpreadsheet,
  FileText,
  Calendar,
  CheckCircle2,
  Building2,
  Layers,
  ArrowDownToLine,
} from 'lucide-react';

export const ReportsView = ({ complaints = [], departmentData = null }) => {
  const [downloading, setDownloading] = useState(false);

  // CSV Export handler
  const handleExportCSV = () => {
    setDownloading(true);
    try {
      const headers = [
        'NC Number',
        'Title',
        'Department',
        'Category',
        'Severity',
        'Status',
        'Deadline Condition',
        'Created Date',
        'Due Date',
        'Assigned Person',
        'CAP Status',
      ];

      const rows = complaints.map((c) => [
        `"${c.complaintId || ''}"`,
        `"${(c.title || '').replace(/"/g, '""')}"`,
        `"${c.department || ''}"`,
        `"${c.category || ''}"`,
        `"${c.priority || ''}"`,
        `"${c.status || ''}"`,
        `"${c.deadlineCondition || ''}"`,
        `"${c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ''}"`,
        `"${c.deadlineTimestamp ? new Date(c.deadlineTimestamp).toLocaleDateString() : ''}"`,
        `"${c.assignedTo?.name || ''}"`,
        `"${c.cap?.status || (c.capRequired ? 'Required' : 'None')}"`,
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `Garment_Compliance_NC_Report_${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to export CSV:', err);
    } finally {
      setTimeout(() => setDownloading(false), 800);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-cyan-400">
              <BarChart3 className="w-4 h-4" />
            </span>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              Compliance Reports & Audit Analytics
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Export official quality compliance documentation and non-conformance registers.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={downloading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{downloading ? 'Exporting...' : 'Export NCs (CSV)'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 font-bold text-xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Available Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Defect Register Dump
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Full spreadsheet with all {complaints.length} non-conformances, before/after evidence
              status, and deadline metrics.
            </p>
          </div>
          <button
            type="button"
            onClick={handleExportCSV}
            className="mt-4 w-full py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-1 cursor-pointer"
          >
            <ArrowDownToLine className="w-3.5 h-3.5" />
            <span>Download CSV</span>
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-cyan-400 flex items-center justify-center mb-3">
              <Building2 className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Department Compliance Summary
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Departmental scores (HR, Production, EHS, Stores, Maintenance, Quality) and SLA
              adherence breakdown.
            </p>
          </div>
          <button
            type="button"
            onClick={handlePrint}
            className="mt-4 w-full py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-1 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Scorecard</span>
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3">
              <FileText className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Executive CAP Audit Trail
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Closed-loop verification document for external buyer compliance checks and audits.
            </p>
          </div>
          <button
            type="button"
            onClick={handlePrint}
            className="mt-4 w-full py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-1 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Generate PDF / Print</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportsView;

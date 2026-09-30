import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  Shield,
  Layers,
  Search,
  ExternalLink,
  ChevronRight,
  Flame,
} from 'lucide-react';

export const RequirementsComplianceView = ({ onSelectRequirement }) => {
  const [search, setSearch] = useState('');

  const standards = [
    {
      code: 'ISO 9001:2015',
      name: 'Quality Management System',
      badge: 'Certified',
      score: 94,
      openNC: 4,
      clauses: [
        {
          id: '8.7',
          title: 'Control of Nonconforming Outputs',
          status: 'Compliant',
          finding: 'Proper identification and segregation of skipped stitches and shade variations.',
          ncCount: 1,
        },
        {
          id: '10.2',
          title: 'Nonconformity & Corrective Action',
          status: 'Compliant',
          finding: '8-part closed-loop CAP workflow active for all audit defects.',
          ncCount: 3,
        },
        {
          id: '7.1.5',
          title: 'Monitoring & Measuring Resources',
          status: 'Compliant',
          finding: 'Calibration records maintained for needle detectors and fabric tensile testers.',
          ncCount: 0,
        },
      ],
    },
    {
      code: 'SA8000:2014',
      name: 'Social Accountability & Floor Safety',
      badge: 'Verified',
      score: 92,
      openNC: 6,
      clauses: [
        {
          id: '3.1',
          title: 'Health & Safety - Emergency Egress',
          status: 'Requires Action',
          finding: 'Gangways and exit doors must remain unblocked at all times.',
          ncCount: 3,
        },
        {
          id: '3.2',
          title: 'PPE & Machine Guarding',
          status: 'Compliant',
          finding: 'Eye shields, pulley guards, and needle guards in place across 98% of machines.',
          ncCount: 2,
        },
        {
          id: '3.5',
          title: 'First Aid & Chemical Safety',
          status: 'Compliant',
          finding: 'MSDS displayed at spot cleaning stations and eyewash stations inspected weekly.',
          ncCount: 1,
        },
      ],
    },
    {
      code: 'OEKO-TEX 100',
      name: 'Chemical & Environmental Safety',
      badge: 'High Compliance',
      score: 97,
      openNC: 1,
      clauses: [
        {
          id: 'ENV-1',
          title: 'Chemical Inventory & Restricted Substances',
          status: 'Compliant',
          finding: 'All spot-cleaning agents and stain removers certified eco-friendly and ZDHC Level 3.',
          ncCount: 0,
        },
        {
          id: 'ENV-2',
          title: 'Needle Policy & Metal Detection',
          status: 'Compliant',
          finding: 'Broken needle log 100% matched with recovered needle fragments.',
          ncCount: 1,
        },
      ],
    },
    {
      code: 'WRAP',
      name: 'Worldwide Responsible Accredited Production',
      badge: 'Platinum Grade',
      score: 89,
      openNC: 5,
      clauses: [
        {
          id: 'WRAP-04',
          title: 'Workplace Environment & Ergonomics',
          status: 'Under Review',
          finding: 'Adequate lighting (500 lux) provided at final inspection tables.',
          ncCount: 2,
        },
        {
          id: 'WRAP-05',
          title: 'Security & Access Control (C-TPAT)',
          status: 'Compliant',
          finding: 'Finished goods carton packing room securely monitored.',
          ncCount: 1,
        },
      ],
    },
  ];

  const filtered = standards.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.code.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      s.clauses.some((c) => c.title.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Header */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
              <BookOpen className="w-4 h-4" />
            </span>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              Compliance Requirements & Standards
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Audit clauses benchmarked to international apparel quality and social standards.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search standard or clause..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Standards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.map((std) => (
          <div
            key={std.code}
            className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between"
          >
            <div>
              {/* Header */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-extrabold text-xs text-indigo-600 dark:text-cyan-400">
                      {std.code}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.2 rounded bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-500/20">
                      {std.badge}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                    {std.name}
                  </h3>
                </div>

                <div className="text-right">
                  <div className="text-xl font-mono font-extrabold text-slate-900 dark:text-white">
                    {std.score}%
                  </div>
                  <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                    🟢 Compliant
                  </div>
                </div>
              </div>

              {/* Clauses list */}
              <div className="space-y-2.5 my-3">
                {std.clauses.map((clause) => (
                  <div
                    key={clause.id}
                    onClick={() => onSelectRequirement && onSelectRequirement(clause.title)}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs hover:border-indigo-300 dark:hover:border-indigo-700 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between font-semibold mb-1">
                      <span className="text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-indigo-600 dark:text-cyan-400 font-bold">
                          § {clause.id}
                        </span>
                        <span>{clause.title}</span>
                      </span>

                      {clause.ncCount > 0 ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                          {clause.ncCount} NC
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                          ✓ Zero NC
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                      {clause.finding}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span>{std.openNC} Active Non-Conformances</span>
              <button
                type="button"
                onClick={() => onSelectRequirement && onSelectRequirement(std.code)}
                className="font-bold text-indigo-600 dark:text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Filter NCs</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RequirementsComplianceView;

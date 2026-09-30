import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ClipboardList,
  Plus,
  Check,
  Trash2,
  Pencil,
  X,
  ChevronRight,
  Repeat,
} from 'lucide-react';
import { taskService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const STATE_STYLE = {
  Overdue: { dot: 'bg-rose-500', label: 'OVERDUE', text: 'text-rose-600 dark:text-rose-400' },
  'Due Today': { dot: 'bg-amber-500', label: 'DUE TODAY', text: 'text-amber-600 dark:text-amber-400' },
  Upcoming: { dot: 'bg-indigo-500', label: 'UPCOMING', text: 'text-indigo-600 dark:text-indigo-400' },
  Completed: { dot: 'bg-emerald-500', label: 'COMPLETED', text: 'text-emerald-600 dark:text-emerald-400' },
};

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];
const RECURRENCES = ['NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY'];

const fmtDay = (iso) => {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}-${d.toLocaleString('en-GB', { month: 'short' })}`;
};

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const emptyForm = () => ({
  title: '',
  department: 'Central Quality Audit',
  description: '',
  dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
  recurrence: 'NONE',
  priority: 'MEDIUM',
  assignedToUserId: '',
});

export const MyTasksPanel = ({ compact = false }) => {
  const { user, isAdmin, isAuditor } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [counts, setCounts] = useState({ overdue: 0, dueToday: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState(null);

  const canSchedule = Boolean(isAdmin || isAuditor);

  const load = useCallback(async () => {
    try {
      const res = await taskService.getTasks();
      if (res.data?.success) {
        setTasks(res.data.tasks || []);
        setCounts(res.data.counts || { overdue: 0, dueToday: 0, completed: 0 });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load tasks.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Overdue and due-today both belong in "Today" — an overdue item is more
  // urgent than one merely due, not a separate bucket to triage separately.
  const groups = useMemo(() => {
    const today = startOfToday();
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const open = tasks.filter((t) => t.state !== 'Completed');
    const done = tasks.filter((t) => t.state === 'Completed');

    return [
      { key: 'today', label: 'Today', items: open.filter((t) => ['Overdue', 'Due Today'].includes(t.state)) },
      {
        key: 'week',
        label: 'This Week',
        items: open.filter((t) => {
          if (t.state !== 'Upcoming') return false;
          const d = new Date(t.dueDate);
          return d >= today && d < weekEnd;
        }),
      },
      {
        key: 'later',
        label: 'Later',
        items: open.filter((t) => t.state === 'Upcoming' && new Date(t.dueDate) >= weekEnd),
      },
      { key: 'done', label: 'Completed', items: done },
    ].filter((g) => g.items.length > 0);
  }, [tasks]);

  const handleComplete = async (task) => {
    setBusyId(task.id);
    try {
      const res = await taskService.completeTask(task.id);
      // Recurring tasks book their own next occurrence, so always re-list
      // rather than patching state locally.
      load();
      if (res.data?.nextTask) {
        // eslint-disable-next-line no-alert
        alert(res.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not complete task.');
    } finally {
      setBusyId(null);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setShowForm(true);
  };

  const openEdit = (task) => {
    setEditing(task);
    setForm({
      title: task.title || '',
      department: task.department || '',
      description: task.description || '',
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : '',
      recurrence: task.recurrence || 'NONE',
      priority: task.priority || 'MEDIUM',
      assignedToUserId: task.assignedTo?.employeeId || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      if (editing) {
        await taskService.updateTask(editing.id, {
          title: form.title,
          department: form.department,
          description: form.description,
          dueDate: new Date(form.dueDate).toISOString(),
          recurrence: form.recurrence,
          priority: form.priority,
        });
      } else {
        await taskService.createTask({
          ...form,
          dueDate: new Date(form.dueDate).toISOString(),
        });
      }
      setShowForm(false);
      setEditing(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save task.');
    }
  };

  const handleDelete = async (task) => {
    if (!window.confirm(`Delete "${task.title}"? This cannot be undone.`)) return;
    try {
      await taskService.deleteTask(task.id);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete task.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-indigo-600 dark:text-cyan-400" />
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
            My Tasks
          </h2>
          {counts.overdue > 0 && (
            <span className="px-2 py-0.5 rounded-md bg-rose-500 text-white text-[10px] font-mono font-bold">
              {counts.overdue} OVERDUE
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
          >
            Refresh
          </button>
          {canSchedule && (
            <button
              onClick={openCreate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold shadow-md shadow-indigo-600/30 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Schedule
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-[11px] font-semibold text-rose-700 dark:text-rose-300 flex items-start gap-2">
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Schedule form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200">
              {editing ? 'Edit Task' : 'Schedule Task'}
            </h3>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditing(null);
              }}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <input
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Task title"
            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-indigo-500"
          />

          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="What must be checked?"
            rows={2}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 outline-none focus:border-indigo-500"
          />

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">Due</span>
              <input
                type="datetime-local"
                required
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-900 dark:text-white outline-none focus:border-indigo-500"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">Repeats</span>
              <select
                value={form.recurrence}
                onChange={(e) => setForm({ ...form, recurrence: e.target.value })}
                className="px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-900 dark:text-white outline-none focus:border-indigo-500"
              >
                {RECURRENCES.map((r) => (
                  <option key={r} value={r}>
                    {r === 'NONE' ? 'One-off' : r[0] + r.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">Priority</span>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-900 dark:text-white outline-none focus:border-indigo-500"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p[0] + p.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">Department</span>
              <input
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-900 dark:text-white outline-none focus:border-indigo-500"
              />
            </label>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold cursor-pointer"
            >
              {editing ? 'Save Changes' : 'Schedule Task'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditing(null);
              }}
              className="px-4 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Grouped list */}
      {loading ? (
        <div className="p-10 text-center text-slate-400 text-xs font-mono">Loading your tasks...</div>
      ) : groups.length === 0 ? (
        <div className="p-10 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center">
          <p className="text-xs font-bold text-slate-900 dark:text-white">No tasks scheduled</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {canSchedule ? 'Use Schedule to book a recurring inspection.' : 'Nothing assigned to you right now.'}
          </p>
        </div>
      ) : (
        groups.map((group) => (
          <div key={group.key}>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {group.label}
              </h3>
              <span className="text-[10px] font-mono font-bold text-slate-400">{group.items.length}</span>
              <div className="flex-1 border-t border-slate-200 dark:border-slate-800" />
            </div>

            <div className="space-y-1.5">
              {group.items.map((task) => {
                const style = STATE_STYLE[task.state] || STATE_STYLE.Upcoming;
                const isDone = task.state === 'Completed';
                return (
                  <div
                    key={task.id}
                    className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors ${
                      isDone
                        ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 ${style.dot} ${isDone ? '' : 'animate-pulse'}`} />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-xs font-bold truncate ${
                            isDone
                              ? 'text-slate-400 dark:text-slate-500 line-through'
                              : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {task.title}
                        </span>
                        {task.recurrence && task.recurrence !== 'NONE' && (
                          <span className="flex items-center gap-0.5 text-[9px] font-mono font-bold text-slate-400">
                            <Repeat className="w-2.5 h-2.5" />
                            {task.recurrence}
                          </span>
                        )}
                      </div>
                      {!compact && task.description && (
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {task.description}
                        </p>
                      )}
                    </div>

                    <span className={`text-[10px] font-mono font-bold shrink-0 ${style.text}`}>
                      {style.label}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0 w-14 text-right">
                      {fmtDay(task.dueDate)}
                    </span>

                    <div className="flex items-center gap-1 shrink-0">
                      {!isDone && (
                        <button
                          onClick={() => handleComplete(task)}
                          disabled={busyId === task.id}
                          title="Mark complete"
                          className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 disabled:opacity-40 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {canSchedule && (
                        <>
                          <button
                            onClick={() => openEdit(task)}
                            title="Edit"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(task)}
                            title="Delete"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      <p className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
        <ChevronRight className="w-3 h-3" />
        Recurring inspections re-schedule themselves when completed.
      </p>
    </div>
  );
};

export default MyTasksPanel;

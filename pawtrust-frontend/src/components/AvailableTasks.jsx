import React, { useMemo, useRef, useEffect } from "react";

function StatusBadge({ status = "open" }) {
  const map = {
    open: "bg-indigo-50 text-indigo-700 ring-indigo-200",
    pending: "bg-amber-50 text-amber-700 ring-amber-200",
  };
  return (
    <span
      className={`px-2 py-1 text-xs rounded-full ring-1 ${
        map[status] || map.open
      }`}
    >
      {status}
    </span>
  );
}

const toMs = (t) => {
  if (!t) return 0;
  if (typeof t === "number") return t < 1e12 ? t * 1000 : t; // 秒->毫秒
  if (typeof t === "string") {
    if (/^\d{10}$/.test(t)) return Number(t) * 1000; // "169..." 秒
    const d = Date.parse(t);
    return Number.isNaN(d) ? 0 : d;
  }
  const d = Date.parse(t);
  return Number.isNaN(d) ? 0 : d;
};

/**
 * props:
 * - tasks: Task[]
 * - appliedTaskIds: Set<string>
 * - messages: Record<taskId, string>
 * - onMessageChange(taskId, val)
 * - onApply(taskId)
 * - loading: boolean
 * - page, setPage
 * - pageSize?: number
 * - className?: string
 */
export default function AvailableTasks({
  tasks = [],
  appliedTaskIds = new Set(),
  messages = {},
  onMessageChange,
  onApply,
  loading = false,
  page,
  setPage,
  pageSize = 3,
  className = "",
}) {
  const sorted = useMemo(
    () =>
      [...tasks].sort(
        (a, b) =>
          toMs(b.createdAt ?? b.date ?? b.updatedAt) -
          toMs(a.createdAt ?? a.date ?? a.updatedAt)
      ),
    [tasks]
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageClamped = Math.min(page || 1, totalPages);
  const paged = sorted.slice(
    (pageClamped - 1) * pageSize,
    pageClamped * pageSize
  );

  const scrollRef = useRef(null);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [pageClamped]);

  const prevLen = useRef(tasks.length);
  useEffect(() => {
    if (tasks.length > prevLen.current) {
      setPage?.(1);
    }
    prevLen.current = tasks.length;
  }, [tasks.length, setPage]);

  return (
    <section
      className={`rounded-2xl bg-white/80 backdrop-blur ring-1 ring-black/5 shadow-xl flex flex-col h-full ${className}`}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b">
        <h2 className="text-lg font-semibold text-slate-900">
          Available Tasks
        </h2>
      </div>

      {/* Content */}
      <div ref={scrollRef} className="p-4 space-y-4 flex-1 overflow-y-auto">
        {loading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-16 rounded-xl bg-slate-200/60" />
            <div className="h-16 rounded-xl bg-slate-200/60" />
            <div className="h-16 rounded-xl bg-slate-200/60" />
          </div>
        ) : paged.length === 0 ? (
          <div className="rounded-xl bg-white/70 ring-1 ring-black/5 p-8 text-center">
            <p className="text-slate-700">No open tasks right now.</p>
          </div>
        ) : (
          paged.map((task, idx) => (
            <div
              key={task._id ?? task.id ?? task.tempId ?? `row-${idx}`}
              className="rounded-2xl bg-white/80 ring-1 ring-black/5 shadow-sm p-4 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    {task.petType || "Task"}
                  </h3>
                  <div className="mt-1 flex flex-wrap gap-2 text-sm text-slate-600">
                    {task.date && (
                      <span>{new Date(toMs(task.date)).toLocaleString()}</span>
                    )}
                    {task.duration && <span>• {task.duration}h</span>}
                    {task.location && <span>• {task.location}</span>}
                  </div>
                </div>
                <StatusBadge status={task.status || "open"} />
              </div>

              {task.description && (
                <p className="mt-3 text-sm text-slate-700">
                  {task.description}
                </p>
              )}

              <div className="mt-3 border-t pt-3">
                {appliedTaskIds.has(task._id) ? (
                  <div className="text-emerald-700 text-sm font-medium">
                    Applied
                  </div>
                ) : (
                  <>
                    <textarea
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100 mb-2"
                      placeholder="Leave a message for the owner..."
                      rows={2}
                      value={messages[task._id] || ""}
                      onChange={(e) =>
                        onMessageChange?.(task._id, e.target.value)
                      }
                    />
                    <button
                      className="rounded-xl bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
                      onClick={() => onApply?.(task._id)}
                    >
                      Apply
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-4 pb-3 flex items-center justify-end gap-2 text-sm">
        <button
          className="rounded-lg px-3 py-1 ring-1 ring-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50"
          onClick={() => setPage?.((p) => Math.max(1, p - 1))}
          disabled={pageClamped === 1}
        >
          Prev
        </button>
        <span className="text-slate-500">
          Page {pageClamped} / {totalPages}
        </span>
        <button
          className="rounded-lg px-3 py-1 ring-1 ring-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50"
          onClick={() => setPage?.((p) => Math.min(totalPages, p + 1))}
          disabled={pageClamped === totalPages}
        >
          Next
        </button>
      </div>
    </section>
  );
}

import React, { useMemo, useRef, useEffect, useState } from "react";
import { BASE_URL } from "../config";

function StatusBadge({ status = "accepted" }) {
  const map = {
    accepted: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    finished: "bg-slate-100 text-slate-700 ring-slate-200",
  };
  const cls = map[status] || map.accepted;
  return (
    <span className={`px-2 py-1 text-xs rounded-full ring-1 ${cls}`}>
      {status}
    </span>
  );
}

/**
 * props:
 * - tasks
 * - page, setPage, pageSize
 * - onFinishedLocal(task)  // Notify the parent component that the task is completed.
 */
export default function AcceptedTasks({
  tasks = [],
  page,
  setPage,
  pageSize = 6,
  className = "",
  onFinishedLocal,
}) {
  const [finishingId, setFinishingId] = useState(null);

  // Keep only non-finished tasks (already filtered by the parent component, but double-check here).
  const acceptedOnly = useMemo(
    () =>
      (Array.isArray(tasks) ? tasks : []).filter(
        (t) => t?.status !== "finished"
      ),
    [tasks]
  );

  const sorted = useMemo(
    () =>
      [...acceptedOnly].sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      ),
    [acceptedOnly]
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

  const markFinished = async (task) => {
    try {
      setFinishingId(task._id);

      const res = await fetch(`${BASE_URL}/pawtrust/tasks/${task._id}/finish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to mark finished");

      // Update the task status locally
      onFinishedLocal?.(task);
    } catch (e) {
      alert(e.message || "Failed to mark finished");
    } finally {
      setFinishingId(null);
    }
  };

  return (
    <section
      className={`rounded-2xl bg-white/80 backdrop-blur ring-1 ring-black/5 shadow-xl flex flex-col h-full ${className}`}
    >
      <div className="px-4 py-3 border-b">
        <h2 className="text-lg font-semibold text-slate-900">Accepted Tasks</h2>
      </div>

      <div ref={scrollRef} className="p-4 space-y-4 flex-1 overflow-y-auto">
        {paged.length === 0 ? (
          <p className="text-slate-600">No accepted tasks yet.</p>
        ) : (
          paged.map((task) => (
            <div
              key={task._id}
              className="rounded-2xl ring-1 ring-emerald-200 bg-emerald-50 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-emerald-900">
                    {task.petType || "Task"}
                  </h3>
                  <div className="mt-1 flex flex-wrap gap-2 text-sm text-emerald-800/80">
                    {task.date && (
                      <span>{new Date(task.date).toLocaleString()}</span>
                    )}
                    {task.duration && <span>• {task.duration}h</span>}
                    {task.location && <span>• {task.location}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => markFinished(task)}
                    disabled={finishingId === task._id}
                    className="rounded-md bg-emerald-600 px-3 py-1 text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {finishingId === task._id
                      ? "Finishing..."
                      : "Mark Finished"}
                  </button>
                  <StatusBadge status="accepted" />
                </div>
              </div>

              {task.description && (
                <p className="mt-3 text-sm text-emerald-900/90">
                  {task.description}
                </p>
              )}
            </div>
          ))
        )}
      </div>

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

import React, { useMemo } from "react";

export default function TaskList({
  className = "",
  tasks = [],
  applications = {}, // { [taskId]: Application[] }
  acceptedByTask = {}, // { [taskId]: sitterId }
  getSitterName = () => "Unknown",
  onAccept,
  onDelete,
  onEdit,
  onReview,
  q = "",
  setQ = () => {},
  statusFilter = "",
  setStatusFilter = () => {},
  page = 1,
  setPage = () => {},
  pageSize = 5,
}) {
  // Search + Filter + Sort
  const filtered = useMemo(() => {
    let list = Array.isArray(tasks) ? tasks : [];
    const kw = String(q || "")
      .trim()
      .toLowerCase();

    if (kw) {
      list = list.filter((t) => {
        const hay = `${t.petType || ""} ${t.description || ""} ${
          t.location || ""
        }`.toLowerCase();
        return hay.includes(kw);
      });
    }
    if (statusFilter) {
      list = list.filter((t) => String(t.status) === String(statusFilter));
    }
    return [...list].sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );
  }, [tasks, q, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageClamped = Math.min(page, totalPages);
  const paged = filtered.slice(
    (pageClamped - 1) * pageSize,
    pageClamped * pageSize
  );

  // Retrieve whether this task already has someone accepted, and the accepted sitterId.
  function getAcceptedForTask(taskId) {
    const tid = String(taskId);

    // 1) Prefer using the passed-in acceptedByTask (sitterId).
    const sitterIdFromProp = acceptedByTask?.[tid];
    if (sitterIdFromProp) {
      return { accepted: true, acceptedSitterId: String(sitterIdFromProp) };
    }

    // 2) Fallback: Search the applications for one with status === 'accepted'
    const apps = applications[tid] || [];
    const acc = apps.find((a) => a?.status === "accepted");
    if (acc) {
      return { accepted: true, acceptedSitterId: String(acc.sitterId || "") };
    }

    return { accepted: false, acceptedSitterId: "" };
  }

  // Match backend logic: Only review if finished, unreviewed, and has an accepted sitter.
  function canReview(task) {
    if (!task) return false;
    const { accepted } = getAcceptedForTask(task._id);
    return task.status === "finished" && !Boolean(task.reviewed) && accepted;
  }
  function canDelete(task) {
    return String(task?.status) !== "finished";
  }
  return (
    <section className={`flex flex-col h-full ${className}`}>
      {/* Tools bar */}
      <div className="p-4 border-b flex items-center gap-3">
        <input
          className="flex-1 rounded-md border px-3 py-2"
          placeholder="Search tasks…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
        />
        <select
          className="rounded-md border px-3 py-2"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All</option>
          <option value="open">open</option>
          <option value="pending">pending</option>
          <option value="assigned">assigned</option>
          <option value="accepted">accepted</option>
          <option value="finished">finished</option>
          <option value="closed">closed</option>
        </select>
        <div className="text-xs text-slate-500 ml-auto">
          {filtered.length} task{filtered.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* list */}
      <div className="p-4 space-y-4 overflow-y-auto flex-1">
        {paged.length === 0 ? (
          <p className="text-slate-600">No tasks.</p>
        ) : (
          paged.map((task) => {
            const tid = String(task._id);
            const apps = applications[tid] || [];
            const { accepted, acceptedSitterId } = getAcceptedForTask(tid);

            return (
              <div
                key={tid}
                className="rounded-2xl ring-1 ring-slate-200 bg-white p-4"
              >
                {/* task header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      {task.petType || "Task"}
                    </h3>
                    <div className="mt-1 flex flex-wrap gap-2 text-sm text-slate-600">
                      {task.date && (
                        <span>
                          {new Date(task.date).toLocaleString(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </span>
                      )}
                      {task.duration && <span>• {task.duration}h</span>}
                      {task.location && <span>• {task.location}</span>}
                      {task.status && <span>• {task.status}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Restored review logic */}
                    {canReview(task) && (
                      <button
                        className="rounded-md px-3 py-1 ring-1 ring-amber-300 text-amber-700 hover:bg-amber-50"
                        onClick={() => onReview?.(task)}
                      >
                        Review
                      </button>
                    )}

                    <button
                      className="rounded-md px-3 py-1 ring-1 ring-slate-300 hover:bg-slate-50"
                      onClick={() => onEdit?.(task)}
                    >
                      Edit
                    </button>
                    {canDelete(task) && (
                      <button
                        className="rounded-md px-3 py-1 ring-1 ring-rose-300 text-rose-700 hover:bg-rose-50"
                        onClick={() => onDelete?.(task._id)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>

                {/* Application list */}
                <div className="mt-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-slate-900">
                      Applications: {apps.length || 0}
                    </div>
                    {task.status === "open" && apps.length > 0 && (
                      <span className="text-xs text-slate-500">
                        Click “Accept” to choose a sitter
                      </span>
                    )}
                    {/* Tip: If the task is finished but doesn’t meet the review criteria, provide the reason. */}
                    {task.status === "finished" && !canReview(task) && (
                      <span className="text-xs text-slate-400">
                        {Boolean(task.reviewed)
                          ? "Already reviewed"
                          : accepted
                          ? "Waiting for review to be enabled"
                          : "No accepted sitter — cannot review"}
                      </span>
                    )}
                  </div>

                  {apps.length === 0 ? (
                    <div className="text-sm text-slate-500">
                      No applications
                    </div>
                  ) : (
                    <div className="mt-2 space-y-2">
                      {apps.map((app) => {
                        const isAccepted =
                          String(app.sitterId) === acceptedSitterId;
                        const canAccept = !accepted; // Once a sitter has been accepted, no other applications can be accepted.

                        return (
                          <div
                            key={app._id}
                            className="flex items-center justify-between rounded-lg px-3 py-2 ring-1 ring-slate-200 bg-slate-50"
                          >
                            <div className="text-sm">
                              {getSitterName(app.sitterId)}
                              <span className="text-slate-500">
                                {" "}
                                · app #{String(app._id).slice(-6)}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {isAccepted ? (
                                <span className="px-2 py-1 text-xs rounded-full ring-1 bg-emerald-50 text-emerald-700 ring-emerald-200">
                                  Accepted
                                </span>
                              ) : canAccept ? (
                                <button
                                  className="rounded-md bg-indigo-600 text-white px-3 py-1 hover:bg-indigo-700"
                                  onClick={() =>
                                    onAccept?.(task._id, app.sitterId)
                                  }
                                >
                                  Accept
                                </button>
                              ) : (
                                <span className="px-2 py-1 text-xs rounded-full ring-1 bg-slate-100 text-slate-600 ring-slate-200">
                                  Not selected
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      <div className="px-4 pb-3 flex items-center justify-end gap-2 text-sm">
        <button
          className="rounded-lg px-3 py-1 ring-1 ring-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={pageClamped === 1}
        >
          Prev
        </button>
        <span className="text-slate-500">
          Page {pageClamped} / {totalPages}
        </span>
        <button
          className="rounded-lg px-3 py-1 ring-1 ring-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={pageClamped === totalPages}
        >
          Next
        </button>
      </div>
    </section>
  );
}

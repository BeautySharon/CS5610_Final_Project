// /* TaskList.jsx */
// export default function TaskList({
//   tasks, // 过滤/搜索前的原始 tasks 数组
//   applications, // Record<taskId, Application[]>
//   getSitterName, // (id) => string
//   onDelete, // (taskId) => void
//   onAccept, // (taskId, sitterId) => void
//   q,
//   setQ, // 搜索框 state
//   statusFilter,
//   setStatusFilter, // 状态筛选 state
//   page,
//   setPage, // 分页 state
//   pageSize = 3, // 默认每页 3 个
// }) {
//   // 过滤 + 排序
//   const filteredTasks = tasks
//     .filter((t) => (statusFilter ? t.status === statusFilter : true))
//     .filter((t) => {
//       if (!q.trim()) return true;
//       const hay = `${t.description || ""} ${t.location || ""} ${
//         t.petType || ""
//       }`.toLowerCase();
//       return hay.includes(q.toLowerCase());
//     })
//     .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

//   // 分页
//   const totalPages = Math.max(1, Math.ceil(filteredTasks.length / pageSize));
//   const pageClamped = Math.min(page, totalPages);
//   const paged = filteredTasks.slice(
//     (pageClamped - 1) * pageSize,
//     pageClamped * pageSize
//   );

//   return (
//     <section className="space-y-4">
//       {/* 工具条 */}
//       <div className="rounded-2xl bg-white/80 backdrop-blur ring-1 ring-black/5 p-3 flex flex-wrap items-center gap-3">
//         <input
//           value={q}
//           onChange={(e) => setQ(e.target.value)}
//           placeholder="Search description / location"
//           className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
//         />
//         <select
//           value={statusFilter}
//           onChange={(e) => setStatusFilter(e.target.value)}
//           className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
//         >
//           <option value="">All statuses</option>
//           <option value="open">Open</option>
//           <option value="pending">Pending</option>
//           <option value="accepted">Accepted</option>
//           <option value="closed">Closed</option>
//         </select>
//         <div className="text-xs text-slate-500 ml-auto">
//           {filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""}
//         </div>
//       </div>

//       {/* 列表 */}
//       {paged.length === 0 ? (
//         <div className="rounded-2xl bg-white/70 ring-1 ring-black/5 p-8 text-center">
//           <p className="text-slate-700">No tasks.</p>
//         </div>
//       ) : (
//         paged.map((task) => {
//           const apps = applications[String(task._id)] || [];
//           return (
//             <div
//               key={task._id}
//               className="rounded-2xl bg-white/80 ring-1 ring-black/5 shadow-sm p-4 hover:shadow-md transition"
//             >
//               <div className="flex items-start justify-between gap-3">
//                 <div>
//                   <h3 className="text-base font-semibold text-slate-900">
//                     {task.petType || "Task"}
//                   </h3>
//                   <div className="mt-1 flex flex-wrap gap-2 text-sm text-slate-600">
//                     {task.date && (
//                       <span>{new Date(task.date).toLocaleString()}</span>
//                     )}
//                     {task.duration && <span>• {task.duration}h</span>}
//                     {task.location && <span>• {task.location}</span>}
//                   </div>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <StatusBadge status={task.status || "open"} />
//                   <button
//                     onClick={() => onDelete(task._id)}
//                     className="text-slate-500 hover:text-red-600 text-sm"
//                   >
//                     Delete
//                   </button>
//                 </div>
//               </div>

//               {task.description && (
//                 <p className="mt-3 text-sm text-slate-700">
//                   {task.description}
//                 </p>
//               )}

//               <div className="mt-3 border-t pt-3">
//                 <div className="flex items-center justify-between">
//                   <p className="text-sm text-slate-600">
//                     Applications:{" "}
//                     <span className="font-medium">{apps.length}</span>
//                   </p>
//                   {task.status === "open" && apps.length > 0 && (
//                     <span className="text-xs text-slate-500">
//                       Click “Accept” to choose a sitter
//                     </span>
//                   )}
//                 </div>

//                 {apps.length > 0 ? (
//                   <div className="mt-2 space-y-2">
//                     {apps.map((app) => (
//                       <div
//                         key={app._id}
//                         className="flex justify-between items-center rounded-lg bg-slate-50 px-3 py-2 text-sm"
//                       >
//                         <span className="text-slate-700">
//                           {getSitterName(app.sitterId)}
//                         </span>
//                         {task.status === "pending" ||
//                         app.status === "accepted" ? (
//                           <span className="text-slate-500">
//                             {app.status === "accepted" ? "Accepted" : "Pending"}
//                           </span>
//                         ) : (
//                           <button
//                             onClick={() =>
//                               onAccept(String(task._id), String(app.sitterId))
//                             }
//                             className="rounded-md bg-indigo-600 px-3 py-1 text-white hover:bg-indigo-700"
//                           >
//                             Accept
//                           </button>
//                         )}
//                       </div>
//                     ))}
//                   </div>
//                 ) : (
//                   <p className="mt-2 text-sm text-slate-400">
//                     No applications yet
//                   </p>
//                 )}
//               </div>
//             </div>
//           );
//         })
//       )}

//       {/* 分页 */}
//       <div className="mt-3 flex items-center justify-end gap-2 text-sm">
//         <button
//           className="rounded-lg px-3 py-1 ring-1 ring-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50"
//           onClick={() => setPage((p) => Math.max(1, p - 1))}
//           disabled={pageClamped === 1}
//         >
//           Prev
//         </button>
//         <span className="text-slate-500">
//           Page {pageClamped} / {totalPages}
//         </span>
//         <button
//           className="rounded-lg px-3 py-1 ring-1 ring-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50"
//           onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
//           disabled={pageClamped === totalPages}
//         >
//           Next
//         </button>
//       </div>
//     </section>
//   );
// }

// function StatusBadge({ status = "open" }) {
//   const map = {
//     pending: "bg-amber-50 text-amber-700 ring-amber-200",
//     open: "bg-indigo-50 text-indigo-700 ring-indigo-200",
//     accepted: "bg-emerald-50 text-emerald-700 ring-emerald-200",
//     closed: "bg-slate-100 text-slate-700 ring-slate-200",
//   };
//   return (
//     <span
//       className={`px-2 py-1 text-xs rounded-full ring-1 ${
//         map[status] || map.open
//       }`}
//     >
//       {status}
//     </span>
//   );
// }
// src/components/TaskList.jsx
import React from "react";

/**
 * props:
 * - tasks: Task[]                          // 原始任务数组
 * - applications: Record<taskId, App[]>    // 申请按任务分组
 * - getSitterName: (id) => string
 * - onDelete: (taskId) => void
 * - onAccept: (taskId, sitterId) => void
 * - q, setQ: 搜索框状态
 * - statusFilter, setStatusFilter: 状态筛选
 * - page, setPage: 分页状态
 * - pageSize?: number  (默认 3)
 * - className?: string (用于外层容器定高/圆角等)
 */

export default function TaskList({
  tasks = [],
  applications = {},
  getSitterName,
  onDelete,
  onAccept,
  q,
  setQ,
  statusFilter,
  setStatusFilter,
  page,
  setPage,
  pageSize = 3,
  className = "",
}) {
  // 过滤 + 排序
  const filtered = React.useMemo(() => {
    const ql = (q || "").trim().toLowerCase();
    return tasks
      .filter((t) => (statusFilter ? t.status === statusFilter : true))
      .filter((t) => {
        if (!ql) return true;
        const hay = `${t.description || ""} ${t.location || ""} ${
          t.petType || ""
        }`.toLowerCase();
        return hay.includes(ql);
      })
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [tasks, q, statusFilter]);

  // 分页
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageClamped = Math.min(page || 1, totalPages);
  const paged = filtered.slice(
    (pageClamped - 1) * pageSize,
    pageClamped * pageSize
  );

  // 当搜索/筛选变化时，父组件最好把 page 置 1。这里也防御一下：
  React.useEffect(() => {
    if (pageClamped !== page) setPage?.(pageClamped);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageClamped]);

  return (
    <section className={`flex flex-col ${className}`}>
      {/* 工具条（固定） */}
      <div className="sticky top-0 z-10 p-3 rounded-t-2xl bg-white/80 backdrop-blur ring-1 ring-black/5 flex flex-wrap items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ?.(e.target.value)}
          placeholder="Search description / location"
          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter?.(e.target.value)}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="closed">Closed</option>
        </select>
        <div className="text-xs text-slate-500 ml-auto">
          {filtered.length} task{filtered.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* 列表（在容器内滚动） */}
      <div className="flex-1 overflow-y-auto space-y-4 px-0 pt-3 pb-3">
        {paged.length === 0 ? (
          <div className="rounded-2xl bg-white/70 ring-1 ring-black/5 p-8 text-center">
            <p className="text-slate-700">No tasks.</p>
          </div>
        ) : (
          paged.map((task) => {
            const apps = applications[String(task._id)] || [];
            return (
              <div
                key={task._id}
                className="rounded-2xl bg-white/80 ring-1 ring-black/5 shadow-sm p-4 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      {task.petType || "Task"}
                    </h3>
                    <div className="mt-1 flex flex-wrap gap-2 text-sm text-slate-600">
                      {task.date && (
                        <span>{new Date(task.date).toLocaleString()}</span>
                      )}
                      {task.duration && <span>• {task.duration}h</span>}
                      {task.location && <span>• {task.location}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={task.status || "open"} />
                    <button
                      onClick={() => onDelete?.(task._id)}
                      className="text-slate-500 hover:text-red-600 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {task.description && (
                  <p className="mt-3 text-sm text-slate-700">
                    {task.description}
                  </p>
                )}

                <div className="mt-3 border-t pt-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-600">
                      Applications:{" "}
                      <span className="font-medium">{apps.length}</span>
                    </p>
                    {task.status === "open" && apps.length > 0 && (
                      <span className="text-xs text-slate-500">
                        Click “Accept” to choose a sitter
                      </span>
                    )}
                  </div>

                  {apps.length > 0 ? (
                    <div className="mt-2 space-y-2">
                      {apps.map((app) => (
                        <div
                          key={app._id}
                          className="flex justify-between items-center rounded-lg bg-slate-50 px-3 py-2 text-sm"
                        >
                          <span className="text-slate-700">
                            {getSitterName?.(app.sitterId)}
                          </span>
                          {task.status === "pending" ||
                          app.status === "accepted" ? (
                            <span className="text-slate-500">
                              {app.status === "accepted"
                                ? "Accepted"
                                : "Pending"}
                            </span>
                          ) : (
                            <button
                              onClick={() =>
                                onAccept?.(
                                  String(task._id),
                                  String(app.sitterId)
                                )
                              }
                              className="rounded-md bg-indigo-600 px-3 py-1 text-white hover:bg-indigo-700"
                            >
                              Accept
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-slate-400">
                      No applications yet
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 分页（固定） */}
      <div className="rounded-b-2xl bg-white/80 ring-1 ring-black/5 border-t px-3 py-2 flex items-center justify-end gap-2 text-sm">
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

/* 内部用的小徽章，不依赖外部 */
function StatusBadge({ status = "open" }) {
  const map = {
    pending: "bg-amber-50 text-amber-700 ring-amber-200",
    open: "bg-indigo-50 text-indigo-700 ring-indigo-200",
    accepted: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    closed: "bg-slate-100 text-slate-700 ring-slate-200",
  };
  const cls = map[status] || map.open;
  return (
    <span className={`px-2 py-1 text-xs rounded-full ring-1 ${cls}`}>
      {status}
    </span>
  );
}

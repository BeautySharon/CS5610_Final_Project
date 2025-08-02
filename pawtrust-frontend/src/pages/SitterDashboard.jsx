// import { useEffect, useMemo, useState } from "react";
// import { BASE_URL } from "../config";

// function StatusBadge({ status = "open" }) {
//   const map = {
//     open: "bg-indigo-50 text-indigo-700 ring-indigo-200",
//     pending: "bg-amber-50 text-amber-700 ring-amber-200",
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

// export default function SitterDashboard() {
//   const [tasks, setTasks] = useState([]);
//   const [appliedTaskIds, setAppliedTaskIds] = useState(new Set());
//   const [acceptedTasks, setAcceptedTasks] = useState([]);
//   const [messages, setMessages] = useState({});
//   const [loading, setLoading] = useState(true);

//   // 简单分页
//   const PAGE_SIZE = 3;
//   const [page, setPage] = useState(1);
//   const [acceptedPage, setAcceptedPage] = useState(1);

//   const sitterId =
//     typeof window !== "undefined" ? localStorage.getItem("userId") : null;

//   useEffect(() => {
//     if (!sitterId) return;
//     (async () => {
//       try {
//         setLoading(true);
//         await Promise.all([
//           fetchTasks(),
//           fetchApplicationsBySitter(),
//           fetchAcceptedTasks(),
//         ]);
//       } finally {
//         setLoading(false);
//       }
//     })();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [sitterId]);

//   // 可申请任务
//   const fetchTasks = async () => {
//     try {
//       const res = await fetch(`${BASE_URL}/pawtrust/tasks/available`);
//       const data = await res.json();
//       setTasks(Array.isArray(data) ? data : []);
//     } catch (err) {
//       console.error("Failed to fetch tasks:", err);
//     }
//   };

//   // 当前 sitter 提交过的申请
//   const fetchApplicationsBySitter = async () => {
//     try {
//       const res = await fetch(
//         `${BASE_URL}/pawtrust/applications/sitter/${sitterId}`
//       );
//       const data = await res.json();
//       const appliedSet = new Set(
//         (Array.isArray(data) ? data : []).map((app) => app.taskId)
//       );
//       setAppliedTaskIds(appliedSet);
//     } catch (err) {
//       console.error("Failed to fetch applications:", err);
//     }
//   };

//   // 当前 sitter 被接受的任务
//   const fetchAcceptedTasks = async () => {
//     try {
//       const res = await fetch(
//         `${BASE_URL}/pawtrust/applications/sitter/${sitterId}`
//       );
//       const apps = await res.json();
//       const acceptedApps = (Array.isArray(apps) ? apps : []).filter(
//         (a) => a.status === "accepted"
//       );

//       const taskDetails = await Promise.all(
//         acceptedApps.map(async (app) => {
//           const r = await fetch(
//             `${BASE_URL}/pawtrust/tasks/list/${app.taskId}`
//           );
//           return await r.json();
//         })
//       );

//       setAcceptedTasks(taskDetails.filter(Boolean));
//     } catch (err) {
//       console.error("Failed to fetch accepted tasks:", err);
//     }
//   };

//   const handleMessageChange = (taskId, message) => {
//     setMessages((prev) => ({ ...prev, [taskId]: message }));
//   };

//   const applyToTask = async (taskId) => {
//     const message = messages[taskId] || "";
//     const payload = {
//       taskId,
//       sitterId,
//       message,
//       status: "pending",
//       createdAt: new Date().toISOString(),
//     };

//     try {
//       const res = await fetch(`${BASE_URL}/pawtrust/applications/apply`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       });

//       const data = await res.json();
//       if (res.ok) {
//         setAppliedTaskIds((prev) => new Set(prev).add(taskId));
//         // 可选：清空对应留言
//         setMessages((prev) => ({ ...prev, [taskId]: "" }));
//       } else {
//         alert("Failed to apply: " + (data?.error || "Unknown error"));
//       }
//     } catch (err) {
//       console.error("Error applying:", err);
//       alert("Network or server error.");
//     }
//   };

//   // 排序：最新在前
//   const sortedTasks = useMemo(
//     () =>
//       [...tasks].sort(
//         (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
//       ),
//     [tasks]
//   );

//   // 分页切片
//   const totalPages = Math.max(1, Math.ceil(sortedTasks.length / PAGE_SIZE));
//   const pageClamped = Math.min(page, totalPages);
//   const pagedTasks = sortedTasks.slice(
//     (pageClamped - 1) * PAGE_SIZE,
//     pageClamped * PAGE_SIZE
//   );

//   const accTotalPages = Math.max(
//     1,
//     Math.ceil(acceptedTasks.length / PAGE_SIZE)
//   );
//   const accPageClamped = Math.min(acceptedPage, accTotalPages);
//   const pagedAccepted = acceptedTasks.slice(
//     (accPageClamped - 1) * PAGE_SIZE,
//     accPageClamped * PAGE_SIZE
//   );

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-sky-50 px-6 py-6">
//       <div className="mx-auto max-w-6xl space-y-8">
//         {/* Header */}
//         <header>
//           <h1 className="text-2xl font-semibold text-slate-900">
//             Welcome, Sitter!
//           </h1>
//           <p className="text-slate-600">
//             Browse open tasks and track accepted ones.
//           </p>
//         </header>

//         {/* Available Tasks */}
//         <section className="rounded-2xl bg-white/80 backdrop-blur ring-1 ring-black/5 shadow-xl">
//           <div className="px-4 py-3 border-b">
//             <h2 className="text-lg font-semibold text-slate-900">
//               Available Tasks
//             </h2>
//           </div>

//           <div className="p-4">
//             {loading ? (
//               <div className="animate-pulse space-y-3">
//                 <div className="h-16 rounded-xl bg-slate-200/60" />
//                 <div className="h-16 rounded-xl bg-slate-200/60" />
//                 <div className="h-16 rounded-xl bg-slate-200/60" />
//               </div>
//             ) : pagedTasks.length === 0 ? (
//               <div className="rounded-xl bg-white/70 ring-1 ring-black/5 p-8 text-center">
//                 <p className="text-slate-700">No open tasks right now.</p>
//               </div>
//             ) : (
//               <div className="space-y-4">
//                 {pagedTasks.map((task) => (
//                   <div
//                     key={task._id}
//                     className="rounded-2xl bg-white/80 ring-1 ring-black/5 shadow-sm p-4 hover:shadow-md transition"
//                   >
//                     {/* 顶部信息 */}
//                     <div className="flex items-start justify-between gap-3">
//                       <div>
//                         <h3 className="text-base font-semibold text-slate-900">
//                           {task.petType || "Task"}
//                         </h3>
//                         <div className="mt-1 flex flex-wrap gap-2 text-sm text-slate-600">
//                           {task.date && (
//                             <span>{new Date(task.date).toLocaleString()}</span>
//                           )}
//                           {task.duration && <span>• {task.duration}h</span>}
//                           {task.location && <span>• {task.location}</span>}
//                         </div>
//                       </div>
//                       <StatusBadge status={task.status || "open"} />
//                     </div>

//                     {/* 描述 */}
//                     {task.description && (
//                       <p className="mt-3 text-sm text-slate-700">
//                         {task.description}
//                       </p>
//                     )}

//                     {/* 操作区 */}
//                     <div className="mt-3 border-t pt-3">
//                       {appliedTaskIds.has(task._id) ? (
//                         <div className="text-emerald-700 text-sm font-medium flex items-center gap-2">
//                           <span>✅ Applied</span>
//                         </div>
//                       ) : (
//                         <div>
//                           <textarea
//                             className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100 mb-2"
//                             placeholder="Leave a message for the owner..."
//                             rows={2}
//                             value={messages[task._id] || ""}
//                             onChange={(e) =>
//                               handleMessageChange(task._id, e.target.value)
//                             }
//                           />
//                           <button
//                             className="rounded-xl bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
//                             onClick={() => applyToTask(task._id)}
//                           >
//                             Apply
//                           </button>
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}

//             {/* 分页 */}
//             {!loading && sortedTasks.length > 0 && (
//               <div className="mt-3 flex items-center justify-end gap-2 text-sm">
//                 <button
//                   className="rounded-lg px-3 py-1 ring-1 ring-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50"
//                   onClick={() => setPage((p) => Math.max(1, p - 1))}
//                   disabled={pageClamped === 1}
//                 >
//                   Prev
//                 </button>
//                 <span className="text-slate-500">
//                   Page {pageClamped} / {totalPages}
//                 </span>
//                 <button
//                   className="rounded-lg px-3 py-1 ring-1 ring-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50"
//                   onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
//                   disabled={pageClamped === totalPages}
//                 >
//                   Next
//                 </button>
//               </div>
//             )}
//           </div>
//         </section>

//         {/* Accepted Tasks */}
//         <section className="rounded-2xl bg-white/80 backdrop-blur ring-1 ring-black/5 shadow-xl">
//           <div className="px-4 py-3 border-b">
//             <h2 className="text-lg font-semibold text-slate-900">
//               Accepted Tasks
//             </h2>
//           </div>

//           <div className="p-4">
//             {pagedAccepted.length === 0 ? (
//               <p className="text-slate-600">No accepted tasks yet.</p>
//             ) : (
//               <div className="space-y-4">
//                 {pagedAccepted.map((task) => (
//                   <div
//                     key={task._id}
//                     className="rounded-2xl ring-1 ring-emerald-200 bg-emerald-50 p-4"
//                   >
//                     <div className="flex items-start justify-between gap-3">
//                       <div>
//                         <h3 className="text-base font-semibold text-emerald-900">
//                           {task.petType || "Task"}
//                         </h3>
//                         <div className="mt-1 flex flex-wrap gap-2 text-sm text-emerald-800/80">
//                           {task.date && (
//                             <span>{new Date(task.date).toLocaleString()}</span>
//                           )}
//                           {task.duration && <span>• {task.duration}h</span>}
//                           {task.location && <span>• {task.location}</span>}
//                         </div>
//                       </div>
//                       <StatusBadge status="accepted" />
//                     </div>

//                     {task.description && (
//                       <p className="mt-3 text-sm text-emerald-900/90">
//                         {task.description}
//                       </p>
//                     )}
//                   </div>
//                 ))}
//               </div>
//             )}

//             {/* 分页 */}
//             {acceptedTasks.length > 0 && (
//               <div className="mt-3 flex items-center justify-end gap-2 text-sm">
//                 <button
//                   className="rounded-lg px-3 py-1 ring-1 ring-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50"
//                   onClick={() => setAcceptedPage((p) => Math.max(1, p - 1))}
//                   disabled={accPageClamped === 1}
//                 >
//                   Prev
//                 </button>
//                 <span className="text-slate-500">
//                   Page {accPageClamped} / {accTotalPages}
//                 </span>
//                 <button
//                   className="rounded-lg px-3 py-1 ring-1 ring-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50"
//                   onClick={() =>
//                     setAcceptedPage((p) => Math.min(accTotalPages, p + 1))
//                   }
//                   disabled={accPageClamped === accTotalPages}
//                 >
//                   Next
//                 </button>
//               </div>
//             )}
//           </div>
//         </section>
//       </div>
//     </div>
//   );
// }
// src/pages/SitterDashboard.jsx
import { useEffect, useState } from "react";
import { BASE_URL } from "../config";
import AvailableTasks from "../components/AvailableTasks";
import AcceptedTasks from "../components/AcceptedTasks";

export default function SitterDashboard() {
  const [tasks, setTasks] = useState([]);
  const [appliedTaskIds, setAppliedTaskIds] = useState(new Set());
  const [acceptedTasks, setAcceptedTasks] = useState([]);
  const [messages, setMessages] = useState({});
  const [loading, setLoading] = useState(true);

  // 分页
  const [page, setPage] = useState(1); // 左列：Available
  const [accPage, setAccPage] = useState(1); // 右列：Accepted

  const sitterId =
    typeof window !== "undefined" ? localStorage.getItem("userId") : null;

  useEffect(() => {
    if (!sitterId) return;
    (async () => {
      try {
        setLoading(true);
        await Promise.all([
          fetchTasks(),
          fetchApplicationsBySitter(),
          fetchAcceptedTasks(),
        ]);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sitterId]);

  const fetchTasks = async () => {
    try {
      const res = await fetch(`${BASE_URL}/pawtrust/tasks/available`);
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    }
  };

  const fetchApplicationsBySitter = async () => {
    try {
      const res = await fetch(
        `${BASE_URL}/pawtrust/applications/sitter/${sitterId}`
      );
      const data = await res.json();
      const setIds = new Set(
        (Array.isArray(data) ? data : []).map((a) => a.taskId)
      );
      setAppliedTaskIds(setIds);
    } catch (err) {
      console.error("Failed to fetch applications:", err);
    }
  };

  const fetchAcceptedTasks = async () => {
    try {
      const res = await fetch(
        `${BASE_URL}/pawtrust/applications/sitter/${sitterId}`
      );
      const apps = await res.json();
      const acceptedApps = (Array.isArray(apps) ? apps : []).filter(
        (a) => a.status === "accepted"
      );
      const detail = await Promise.all(
        acceptedApps.map(async (app) => {
          const r = await fetch(
            `${BASE_URL}/pawtrust/tasks/list/${app.taskId}`
          );
          return await r.json();
        })
      );
      setAcceptedTasks(detail.filter(Boolean));
    } catch (err) {
      console.error("Failed to fetch accepted tasks:", err);
    }
  };

  const handleMessageChange = (taskId, message) => {
    setMessages((prev) => ({ ...prev, [taskId]: message }));
  };

  const applyToTask = async (taskId) => {
    const message = messages[taskId] || "";
    const payload = {
      taskId,
      sitterId,
      message,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    try {
      const res = await fetch(`${BASE_URL}/pawtrust/applications/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setAppliedTaskIds((prev) => new Set(prev).add(taskId));
        setMessages((prev) => ({ ...prev, [taskId]: "" }));
      } else {
        alert("Failed to apply: " + (data?.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Error applying:", err);
      alert("Network or server error.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-sky-50">
      <div className="px-6 py-6 space-y-6 max-w-[1600px] 2xl:max-w-[1760px] mx-auto">
        {/* Header */}
        <header>
          <h1 className="text-2xl font-semibold text-slate-900">
            Welcome, Sitter!
          </h1>
          <p className="text-slate-600">
            Browse open tasks and track accepted ones.
          </p>
        </header>

        {/* 两列等宽 + 固定外框高度 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* 左列 */}
          <div className="lg:col-span-6">
            <div className="lg:h-[720px]">
              <AvailableTasks
                className="h-full"
                tasks={tasks}
                appliedTaskIds={appliedTaskIds}
                messages={messages}
                onMessageChange={handleMessageChange}
                onApply={applyToTask}
                loading={loading}
                page={page}
                setPage={setPage}
                pageSize={3} // 左：每页 3
              />
            </div>
          </div>
          {/* 右列 */}
          <div className="lg:col-span-6">
            <div className="lg:h-[720px]">
              <AcceptedTasks
                className="h-full"
                tasks={acceptedTasks}
                page={accPage}
                setPage={setAccPage}
                pageSize={6} // 右：每页 6
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

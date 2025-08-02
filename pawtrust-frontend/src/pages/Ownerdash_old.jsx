// import { useEffect, useMemo, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import PostTaskForm from "../components/PostTaskForm";
// import { BASE_URL } from "../config";

// /** @typedef {{ _id: string, description: string, status?: ("open"|"pending"|"accepted"|"closed"), owner_id?: string, createdAt?: string|Date }} Task */
// /** @typedef {{ _id: string, name: string, bio?: string, location?: string }} Sitter */
// /** @typedef {{ _id: string, taskId: string, sitterId: string, status?: ("pending"|"accepted"|"rejected"), createdAt?: string|Date }} Application */

// export default function OwnerDashboard() {
//   const navigate = useNavigate();
//   const [ownerId, setOwnerId] = useState(null);
//   const [tasks, setTasks] = useState([]); // Task[]
//   const [sitters, setSitters] = useState([]); // Sitter[]
//   const [applications, setApplications] = useState({}); // Record<string, Application[]>
//   const [newTask, setNewTask] = useState("");

//   // Get ownerId from localStorage
//   useEffect(() => {
//     const id = localStorage.getItem("userId");
//     if (!id) {
//       navigate("/login");
//     } else {
//       setOwnerId(id);
//     }
//   }, [navigate]);

//   // Fetch tasks/sitters/applications
//   useEffect(() => {
//     if (!ownerId) return;

//     const fetchAll = async () => {
//       try {
//         const [taskRes, sitterRes, appRes] = await Promise.all([
//           // fetch(`http://localhost:5001/pawtrust/tasks/owner/${ownerId}`),
//           // fetch(`http://localhost:5001/pawtrust/sitters`),
//           // fetch(`http://localhost:5001/pawtrust/applications`),
//           fetch(`${BASE_URL}/pawtrust/tasks/owner/${ownerId}`),
//           fetch(`${BASE_URL}/pawtrust/sitters`),
//           fetch(`${BASE_URL}/pawtrust/applications`),
//         ]);

//         const taskData = await taskRes.json();
//         const sitterData = await sitterRes.json();
//         const appData = await appRes.json();

//         setTasks(Array.isArray(taskData) ? taskData : []);
//         setSitters(Array.isArray(sitterData) ? sitterData : []);

//         const grouped = {};
//         (Array.isArray(appData) ? appData : []).forEach((app) => {
//           const key = String(app.taskId);
//           if (!grouped[key]) grouped[key] = [];
//           grouped[key].push(app);
//         });
//         setApplications(grouped);
//       } catch (err) {
//         console.error("Error loading dashboard:", err);
//       }
//     };

//     fetchAll();
//   }, [ownerId]);

//   const handlePostTask = async () => {
//     if (!newTask.trim()) return;

//     const newTaskObj = {
//       description: newTask,
//       owner_id: ownerId || undefined,
//       createdAt: new Date(),
//       status: "open",
//     };

//     // const res = await fetch(`http://localhost:5001/pawtrust/tasks`, {
//     const res = await fetch(`${BASE_URL}/pawtrust/tasks`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(newTaskObj),
//     });

//     if (res.ok) {
//       const { insertedId } = await res.json();
//       setTasks((prev) => [...prev, { ...newTaskObj, _id: insertedId }]);
//       setNewTask("");
//     }
//   };

//   // Find application by taskId+sitterId, then send applicationId+taskId
//   const handleAccept = async (taskId, sitterId) => {
//     try {
//       const key = String(taskId);
//       const appsForTask = applications[key] || [];
//       const app = appsForTask.find(
//         (a) => String(a.sitterId) === String(sitterId)
//       );

//       if (!app?._id) {
//         alert("未找到对应的申请记录（applicationId）");
//         return;
//       }

//       // const res = await fetch("http://localhost:5001/pawtrust/accept", {
//       const res = await fetch(`${BASE_URL}/pawtrust/accept`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ applicationId: app._id, taskId }),
//       });

//       const data = await res.json();
//       if (res.ok && data.success) {
//         alert("Accepted!");
//         setTasks((prev) =>
//           prev.map((t) =>
//             String(t._id) === String(taskId) ? { ...t, status: "pending" } : t
//           )
//         );
//         setApplications((prev) => {
//           const next = { ...prev };
//           next[key] = (next[key] || []).map((x) =>
//             String(x._id) === String(app._id) ? { ...x, status: "accepted" } : x
//           );
//           return next;
//         });
//       } else {
//         alert("Failed to accept application: " + (data?.error || ""));
//       }
//     } catch (e) {
//       console.error("Accept error:", e);
//       alert("Error accepting.");
//     }
//   };

//   const sitterMap = useMemo(
//     () => new Map(sitters.map((s) => [String(s._id), s])),
//     [sitters]
//   );

//   const getSitterName = (id) => {
//     const s = sitterMap.get(String(id));
//     return s ? s.name : "Unknown";
//   };

//   const handleDelete = async (taskId) => {
//     if (!window.confirm("Are you sure you want to delete this task?")) return;
//     try {
//       const res = await fetch(
//         `${BASE_URL}/pawtrust/tasks/${taskId}`,
//         // `http://localhost:5001/pawtrust/tasks/${taskId}`,
//         {
//           method: "DELETE",
//         }
//       );
//       if (res.ok) {
//         setTasks((prev) =>
//           prev.filter((t) => String(t._id) !== String(taskId))
//         );
//       } else {
//         const data = await res.json();
//         alert("Delete failed: " + data.error);
//       }
//     } catch (err) {
//       console.error("Error deleting task:", err);
//     }
//   };

//   if (!ownerId) return <div className="p-6">Loading...</div>;

//   return (
//     <div className="p-6 space-y-6">
//       <h2 className="text-2xl font-bold">Welcome, Pet Owner!</h2>
//       <p className="text-gray-600">
//         Here you can post tasks for your pets and manage applications.
//       </p>

//       {/* Post New Task */}
//       <div className="border rounded p-4">
//         <h3 className="font-semibold mb-2">Post a new task</h3>
//         <PostTaskForm />
//       </div>

//       {/* Posted Tasks */}
//       <div>
//         <h3 className="font-semibold">Your Posted Tasks</h3>
//         {tasks.length === 0 ? (
//           <p className="text-gray-500">You haven't posted any tasks yet.</p>
//         ) : (
//           tasks.map((task) => {
//             const appsForThisTask = applications[String(task._id)] || [];
//             return (
//               <div key={task._id} className="border p-4 mt-2 rounded shadow">
//                 <p>{task.description}</p>
//                 <p>
//                   <strong>Status:</strong> {task.status || "open"}
//                 </p>
//                 <button
//                   onClick={() => handleDelete(task._id)}
//                   className="text-red-600 hover:underline ml-2"
//                 >
//                   Delete
//                 </button>

//                 <h4 className="mt-2 font-medium">Applications:</h4>
//                 {appsForThisTask.length > 0 ? (
//                   appsForThisTask.map((app) => (
//                     <div
//                       key={app._id}
//                       className="flex justify-between items-center border-t py-1 text-sm"
//                     >
//                       <span>{getSitterName(app.sitterId)}</span>
//                       {task.status === "pending" ||
//                       app.status === "accepted" ? (
//                         <span className="text-gray-500">
//                           {app.status === "accepted" ? "Accepted" : "Pending"}
//                         </span>
//                       ) : (
//                         <button
//                           onClick={() =>
//                             handleAccept(String(task._id), String(app.sitterId))
//                           }
//                           className="text-blue-600 hover:underline"
//                         >
//                           Accept
//                         </button>
//                       )}
//                     </div>
//                   ))
//                 ) : (
//                   <p className="text-gray-400">No applications yet</p>
//                 )}
//               </div>
//             );
//           })
//         )}
//       </div>

//       {/* Sitter Info */}
//       <div>
//         <h3 className="font-semibold">Available Sitters</h3>
//         {sitters.length === 0 ? (
//           <p className="text-gray-500">No sitters found.</p>
//         ) : (
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
//             {sitters.map((sitter) => (
//               <div key={sitter._id} className="border rounded p-4 shadow">
//                 <p>
//                   <strong>Name:</strong> {sitter.name}
//                 </p>
//                 <p>
//                   <strong>Bio:</strong> {sitter.bio || "N/A"}
//                 </p>
//                 <p>
//                   <strong>Location:</strong> {sitter.location || "N/A"}
//                 </p>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PostTaskForm from "../components/PostTaskForm";
import { BASE_URL } from "../config";

/** @typedef {{ _id: string, petType?: string, description: string, status?: ("open"|"pending"|"accepted"|"closed"), owner_id?: string, createdAt?: string|Date, date?: string, duration?: string, location?: string }} Task */
/** @typedef {{ _id: string, name: string, bio?: string, location?: string }} Sitter */
/** @typedef {{ _id: string, taskId: string, sitterId: string, status?: ("pending"|"accepted"|"rejected"), createdAt?: string|Date }} Application */

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

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const [ownerId, setOwnerId] = useState(null);
  const [tasks, setTasks] = useState([]); // Task[]
  const [sitters, setSitters] = useState([]); // Sitter[]
  const [applications, setApplications] = useState({}); // Record<string, Application[]>

  // 工具条（本地过滤）
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    const id = localStorage.getItem("userId");
    if (!id) navigate("/login");
    else setOwnerId(id);
  }, [navigate]);

  // 拉取数据
  useEffect(() => {
    if (!ownerId) return;
    const fetchAll = async () => {
      try {
        const [taskRes, sitterRes, appRes] = await Promise.all([
          fetch(`${BASE_URL}/pawtrust/tasks/owner/${ownerId}`),
          fetch(`${BASE_URL}/pawtrust/sitters`),
          fetch(`${BASE_URL}/pawtrust/applications`),
        ]);
        const taskData = await taskRes.json();
        const sitterData = await sitterRes.json();
        const appData = await appRes.json();

        setTasks(Array.isArray(taskData) ? taskData : []);
        setSitters(Array.isArray(sitterData) ? sitterData : []);

        const grouped = {};
        (Array.isArray(appData) ? appData : []).forEach((app) => {
          const key = String(app.taskId);
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(app);
        });
        setApplications(grouped);
      } catch (err) {
        console.error("Error loading dashboard:", err);
      }
    };
    fetchAll();
  }, [ownerId]);

  // 接受申请
  const handleAccept = async (taskId, sitterId) => {
    try {
      const key = String(taskId);
      const appsForTask = applications[key] || [];
      const app = appsForTask.find(
        (a) => String(a.sitterId) === String(sitterId)
      );
      if (!app?._id) return alert("未找到对应的申请记录");

      const res = await fetch(`${BASE_URL}/pawtrust/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: app._id, taskId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTasks((prev) =>
          prev.map((t) =>
            String(t._id) === String(taskId) ? { ...t, status: "pending" } : t
          )
        );
        setApplications((prev) => {
          const next = { ...prev };
          next[key] = (next[key] || []).map((x) =>
            String(x._id) === String(app._id) ? { ...x, status: "accepted" } : x
          );
          return next;
        });
      } else {
        alert("Accept failed.");
      }
    } catch (e) {
      console.error(e);
      alert("Error accepting.");
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm("Delete this task?")) return;
    try {
      const res = await fetch(`${BASE_URL}/pawtrust/tasks/${taskId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setTasks((prev) =>
          prev.filter((t) => String(t._id) !== String(taskId))
        );
      } else {
        const data = await res.json();
        alert("Delete failed: " + (data?.error || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const sitterMap = useMemo(
    () => new Map(sitters.map((s) => [String(s._id), s])),
    [sitters]
  );
  const getSitterName = (id) => sitterMap.get(String(id))?.name || "Unknown";

  // 过滤后的任务
  const filteredTasks = useMemo(() => {
    return tasks
      .filter((t) => (statusFilter ? t.status === statusFilter : true))
      .filter((t) => {
        if (!q.trim()) return true;
        const hay = `${t.description || ""} ${t.location || ""} ${
          t.petType || ""
        }`.toLowerCase();
        return hay.includes(q.toLowerCase());
      })
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [tasks, q, statusFilter]);

  if (!ownerId) return <div className="p-6">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-sky-50 px-4 py-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <header>
          <h2 className="text-2xl font-semibold text-slate-900">
            Welcome, Pet Owner!
          </h2>
          <p className="text-slate-600">Post tasks and manage applications.</p>
        </header>

        {/* Two columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: post form */}
          <section className="lg:col-span-1">
            <div className="rounded-2xl bg-white/80 backdrop-blur shadow-xl ring-1 ring-black/5 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">
                Post a new task
              </h3>
              <PostTaskForm />
            </div>
          </section>

          {/* Right: tasks */}
          <section className="lg:col-span-2 space-y-4">
            {/* Toolbar */}
            <div className="rounded-2xl bg-white/80 backdrop-blur ring-1 ring-black/5 p-3 flex flex-wrap items-center gap-3">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search description / location"
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">All statuses</option>
                <option value="open">Open</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="closed">Closed</option>
              </select>
              <div className="text-xs text-slate-500 ml-auto">
                {filteredTasks.length} task
                {filteredTasks.length !== 1 ? "s" : ""}
              </div>
            </div>

            {/* List */}
            {filteredTasks.length === 0 ? (
              <div className="rounded-2xl bg-white/70 ring-1 ring-black/5 p-8 text-center">
                <p className="text-slate-700">
                  You haven’t posted any tasks yet.
                </p>
              </div>
            ) : (
              filteredTasks.map((task) => {
                const appsForThisTask = applications[String(task._id)] || [];
                return (
                  <div
                    key={task._id}
                    className="rounded-2xl bg-white/80 ring-1 ring-black/5 shadow-sm p-4 hover:shadow-md transition"
                  >
                    {/* Top row */}
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
                          onClick={() => handleDelete(task._id)}
                          className="text-slate-500 hover:text-red-600 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* Description */}
                    {task.description && (
                      <p className="mt-3 text-sm text-slate-700">
                        {task.description}
                      </p>
                    )}

                    {/* Applications */}
                    <div className="mt-3 border-t pt-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-600">
                          Applications:{" "}
                          <span className="font-medium">
                            {appsForThisTask.length}
                          </span>
                        </p>
                        {task.status === "open" &&
                          appsForThisTask.length > 0 && (
                            <span className="text-xs text-slate-500">
                              Click “Accept” to choose a sitter
                            </span>
                          )}
                      </div>

                      {appsForThisTask.length > 0 ? (
                        <div className="mt-2 space-y-2">
                          {appsForThisTask.map((app) => (
                            <div
                              key={app._id}
                              className="flex justify-between items-center rounded-lg bg-slate-50 px-3 py-2 text-sm"
                            >
                              <span className="text-slate-700">
                                {getSitterName(app.sitterId)}
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
                                    handleAccept(
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
          </section>
        </div>

        {/* Available Sitters */}
        <section>
          <h3 className="text-lg font-semibold text-slate-900 mb-3">
            Available Sitters
          </h3>
          {sitters.length === 0 ? (
            <div className="rounded-2xl bg-white/70 ring-1 ring-black/5 p-8 text-center">
              <p className="text-slate-700">No sitters found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sitters.map((s) => (
                <div
                  key={s._id}
                  className="rounded-2xl bg-white/80 ring-1 ring-black/5 p-4"
                >
                  <p className="font-medium text-slate-900">{s.name}</p>
                  <p className="text-sm text-slate-600 mt-1">
                    {s.bio || <span className="text-slate-400">No bio</span>}
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    {s.location || (
                      <span className="text-slate-400">No location</span>
                    )}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

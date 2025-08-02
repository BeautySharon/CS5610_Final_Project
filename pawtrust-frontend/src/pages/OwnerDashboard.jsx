import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../config";
import TaskList from "../components/TaskList";
import SitterList from "../components/SitterList";
import PostTaskForm from "../components/PostTaskForm";

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const [ownerId, setOwnerId] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [sitters, setSitters] = useState([]);
  const [applications, setApplications] = useState({});

  // 工具条与分页状态（交给 TaskList/SitterList，通过 props 传）
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [taskPage, setTaskPage] = useState(1);
  const [sitterPage, setSitterPage] = useState(1);

  useEffect(() => {
    const id = localStorage.getItem("userId");
    if (!id) navigate("/login");
    else setOwnerId(id);
  }, [navigate]);

  useEffect(() => {
    if (!ownerId) return;
    (async () => {
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
        (Array.isArray(appData) ? appData : []).forEach((a) => {
          const k = String(a.taskId);
          if (!grouped[k]) grouped[k] = [];
          grouped[k].push(a);
        });
        setApplications(grouped);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [ownerId]);

  const sitterMap = useMemo(
    () => new Map(sitters.map((s) => [String(s._id), s])),
    [sitters]
  );
  const getSitterName = (id) => sitterMap.get(String(id))?.name || "Unknown";

  const handleAccept = async (taskId, sitterId) => {
    try {
      const apps = applications[String(taskId)] || [];
      const app = apps.find((a) => String(a.sitterId) === String(sitterId));
      if (!app?._id) return alert("未找到对应申请记录");

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
          next[String(taskId)] = (next[String(taskId)] || []).map((x) =>
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
      if (res.ok)
        setTasks((prev) =>
          prev.filter((t) => String(t._id) !== String(taskId))
        );
      else {
        const data = await res.json();
        alert("Delete failed: " + (data?.error || "Unknown error"));
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!ownerId) return <div className="p-6">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-sky-50">
      {/* 顶部 */}
      <div className="px-6 pt-6">
        <h2 className="text-2xl font-semibold text-slate-900">
          Welcome, Pet Owner!
        </h2>
        <p className="text-slate-600">Post tasks and manage applications.</p>
      </div>

      {/* 上面两块：Post + Tasks */}
      <div className="px-6 mt-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* 左：PostTaskCard 等高 + 内部滚动 */}
          <div className="lg:col-span-4">
            <div className="rounded-2xl bg-white/80 backdrop-blur shadow-xl ring-1 ring-black/5 lg:h-[640px]">
              {/* 让内容在卡片内部滚动，而不是把下面的区域挤下去 */}
              <div className="h-full overflow-y-auto p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-3">
                  Post a new task
                </h3>
                <PostTaskForm />
              </div>
            </div>
          </div>

          {/* 右：TaskList 等高（你已有） */}
          <div className="lg:col-span-8">
            <TaskList
              className="rounded-2xl bg-white/80 ring-1 ring-black/5 lg:h-[640px]"
              tasks={tasks}
              applications={applications}
              getSitterName={getSitterName}
              onDelete={handleDelete}
              onAccept={handleAccept}
              q={q}
              setQ={setQ}
              statusFilter={statusFilter}
              setStatusFilter={(v) => {
                setStatusFilter(v);
                setTaskPage(1); // 切换筛选回第一页
              }}
              page={taskPage}
              setPage={setTaskPage}
              pageSize={3}
            />
          </div>
        </div>
      </div>

      {/* 下面整块：Sitters */}
      <div className="px-6 mt-8 pb-10">
        <SitterList
          sitters={sitters}
          page={sitterPage}
          setPage={setSitterPage}
          pageSize={3}
        />
      </div>
    </div>
  );
}

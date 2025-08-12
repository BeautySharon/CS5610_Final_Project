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
  const handleFinishLocal = (taskId) => {
    setAcceptedTasks((prev) =>
      prev.map((t) =>
        String(t._id) === String(taskId) ? { ...t, status: "finished" } : t
      )
    );
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
                tasks={acceptedTasks}
                page={accPage}
                setPage={setAccPage}
                pageSize={6}
                onFinishedLocal={handleFinishLocal}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

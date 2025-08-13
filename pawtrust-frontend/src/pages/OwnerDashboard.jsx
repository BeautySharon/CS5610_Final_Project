import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../config";
import TaskList from "../components/TaskList";
import SitterList from "../components/SitterList";
import PostTaskForm from "../components/PostTaskForm";
import EditTaskModal from "../components/EditTaskModal";
import TaskCalendar from "../components/TaskCalendar";
import ReviewModal from "../components/ReviewModal";

export default function OwnerDashboard() {
  const navigate = useNavigate();

  const [ownerId, setOwnerId] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [sitters, setSitters] = useState([]);
  const [applications, setApplications] = useState({});

  const [calendarOpen, setCalendarOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeDateISO, setComposeDateISO] = useState("");

  const [reviewTask, setReviewTask] = useState(null);

  // toolbar + pagination
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [taskPage, setTaskPage] = useState(1);
  const [sitterPage, setSitterPage] = useState(1);

  // edit modal
  const [editingTask, setEditingTask] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Refetch owner data when needed
  const refetchOwnerData = useCallback(async () => {
    if (!ownerId) return;
    try {
      const [taskRes, appRes] = await Promise.all([
        fetch(`${BASE_URL}/pawtrust/tasks/owner/${ownerId}`),
        fetch(`${BASE_URL}/pawtrust/applications?ownerId=${ownerId}`),
      ]);
      if (!taskRes.ok || !appRes.ok) return;
      const [taskData, appData] = await Promise.all([
        taskRes.json(),
        appRes.json(),
      ]);

      const safeTasks = Array.isArray(taskData) ? taskData : [];
      setTasks(safeTasks);

      const taskIds = new Set(safeTasks.map((t) => String(t._id)));
      const grouped = {};
      (Array.isArray(appData) ? appData : [])
        .filter((a) => taskIds.has(String(a.taskId)))
        .forEach((a) => {
          const k = String(a.taskId);
          (grouped[k] ||= []).push(a);
        });
      setApplications(grouped);
    } catch (e) {
      console.error(e);
    }
  }, [ownerId]);

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
          fetch(`${BASE_URL}/pawtrust/applications?ownerId=${ownerId}`),
        ]);

        if (!taskRes.ok || !sitterRes.ok || !appRes.ok) {
          console.error("Fetch failed", { taskRes, sitterRes, appRes });
          return;
        }

        const [taskData, sitterData, appData] = await Promise.all([
          taskRes.json(),
          sitterRes.json(),
          appRes.json(),
        ]);

        const safeTasks = Array.isArray(taskData) ? taskData : [];
        setTasks(safeTasks);
        setSitters(Array.isArray(sitterData) ? sitterData : []);

        const taskIds = new Set(safeTasks.map((t) => String(t._id)));
        const grouped = {};
        (Array.isArray(appData) ? appData : [])
          .filter((a) => taskIds.has(String(a.taskId)))
          .forEach((a) => {
            const k = String(a.taskId);
            (grouped[k] ||= []).push(a);
          });
        setApplications(grouped);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [ownerId]);

  const acceptedByTask = useMemo(() => {
    const m = {};
    Object.entries(applications || {}).forEach(([taskId, apps]) => {
      const acc = (apps || []).find((a) => a.status === "accepted");
      if (acc) m[String(taskId)] = String(acc.sitterId);
    });
    return m;
  }, [applications]);

  const sitterMap = useMemo(
    () => new Map(sitters.map((s) => [String(s._id), s])),
    [sitters]
  );
  const getSitterName = (id) => sitterMap.get(String(id))?.name || "Unknown";

  const openEdit = (task) => {
    setEditingTask(task);
    setModalOpen(true);
  };
  const closeEdit = () => {
    setModalOpen(false);
    setEditingTask(null);
  };

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

      if (!res.ok) return alert("Accept failed.");
      const data = await res.json();
      if (!data?.success) return alert("Accept failed.");

      setTasks((prev) =>
        prev.map((t) =>
          String(t._id) === String(taskId)
            ? { ...t, status: "assigned", acceptedSitterId: sitterId }
            : t
        )
      );
      setApplications((prev) => {
        const next = { ...prev };
        next[String(taskId)] = (next[String(taskId)] || []).map((x) =>
          String(x._id) === String(app._id)
            ? { ...x, status: "accepted" }
            : { ...x, status: "rejected" }
        );
        return next;
      });
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
      if (!res.ok) {
        let msg = "Unknown error";
        try {
          const data = await res.json();
          msg = data?.error || msg;
        } catch {}
        return alert("Delete failed: " + msg);
      }
      setTasks((prev) => prev.filter((t) => String(t._id) !== String(taskId)));
      setApplications((prev) => {
        const { [String(taskId)]: _ignore, ...rest } = prev;
        return rest;
      });
    } catch (e) {
      console.error(e);
    }
  };

  const replaceTaskInList = (updated) => {
    if (!updated?._id) return;
    setTasks((prev) =>
      prev.map((t) => (String(t._id) === String(updated._id) ? updated : t))
    );
  };

  if (!ownerId) return <div className="p-6">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-sky-50">
      {/* header */}
      <div className="px-6 pt-6">
        <h2 className="text-2xl font-semibold text-slate-900">
          Welcome, Pet Owner!
        </h2>
        <p className="text-slate-600">Post tasks and manage applications.</p>
      </div>

      {/* post + tasks */}
      <div className="px-6 mt-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* left: PostTask */}
          <div className="lg:col-span-4">
            <div className="rounded-2xl bg-white/80 backdrop-blur shadow-xl ring-1 ring-black/5 lg:h-[640px]">
              <div className="h-full overflow-y-auto p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-3">
                  Post a new task
                </h3>
                <PostTaskForm
                  ownerId={ownerId}
                  // onCreated={(t) => setTasks((prev) => [t, ...prev])}
                  onCreated={(t) => {
                    setTasks((prev) => [t, ...prev]);
                    setQ("");
                    setStatusFilter("");
                    setTaskPage(1); // reset to first page
                    refetchOwnerData();
                  }}
                />
              </div>
            </div>
          </div>

          {/* right: TaskList */}
          <div className="lg:col-span-8">
            <TaskList
              className="rounded-2xl bg-white/80 ring-1 ring-black/5 lg:h-[640px]"
              tasks={tasks}
              applications={applications}
              acceptedByTask={acceptedByTask}
              getSitterName={getSitterName}
              onDelete={handleDelete}
              onAccept={handleAccept}
              onEdit={openEdit}
              onReview={(task) => setReviewTask(task)}
              q={q}
              setQ={setQ}
              statusFilter={statusFilter}
              setStatusFilter={(v) => {
                setStatusFilter(v);
                setTaskPage(1);
              }}
              page={taskPage}
              setPage={setTaskPage}
              pageSize={3}
            />

            <EditTaskModal
              open={modalOpen}
              task={editingTask}
              onClose={closeEdit}
              onSaved={replaceTaskInList}
            />

            <ReviewModal
              open={!!reviewTask}
              onClose={() => setReviewTask(null)}
              taskId={reviewTask?._id || null}
              ownerId={ownerId}
              onSubmitted={(reviewObj) => {
                const safeRating = Number(
                  reviewObj?.rating ?? reviewObj?.data?.rating ?? 0
                );
                replaceTaskInList({
                  ...reviewTask,
                  reviewed: true,
                  rating: safeRating,
                });
                setReviewTask(null);
              }}
            />
          </div>
        </div>
      </div>

      {/* calendar */}
      <div className="px-6 mt-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-slate-900">Calendar</h3>
          <button
            className="rounded-xl bg-indigo-600 text-white px-3 py-2 hover:bg-indigo-700"
            onClick={() => setCalendarOpen((v) => !v)}
          >
            {calendarOpen ? "Hide" : "Show"} Calendar
          </button>
        </div>

        {calendarOpen && (
          <TaskCalendar
            tasks={tasks}
            initialView="timeGridWeek"
            onCreate={(iso) => {
              setComposeDateISO(iso);
              setComposeOpen(true);
            }}
            onOpen={(taskId) => {
              const t = tasks.find((x) => String(x._id) === String(taskId));
              if (t) openEdit(t);
            }}
          />
        )}
      </div>

      {/* Create Task Modal (from calendar click) */}
      {composeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setComposeOpen(false)}
          />
          <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Create Task</h3>
              <button
                className="text-slate-500 hover:text-slate-700"
                onClick={() => setComposeOpen(false)}
              >
                ✕
              </button>
            </div>
            <PostTaskForm
              ownerId={ownerId}
              initialDate={composeDateISO}
              // onCreated={(t) => {
              //   setTasks((prev) => [t, ...prev]);
              //   setComposeOpen(false);
              // }}
              onCreated={(t) => {
                setTasks((prev) => [t, ...prev]);
                setQ("");
                setStatusFilter("");
                setTaskPage(1);
                setComposeOpen(false);
                refetchOwnerData();
              }}
            />
          </div>
        </div>
      )}

      {/* sitters */}
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

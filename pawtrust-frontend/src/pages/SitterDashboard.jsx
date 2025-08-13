import { useEffect, useMemo, useState } from "react";
import { BASE_URL } from "../config";
import AvailableTasks from "../components/AvailableTasks";
import AcceptedTasks from "../components/AcceptedTasks";

export default function SitterDashboard() {
  const [tasks, setTasks] = useState([]);
  const [appliedTaskIds, setAppliedTaskIds] = useState(new Set());

  const [acceptedTasks, setAcceptedTasks] = useState([]);
  const [finishedTasks, setFinishedTasks] = useState([]);

  const [reviewsByTask, setReviewsByTask] = useState({}); // { [taskId]: review|null }
  const [messages, setMessages] = useState({});
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1); // Available
  const [accPage, setAccPage] = useState(1); // Accepted
  const [finPage, setFinPage] = useState(1); // Finished

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
          fetchAcceptedAndFinished(),
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
        (Array.isArray(data) ? data : []).map((a) => String(a.taskId))
      );
      setAppliedTaskIds(setIds);
    } catch (err) {
      console.error("Failed to fetch applications:", err);
    }
  };

  const fetchAcceptedAndFinished = async () => {
    try {
      const res = await fetch(
        `${BASE_URL}/pawtrust/applications/sitter/${sitterId}`
      );
      const apps = await res.json();
      const acceptedApps = (Array.isArray(apps) ? apps : []).filter(
        (a) => a.status === "accepted" // 👈 只看 owner 已接受
      );

      const details = await Promise.all(
        acceptedApps.map(async (app) => {
          try {
            const r = await fetch(
              `${BASE_URL}/pawtrust/tasks/list/${app.taskId}`
            );
            return await r.json();
          } catch {
            return null;
          }
        })
      );
      const all = details.filter(Boolean);

      const accOnly = all.filter((t) => t.status !== "finished");
      const finOnly = all.filter((t) => t.status === "finished");

      setAcceptedTasks(accOnly);
      setFinishedTasks((prev) => {
        const map = new Map(prev.map((x) => [String(x._id), x]));
        finOnly.forEach((x) =>
          map.set(String(x._id), { ...x, status: "finished" })
        );
        return Array.from(map.values());
      });

      const toLoad = finOnly
        .map((t) => String(t._id))
        .filter((id) => !(id in reviewsByTask));
      if (toLoad.length) {
        const results = await Promise.all(
          toLoad.map(async (taskId) => {
            try {
              const r = await fetch(
                `${BASE_URL}/pawtrust/reviews/task/${taskId}`
              );
              if (!r.ok) return { taskId, review: null };
              const review = await r.json();
              return { taskId, review: review ?? null };
            } catch {
              return { taskId, review: null };
            }
          })
        );
        setReviewsByTask((prev) => {
          const next = { ...prev };
          results.forEach(({ taskId, review }) => (next[taskId] = review));
          return next;
        });
      }
    } catch (err) {
      console.error("Failed to fetch accepted/finished tasks:", err);
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
        setAppliedTaskIds((prev) => new Set(prev).add(String(taskId)));
        setMessages((prev) => ({ ...prev, [taskId]: "" }));
      } else {
        alert("Failed to apply: " + (data?.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Error applying:", err);
      alert("Network or server error.");
    }
  };

  const handleFinishLocal = (task) => {
    const taskId = String(task._id);

    setAcceptedTasks((prev) => prev.filter((t) => String(t._id) !== taskId));

    setFinishedTasks((prev) => {
      if (prev.some((t) => String(t._id) === taskId)) return prev;
      return [{ ...task, status: "finished" }, ...prev];
    });

    if (!(taskId in reviewsByTask)) {
      (async () => {
        try {
          const r = await fetch(`${BASE_URL}/pawtrust/reviews/task/${taskId}`);
          const review = r.ok ? await r.json() : null;
          setReviewsByTask((prev) => ({ ...prev, [taskId]: review }));
        } catch {
          setReviewsByTask((prev) => ({ ...prev, [taskId]: null }));
        }
      })();
    }
  };

  const finishedSorted = useMemo(
    () =>
      [...finishedTasks].sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt || 0) -
          new Date(a.updatedAt || a.createdAt || 0)
      ),
    [finishedTasks]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-sky-50">
      <div className="px-6 py-6 space-y-6 max-w-[1800px] 2xl:max-w-[1960px] mx-auto">
        <header>
          <h1 className="text-2xl font-semibold text-slate-900">
            Welcome, Sitter!
          </h1>
          <p className="text-slate-600">
            Browse open tasks, track accepted ones, and see finished reviews.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/*：Available */}
          <div className="lg:col-span-4">
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
                pageSize={3}
              />
            </div>
          </div>

          {/* Status: Accepted (only shown after the owner has accepted) */}
          <div className="lg:col-span-4">
            <div className="lg:h-[720px]">
              <AcceptedTasks
                tasks={acceptedTasks} // Parent component ensures only non-finished items.
                page={accPage}
                setPage={setAccPage}
                pageSize={6}
                onFinishedLocal={handleFinishLocal} // Pass the task object
              />
            </div>
          </div>

          {/* right：Finished + Reviews */}
          <div className="lg:col-span-4">
            <div className="lg:h-[720px]">
              <FinishedTasks
                tasks={finishedSorted}
                reviewsByTask={reviewsByTask}
                page={finPage}
                setPage={setFinPage}
                pageSize={6}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stars({ n = 0 }) {
  const full = Math.max(0, Math.min(5, Math.round(n)));
  return (
    <div className="flex gap-1 text-amber-500" aria-label={`${full} stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i}>{i < full ? "★" : "☆"}</span>
      ))}
    </div>
  );
}

function FinishedTasks({
  tasks = [],
  reviewsByTask = {},
  page,
  setPage,
  pageSize = 6,
}) {
  const totalPages = Math.max(1, Math.ceil(tasks.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pageItems = tasks.slice(start, start + pageSize);

  return (
    <div className="h-full flex flex-col rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
      <div className="px-4 py-3 border-b">
        <h2 className="font-semibold text-slate-900">Finished & Reviews</h2>
        <p className="text-slate-500 text-sm">
          Completed tasks and their reviews (if any)
        </p>
      </div>

      <div className="flex-1 overflow-auto divide-y">
        {pageItems.length === 0 ? (
          <div className="p-6 text-slate-500">No completed tasks for now</div>
        ) : (
          pageItems.map((t) => {
            const id = String(t._id);
            const rv = reviewsByTask[id] ?? null;
            return (
              <div key={id} className="p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-slate-900">
                    {(t.petType || "pet") + " • " + (t.location || "")}
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full ring-1 ring-emerald-200 bg-emerald-50 text-emerald-700">
                    finished
                  </span>
                </div>
                <div className="text-slate-600 text-sm line-clamp-2">
                  {t.description}
                </div>
                <div className="text-slate-500 text-xs">
                  {t.date ? new Date(t.date).toLocaleString() : ""}
                </div>

                <div className="mt-2 rounded-lg bg-slate-50 p-3">
                  {rv ? (
                    <div className="space-y-1">
                      <Stars n={rv.rating || 0} />
                      <div className="text-sm text-slate-800">
                        {rv.comment || "No comment"}
                      </div>
                      <div className="text-xs text-slate-500">
                        {rv.createdAt
                          ? new Date(rv.createdAt).toLocaleString()
                          : ""}
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-500 text-sm">No review yet</div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="px-4 py-3 border-t flex items-center justify-between">
        <button
          className="text-sm px-3 py-1.5 rounded-lg ring-1 ring-slate-300 disabled:opacity-40"
          onClick={() => setPage(Math.max(1, safePage - 1))}
          disabled={safePage <= 1}
        >
          Prev
        </button>
        <div className="text-sm text-slate-600">
          Page {safePage} / {totalPages}
        </div>
        <button
          className="text-sm px-3 py-1.5 rounded-lg ring-1 ring-slate-300 disabled:opacity-40"
          onClick={() => setPage(Math.min(totalPages, safePage + 1))}
          disabled={safePage >= totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}

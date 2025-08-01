import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PostTaskForm from "../components/PostTaskForm";

/** @typedef {{ _id: string, description: string, status?: ("open"|"pending"|"accepted"|"closed"), owner_id?: string, createdAt?: string|Date }} Task */
/** @typedef {{ _id: string, name: string, bio?: string, location?: string }} Sitter */
/** @typedef {{ _id: string, taskId: string, sitterId: string, status?: ("pending"|"accepted"|"rejected"), createdAt?: string|Date }} Application */

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const [ownerId, setOwnerId] = useState(null);
  const [tasks, setTasks] = useState([]); // Task[]
  const [sitters, setSitters] = useState([]); // Sitter[]
  const [applications, setApplications] = useState({}); // Record<string, Application[]>
  const [newTask, setNewTask] = useState("");

  // Get ownerId from localStorage
  useEffect(() => {
    const id = localStorage.getItem("userId");
    if (!id) {
      navigate("/login");
    } else {
      setOwnerId(id);
    }
  }, [navigate]);

  // Fetch tasks/sitters/applications
  useEffect(() => {
    if (!ownerId) return;

    const fetchAll = async () => {
      try {
        const [taskRes, sitterRes, appRes] = await Promise.all([
          fetch(`http://localhost:5001/pawtrust/tasks/owner/${ownerId}`),
          fetch(`http://localhost:5001/pawtrust/sitters`),
          fetch(`http://localhost:5001/pawtrust/applications`),
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

  const handlePostTask = async () => {
    if (!newTask.trim()) return;

    const newTaskObj = {
      description: newTask,
      owner_id: ownerId || undefined,
      createdAt: new Date(),
      status: "open",
    };

    const res = await fetch(`http://localhost:5001/pawtrust/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTaskObj),
    });

    if (res.ok) {
      const { insertedId } = await res.json();
      setTasks((prev) => [...prev, { ...newTaskObj, _id: insertedId }]);
      setNewTask("");
    }
  };

  // Find application by taskId+sitterId, then send applicationId+taskId
  const handleAccept = async (taskId, sitterId) => {
    try {
      const key = String(taskId);
      const appsForTask = applications[key] || [];
      const app = appsForTask.find(
        (a) => String(a.sitterId) === String(sitterId)
      );

      if (!app?._id) {
        alert("未找到对应的申请记录（applicationId）");
        return;
      }

      const res = await fetch("http://localhost:5001/pawtrust/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: app._id, taskId }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert("Accepted!");
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
        alert("Failed to accept application: " + (data?.error || ""));
      }
    } catch (e) {
      console.error("Accept error:", e);
      alert("Error accepting.");
    }
  };

  const sitterMap = useMemo(
    () => new Map(sitters.map((s) => [String(s._id), s])),
    [sitters]
  );

  const getSitterName = (id) => {
    const s = sitterMap.get(String(id));
    return s ? s.name : "Unknown";
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      const res = await fetch(
        `http://localhost:5001/pawtrust/tasks/${taskId}`,
        {
          method: "DELETE",
        }
      );
      if (res.ok) {
        setTasks((prev) =>
          prev.filter((t) => String(t._id) !== String(taskId))
        );
      } else {
        const data = await res.json();
        alert("Delete failed: " + data.error);
      }
    } catch (err) {
      console.error("Error deleting task:", err);
    }
  };

  if (!ownerId) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">Welcome, Pet Owner!</h2>
      <p className="text-gray-600">
        Here you can post tasks for your pets and manage applications.
      </p>

      {/* Post New Task */}
      <div className="border rounded p-4">
        <h3 className="font-semibold mb-2">Post a new task</h3>
        <PostTaskForm />
        {/* 如需用本组件内提交，可启用以下简易输入框
        <div className="flex gap-2 mt-2">
          <input
            className="border rounded px-2 py-1 flex-1"
            placeholder="Describe your pet care task..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
          />
          <button
            onClick={handlePostTask}
            className="px-3 py-1 border rounded hover:bg-gray-50"
          >
            Post
          </button>
        </div>
        */}
      </div>

      {/* Posted Tasks */}
      <div>
        <h3 className="font-semibold">Your Posted Tasks</h3>
        {tasks.length === 0 ? (
          <p className="text-gray-500">You haven't posted any tasks yet.</p>
        ) : (
          tasks.map((task) => {
            const appsForThisTask = applications[String(task._id)] || [];
            return (
              <div key={task._id} className="border p-4 mt-2 rounded shadow">
                <p>{task.description}</p>
                <p>
                  <strong>Status:</strong> {task.status || "open"}
                </p>
                <button
                  onClick={() => handleDelete(task._id)}
                  className="text-red-600 hover:underline ml-2"
                >
                  Delete
                </button>

                <h4 className="mt-2 font-medium">Applications:</h4>
                {appsForThisTask.length > 0 ? (
                  appsForThisTask.map((app) => (
                    <div
                      key={app._id}
                      className="flex justify-between items-center border-t py-1 text-sm"
                    >
                      <span>{getSitterName(app.sitterId)}</span>
                      {task.status === "pending" ||
                      app.status === "accepted" ? (
                        <span className="text-gray-500">
                          {app.status === "accepted" ? "Accepted" : "Pending"}
                        </span>
                      ) : (
                        <button
                          onClick={() =>
                            handleAccept(String(task._id), String(app.sitterId))
                          }
                          className="text-blue-600 hover:underline"
                        >
                          Accept
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400">No applications yet</p>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Sitter Info */}
      <div>
        <h3 className="font-semibold">Available Sitters</h3>
        {sitters.length === 0 ? (
          <p className="text-gray-500">No sitters found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            {sitters.map((sitter) => (
              <div key={sitter._id} className="border rounded p-4 shadow">
                <p>
                  <strong>Name:</strong> {sitter.name}
                </p>
                <p>
                  <strong>Bio:</strong> {sitter.bio || "N/A"}
                </p>
                <p>
                  <strong>Location:</strong> {sitter.location || "N/A"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

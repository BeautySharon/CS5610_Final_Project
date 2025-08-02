// import { useEffect, useState } from "react";

// export default function SitterDashboard() {
//   const [tasks, setTasks] = useState([]);
//   const [appliedTaskIds, setAppliedTaskIds] = useState(new Set());
//   const [messages, setMessages] = useState({});
//   const sitterId = localStorage.getItem("userId");
//   const fetchApplicationsBySitter = async () => {
//     try {
//       const res = await fetch(
//         `http://localhost:5001/pawtrust/applications/sitter/${sitterId}`
//       );
//       const data = await res.json();
//       const appliedSet = new Set(data.map((app) => app.taskId));
//       setAppliedTaskIds(appliedSet);
//     } catch (err) {
//       console.error("Failed to fetch applications:", err);
//     }
//   };
//   useEffect(() => {
//     if (!sitterId) return;
//     fetchTasks();
//     fetchApplicationsBySitter();
//   }, [sitterId]);

//   const fetchTasks = async () => {
//     try {
//       const res = await fetch("http://localhost:5001/pawtrust/tasks/available");
//       const data = await res.json();
//       setTasks(data);
//     } catch (err) {
//       console.error("Failed to fetch tasks:", err);
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
//       const res = await fetch(
//         "http://localhost:5001/pawtrust/applications/apply",
//         {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify(payload),
//         }
//       );

//       const data = await res.json();
//       if (res.ok) {
//         alert("Applied successfully!");
//         setAppliedTaskIds((prev) => new Set(prev).add(taskId));
//       } else {
//         alert("Failed to apply: " + (data.error || "Unknown error"));
//       }
//     } catch (err) {
//       console.error("Error applying:", err);
//       alert("Network or server error.");
//     }
//   };

//   return (
//     <div className="p-6">
//       <h1 className="text-2xl font-bold mb-4">Available Tasks</h1>
//       {tasks.length === 0 ? (
//         <p>No open tasks right now.</p>
//       ) : (
//         <ul className="space-y-4">
//           {tasks.map((task) => (
//             <li key={task._id} className="border p-4 rounded shadow">
//               <p>
//                 <strong>Pet Type:</strong> {task.petType}
//               </p>
//               <p>
//                 <strong>Description:</strong> {task.description}
//               </p>
//               <p>
//                 <strong>Duration:</strong> {task.duration}
//               </p>
//               <p>
//                 <strong>Location:</strong> {task.location}
//               </p>
//               <p>
//                 <strong>Date:</strong> {new Date(task.date).toLocaleString()}
//               </p>

//               {appliedTaskIds.has(task._id) ? (
//                 <p className="text-green-600 font-semibold mt-2">✅ Applied</p>
//               ) : (
//                 <div className="mt-2">
//                   <textarea
//                     className="w-full p-2 border rounded mb-2"
//                     placeholder="Leave a message for the owner..."
//                     value={messages[task._id] || ""}
//                     onChange={(e) =>
//                       handleMessageChange(task._id, e.target.value)
//                     }
//                   />
//                   <button
//                     className="px-4 py-2 bg-blue-600 text-white rounded"
//                     onClick={() => applyToTask(task._id)}
//                   >
//                     Apply
//                   </button>
//                 </div>
//               )}
//             </li>
//           ))}
//         </ul>
//       )}
//     </div>
//   );
// }
import { useEffect, useState } from "react";
import { BASE_URL } from "../config";

export default function SitterDashboard() {
  const [tasks, setTasks] = useState([]);
  const [appliedTaskIds, setAppliedTaskIds] = useState(new Set());
  const [acceptedTasks, setAcceptedTasks] = useState([]);
  const [messages, setMessages] = useState({});
  const sitterId = localStorage.getItem("userId");

  // Fetch available tasks & applied applications
  useEffect(() => {
    if (!sitterId) return;
    fetchTasks();
    fetchApplicationsBySitter();
    fetchAcceptedTasks();
  }, [sitterId]);

  // Get all available tasks
  const fetchTasks = async () => {
    try {
      // const res = await fetch("http://localhost:5001/pawtrust/tasks/available");
      const res = await fetch(`${BASE_URL}/pawtrust/tasks/available`);
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    }
  };

  // Get applications submitted by current sitter
  const fetchApplicationsBySitter = async () => {
    try {
      const res = await fetch(
        // `http://localhost:5001/pawtrust/applications/sitter/${sitterId}`
        `${BASE_URL}/pawtrust/applications/sitter/${sitterId}`
      );
      const data = await res.json();
      const appliedSet = new Set(data.map((app) => app.taskId));
      setAppliedTaskIds(appliedSet);
    } catch (err) {
      console.error("Failed to fetch applications:", err);
    }
  };

  // Get tasks where current sitter was accepted
  const fetchAcceptedTasks = async () => {
    try {
      const res = await fetch(
        // `http://localhost:5001/pawtrust/applications/sitter/${sitterId}`
        `${BASE_URL}/pawtrust/applications/sitter/${sitterId}`
      );
      const apps = await res.json();
      const acceptedApps = apps.filter((app) => app.status === "accepted");

      const taskDetails = await Promise.all(
        acceptedApps.map(async (app) => {
          const res = await fetch(
            // `http://localhost:5001/pawtrust/tasks/list/${app.taskId}`
            `${BASE_URL}/pawtrust/tasks/list/${app.taskId}`
          );
          return await res.json();
        })
      );
      setAcceptedTasks(taskDetails);
    } catch (err) {
      console.error("Failed to fetch accepted tasks:", err);
    }
  };

  // Handle textarea change
  const handleMessageChange = (taskId, message) => {
    setMessages((prev) => ({ ...prev, [taskId]: message }));
  };

  // Handle apply button
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
      const res = await fetch(
        // "http://localhost:5001/pawtrust/applications/apply",
        `${BASE_URL}/pawtrust/applications/apply`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();
      if (res.ok) {
        alert("Applied successfully!");
        setAppliedTaskIds((prev) => new Set(prev).add(taskId));
      } else {
        alert("Failed to apply: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Error applying:", err);
      alert("Network or server error.");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Available Tasks</h1>
      {tasks.length === 0 ? (
        <p>No open tasks right now.</p>
      ) : (
        <ul className="space-y-4">
          {tasks.map((task) => (
            <li key={task._id} className="border p-4 rounded shadow">
              <p>
                <strong>Pet Type:</strong> {task.petType}
              </p>
              <p>
                <strong>Description:</strong> {task.description}
              </p>
              <p>
                <strong>Duration:</strong> {task.duration}
              </p>
              <p>
                <strong>Location:</strong> {task.location}
              </p>
              <p>
                <strong>Date:</strong> {new Date(task.date).toLocaleString()}
              </p>

              {appliedTaskIds.has(task._id) ? (
                <p className="text-green-600 font-semibold mt-2">✅ Applied</p>
              ) : (
                <div className="mt-2">
                  <textarea
                    className="w-full p-2 border rounded mb-2"
                    placeholder="Leave a message for the owner..."
                    value={messages[task._id] || ""}
                    onChange={(e) =>
                      handleMessageChange(task._id, e.target.value)
                    }
                  />
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded"
                    onClick={() => applyToTask(task._id)}
                  >
                    Apply
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* ✅ Accepted Tasks Section */}
      <div className="mt-10">
        <h2 className="text-xl font-semibold mb-3">✅ Accepted Tasks</h2>
        {acceptedTasks.length === 0 ? (
          <p className="text-gray-500">No accepted tasks yet.</p>
        ) : (
          <ul className="space-y-4">
            {acceptedTasks.map((task) => (
              <li
                key={task._id}
                className="border p-4 rounded shadow bg-green-50"
              >
                <p>
                  <strong>Pet Type:</strong> {task.petType}
                </p>
                <p>
                  <strong>Description:</strong> {task.description}
                </p>
                <p>
                  <strong>Duration:</strong> {task.duration}
                </p>
                <p>
                  <strong>Location:</strong> {task.location}
                </p>
                <p>
                  <strong>Date:</strong> {new Date(task.date).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

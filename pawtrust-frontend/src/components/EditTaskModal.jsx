import { useEffect, useMemo, useState } from "react";
import { BASE_URL } from "../config";

function toLocalDatetimeValue(d) {
  if (!d) return "";
  const dt = new Date(d);
  const off = dt.getTimezoneOffset();
  const local = new Date(dt.getTime() - off * 60000);
  return local.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:mm"
}

export default function EditTaskModal({ open, task, onClose, onSaved }) {
  const ownerId =
    typeof window !== "undefined" ? localStorage.getItem("userId") : null;

  const initial = useMemo(
    () => ({
      petType: task?.petType ?? "",
      description: task?.description ?? "",
      date: task?.date ? toLocalDatetimeValue(task.date) : "",
      duration: String(task?.duration ?? ""), // keep as string for input
      location: task?.location ?? "",
      status: task?.status ?? "open",
    }),
    [task]
  );

  const [form, setForm] = useState(initial);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => setForm(initial), [initial]);

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!task?._id) return;

    setSubmitting(true);
    try {
      // Normalize fields
      const payload = {
        ...form,
        date: form.date ? new Date(form.date).toISOString() : null,
        duration:
          form.duration === ""
            ? null
            : Number.isNaN(Number(form.duration))
            ? form.duration
            : Number(form.duration),
        // owner_id: ownerId,
      };

      const res = await fetch(`${BASE_URL}/pawtrust/tasks/${task._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Try to parse JSON even on error to surface message
      let data;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        const msg = (data && (data.error || data.message)) || "Update failed";
        alert(msg);
        return;
      }

      // Accept either { task: {...} } or {...} as the updated object
      const updated = data?.task ?? data;

      if (!updated || !updated._id) {
        console.warn("PUT /tasks returned unexpected shape:", data);
        alert("Update succeeded but response was unexpected.");
        // Fallback: still close to avoid trapping user
        onClose?.();
        return;
      }

      onSaved?.(updated); //  always pass a task object with _id
      onClose?.();
    } catch (err) {
      console.error(err);
      alert("Network/Server error.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Dialog */}
      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Edit Task</h3>
          <button
            className="text-slate-500 hover:text-slate-700"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              name="petType"
              placeholder="Pet Type"
              className="rounded-xl border border-slate-300 px-3 py-2"
              value={form.petType}
              onChange={handleChange}
            />
            <input
              name="location"
              placeholder="Location"
              className="rounded-xl border border-slate-300 px-3 py-2"
              value={form.location}
              onChange={handleChange}
            />
            <input
              name="date"
              type="datetime-local"
              className="rounded-xl border border-slate-300 px-3 py-2"
              value={form.date}
              onChange={handleChange}
            />
            <input
              name="duration"
              placeholder="Duration (hours)"
              className="rounded-xl border border-slate-300 px-3 py-2"
              value={form.duration}
              onChange={handleChange}
            />
          </div>

          <textarea
            name="description"
            placeholder="Description"
            rows={3}
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
            value={form.description}
            onChange={handleChange}
          />

          <div>
            <label className="block text-sm text-slate-600 mb-1">Status</label>
            <select
              name="status"
              className="rounded-xl border border-slate-300 px-3 py-2"
              value={form.status}
              onChange={handleChange}
            >
              <option value="open">Open</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="closed">Closed</option>
              {/* If you switched to "assigned", add it:
                  <option value="assigned">Assigned</option>
               */}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 ring-1 ring-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {submitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

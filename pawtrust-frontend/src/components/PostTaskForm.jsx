import { useState, useEffect } from "react";
import { BASE_URL } from "../config";

function toDatetimeLocalValue(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60000);
  return local.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
}
// export default function PostTaskForm({ initialDate = "" }) {
export default function PostTaskForm({ ownerId, onCreated, initialDate = "" }) {
  const [form, setForm] = useState({
    petType: "",
    description: "",
    date: initialDate ? toDatetimeLocalValue(initialDate) : "",
    duration: "",
    location: "",
    status: "open",
  });
  useEffect(() => {
    // 当 initialDate 变化时同步
    setForm((f) => ({
      ...f,
      date: initialDate ? toDatetimeLocalValue(initialDate) : "",
    }));
  }, [initialDate]);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  // const owner_id = localStorage.getItem("userId") || "";

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setOk("");

    // 最小校验
    if (
      !form.petType ||
      !form.description ||
      !form.date ||
      !form.duration ||
      !form.location
    ) {
      setErr("Please fill in all required fields.");
      return;
    }

    try {
      setLoading(true);
      if (!ownerId) throw new Error("Owner not found. Please log in again.");
      const dateISO = new Date(form.date).toISOString();
      const res = await fetch(`${BASE_URL}/pawtrust/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          petType: form.petType,
          description: form.description,
          date: dateISO,
          duration: form.duration,
          location: form.location,
          status: form.status ?? "open",
          owner_id: ownerId,
        }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data?.error || data?.message || "Failed to post task.");
      setOk("Task posted successfully!");
      if (typeof onCreated === "function") {
        onCreated(data);
      }
      // 可选：清空表单
      setForm({
        petType: "",
        description: "",
        date: "",
        duration: "",
        location: "",
        status: "open",
      });
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white/80 backdrop-blur shadow-xl ring-1 ring-black/5 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Post a Task</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Pet Type */}
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Pet Type
          </span>
          <select
            name="petType"
            value={form.petType}
            onChange={handleChange}
            className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm
                       focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100"
            required
          >
            <option value="" disabled>
              Select a pet
            </option>
            <option value="dog">Dog</option>
            <option value="cat">Cat</option>
            <option value="other">Other</option>
          </select>
        </label>

        {/* Description */}
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Description
          </span>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            placeholder="Walk the dog, feed, medication, special notes..."
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder:text-slate-400 shadow-sm
                       focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100"
            required
          />
        </label>

        {/* Date & Duration */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Date & Time
            </span>
            <input
              name="date"
              type="datetime-local"
              value={form.date}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm
                         focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100"
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Duration (hours)
            </span>
            <input
              name="duration"
              type="number"
              min="0.5"
              step="0.5"
              placeholder="e.g., 1.5"
              value={form.duration}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder:text-slate-400 shadow-sm
                         focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100"
              required
            />
          </label>
        </div>

        {/* Location */}
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Location
          </span>
          <input
            name="location"
            placeholder="e.g., 123 Main St, San Jose, CA"
            value={form.location}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder:text-slate-400 shadow-sm
                       focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100"
            required
          />
        </label>

        {/* Status  */}
        {/* <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Status</span>
          <select ...>open / closed</select>
        </label> */}

        {/* Aleart information */}
        {err && (
          <div className="rounded-lg bg-red-50 text-red-700 px-3 py-2 text-sm border border-red-200">
            {err}
          </div>
        )}
        {ok && (
          <div className="rounded-lg bg-emerald-50 text-emerald-700 px-3 py-2 text-sm border border-emerald-200">
            {ok}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 font-medium text-white shadow-sm transition
                     hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-200
                     disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Posting..." : "Post Task"}
        </button>
      </form>
    </div>
  );
}

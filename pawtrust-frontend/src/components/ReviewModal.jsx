import { useState } from "react";
import { BASE_URL } from "../config";

function Star({ index, filled, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(index)}
      className="text-2xl mx-0.5"
      aria-label={`rate-${index}`}
      title={`${index} star${index > 1 ? "s" : ""}`}
    >
      {filled ? "★" : "☆"}
    </button>
  );
}

export default function ReviewModal({
  open,
  onClose,
  taskId,
  ownerId,
  onSubmitted,
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();
    if (!taskId || !ownerId) return alert("Missing task/owner id");
    if (rating < 1 || rating > 5) return alert("Please select 1–5 stars.");

    const localPayload = { taskId, ownerId, rating, comment };

    onSubmitted?.(localPayload);
    onClose?.();

    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/pawtrust/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(localPayload),
      });

      let data = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        const msg = (data && (data.error || data.message)) || "Submit failed";
        console.warn("Review POST failed:", msg);
        alert("Review saved locally. Server error: " + msg);
      }
    } catch (err) {
      console.warn("Review POST error:", err);
      alert("Review saved locally. Network error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Leave a Review</h3>
          <button
            className="text-slate-500 hover:text-slate-700"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <div className="mb-1 text-sm text-slate-700">Rating</div>
            <div>
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  index={n}
                  filled={n <= rating}
                  onClick={setRating}
                />
              ))}
            </div>
            {rating === 0 && (
              <div className="text-xs text-amber-600 mt-1">
                Please select a rating.
              </div>
            )}
          </div>

          <div>
            <div className="mb-1 text-sm text-slate-700">
              Comment (optional)
            </div>
            <textarea
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write something..."
            />
          </div>

          <button
            type="submit"
            disabled={loading || rating === 0}
            className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </form>
      </div>
    </div>
  );
}

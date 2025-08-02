export default function SitterList({ sitters, page, setPage, pageSize = 3 }) {
  const totalPages = Math.max(1, Math.ceil(sitters.length / pageSize));
  const pageClamped = Math.min(page, totalPages);
  const paged = sitters.slice(
    (pageClamped - 1) * pageSize,
    pageClamped * pageSize
  );

  return (
    <section>
      <h3 className="text-lg font-semibold text-slate-900 mb-3">
        Available Sitters
      </h3>

      {paged.length === 0 ? (
        <div className="rounded-2xl bg-white/70 ring-1 ring-black/5 p-8 text-center">
          <p className="text-slate-700">No sitters found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {paged.map((s) => (
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

      <div className="mt-3 flex items-center justify-end gap-2 text-sm">
        <button
          className="rounded-lg px-3 py-1 ring-1 ring-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={pageClamped === 1}
        >
          Prev
        </button>
        <span className="text-slate-500">
          Page {pageClamped} / {totalPages}
        </span>
        <button
          className="rounded-lg px-3 py-1 ring-1 ring-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={pageClamped === totalPages}
        >
          Next
        </button>
      </div>
    </section>
  );
}

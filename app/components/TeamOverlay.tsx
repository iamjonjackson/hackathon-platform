"use client";

import { formatTimestamp, type TeamDetail } from "@/lib/shared";

export default function TeamOverlay({
  detail,
  onClose,
}: {
  detail: TeamDetail | null;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
          <div>
            <h2 className="text-xl font-bold">{detail?.name ?? "Loading…"}</h2>
            {detail && (
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {detail.total} points
                {detail.description ? ` · ${detail.description}` : ""}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-4">
          {!detail ? (
            <p className="py-8 text-center text-neutral-500 dark:text-neutral-400">
              Loading point history…
            </p>
          ) : detail.events.length === 0 ? (
            <p className="py-8 text-center text-neutral-500 dark:text-neutral-400">
              No point history yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {detail.events.map((e) => (
                <li
                  key={e.id}
                  className="flex items-start justify-between gap-4 rounded-xl border border-neutral-200 px-4 py-3 dark:border-neutral-800"
                >
                  <div>
                    <div className="font-medium">{e.description}</div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">
                      {formatTimestamp(e.created_at)} ·{" "}
                      {e.type === "task_completion" ? "Task completion" : "Ad hoc award"}
                    </div>
                  </div>
                  <span
                    className={`shrink-0 font-bold tabular-nums ${
                      e.points >= 0
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {e.points > 0 ? `+${e.points}` : e.points}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

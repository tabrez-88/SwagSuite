/**
 * Lightweight page-level fallback. Rendered inside `<main>` when a route's
 * lazy chunk is still resolving — small, non-intrusive, and centered so it
 * doesn't trigger a layout shift against the sidebar/topbar. If you need a
 * richer skeleton for a specific surface, put it inside that page's own
 * Suspense boundary instead.
 */
export default function PageLoader() {
  return (
    <div
      className="flex items-center justify-center w-full h-full min-h-[50vh]"
      role="status"
      aria-label="Loading"
    >
      <div className="flex flex-col items-center gap-3">
        <div className="h-7 w-7 rounded-full border-2 border-gray-200 border-t-blue-600 animate-spin" />
        <span className="text-xs text-gray-500">Loading…</span>
      </div>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="w-full h-fit bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 p-4 animate-pulse">
      {/* Header skeleton */}
      <div className="flex justify-between items-start pb-3">
        <div className="flex items-center gap-2.5 flex-1">
          <div className="w-6 h-6 rounded-md bg-slate-200 dark:bg-zinc-800 shrink-0" />
          <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded w-2/3" />
        </div>
        <div className="w-4 h-4 rounded bg-slate-200 dark:bg-zinc-800 shrink-0" />
      </div>

      {/* Content skeleton */}
      <div className="mb-3">
        <div className="w-full aspect-video rounded-lg bg-slate-200 dark:bg-zinc-800" />
      </div>

      {/* Footer skeleton */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-zinc-800">
        <div className="h-3 w-14 bg-slate-200 dark:bg-zinc-800 rounded" />
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded bg-slate-200 dark:bg-zinc-800" />
          <div className="w-6 h-6 rounded bg-slate-200 dark:bg-zinc-800" />
        </div>
      </div>
    </div>
  );
}
export default SkeletonCard;

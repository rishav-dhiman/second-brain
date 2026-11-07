export type ViewMode = "grid" | "list";

interface ViewSwitcherProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

export function ViewSwitcher({ currentView, onViewChange }: ViewSwitcherProps) {
  return (
    <div className="inline-flex items-center gap-1 p-1 bg-slate-100 dark:bg-zinc-800/80 rounded-lg border border-slate-200/60 dark:border-zinc-700/60">
      <button
        onClick={() => onViewChange("grid")}
        className={`p-1.5 rounded-md transition-smooth cursor-pointer ${
          currentView === "grid"
            ? "bg-white dark:bg-zinc-700 text-primary dark:text-white shadow-xs"
            : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white"
        }`}
        title="Grid view"
        aria-label="Grid view"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
          />
        </svg>
      </button>
      <button
        onClick={() => onViewChange("list")}
        className={`p-1.5 rounded-md transition-smooth cursor-pointer ${
          currentView === "list"
            ? "bg-white dark:bg-zinc-700 text-primary dark:text-white shadow-xs"
            : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white"
        }`}
        title="List view"
        aria-label="List view"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>
    </div>
  );
}
export default ViewSwitcher;

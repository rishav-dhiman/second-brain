import type { ReactElement } from "react";

export function SidebarItem({
  text,
  icon,
  onClick,
  active = false,
}: {
  text: string;
  icon: ReactElement;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center rounded-lg py-2.5 px-3 gap-3 mb-1 text-xs font-semibold transition-smooth cursor-pointer text-left ${
        active
          ? "text-primary bg-primary-light/60 dark:text-primary-light dark:bg-primary/20"
          : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800/60"
      }`}
    >
      <span className="shrink-0">{icon}</span>
      <span className="truncate">{text}</span>
    </button>
  );
}
export default SidebarItem;

import { memo, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BrainLogo } from "../../icons/BrainLogo";
import { FileIcon } from "../../icons/FileIcon";
import { LinkIcon } from "../../icons/LinkIcon";
import { TagIcon } from "../../icons/TagIcon";
import { TwitterIcon } from "../../icons/TwitterIcon";
import { YouTubeIcon } from "../../icons/YoutubeIcon";
import { StarIcon } from "../../icons/StarIcon";
import { UserIcon } from "../../icons/UserIcon";
import { LogoutIcon } from "../../icons/LogoutIcon";
import { SidebarItem } from "./SidebarItem";
import { ThemeToggle } from "./ThemeToggle";
import { api, clearToken } from "../../lib/api";

interface SidebarProps {
  onFilterChange: (filter: string) => void;
  activeFilter: string;
  refreshKey?: number;
  onTagsChanged?: () => void;
}

interface TagRow {
  _id: string;
  name: string;
  count: number;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export const Sidebar = memo(function Sidebar({
  onFilterChange,
  activeFilter,
  refreshKey = 0,
  onTagsChanged,
}: SidebarProps) {
  const [tags, setTags] = useState<TagRow[]>([]);
  const [username, setUsername] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    api
      .get("/api/v1/profile")
      .then((res) => {
        if (!cancelled) setUsername(res.data.username ?? null);
      })
      .catch(() => {
        if (!cancelled) setUsername(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  function handleLogout() {
    setMenuOpen(false);
    clearToken();
    navigate("/signin", { replace: true });
  }

  function handleSettings() {
    setMenuOpen(false);
    navigate("/settings");
  }

  useEffect(() => {
    let cancelled = false;
    api
      .get("/api/v1/tags")
      .then((res) => {
        if (!cancelled) setTags(res.data.tags || []);
      })
      .catch(() => {
        if (!cancelled) setTags([]);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  async function deleteTag(tag: TagRow) {
    try {
      await api.delete("/api/v1/tags", { data: { tagId: tag._id } });
      setTags((prev) => prev.filter((row) => row._id !== tag._id));
      if (activeFilter === `tag:${tag._id}`) {
        onFilterChange("all");
      }
      onTagsChanged?.();
    } catch {
      // Leave the tag in place; the list refreshes on the next change
    }
  }

  return (
    <aside className="h-screen w-60 bg-white dark:bg-zinc-950 border-r border-slate-200 dark:border-zinc-800 flex flex-col shrink-0 select-none">
      {/* Logo & Theme */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-slate-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center h-8 w-8 text-primary">
            <BrainLogo size="md" />
          </div>
          <span className="font-doto text-base font-bold tracking-tight text-slate-900 dark:text-white">
            Second<span className="text-primary font-extrabold ml-0.5">Brain</span>
          </span>
        </div>
        <ThemeToggle />
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-3">
        <p className="px-3 text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
          Filters
        </p>
        <SidebarItem
          text="All Content"
          icon={<TagIcon size="md" />}
          onClick={() => onFilterChange("all")}
          active={activeFilter === "all"}
        />
        <SidebarItem
          text="Favorites"
          icon={<StarIcon size="md" filled={activeFilter === "favorites"} />}
          onClick={() => onFilterChange("favorites")}
          active={activeFilter === "favorites"}
        />
        <SidebarItem
          text="Videos"
          icon={<YouTubeIcon size="md" />}
          onClick={() => onFilterChange("youtube")}
          active={activeFilter === "youtube"}
        />
        <SidebarItem
          text="Tweets"
          icon={<TwitterIcon size="md" />}
          onClick={() => onFilterChange("twitter")}
          active={activeFilter === "twitter"}
        />
        <SidebarItem
          text="Documents"
          icon={<FileIcon size="md" />}
          onClick={() => onFilterChange("document")}
          active={activeFilter === "document"}
        />
        <SidebarItem
          text="Links"
          icon={<LinkIcon size="md" />}
          onClick={() => onFilterChange("link")}
          active={activeFilter === "link"}
        />

        {/* Tags */}
        {tags.length > 0 && (
          <>
            <p className="px-3 mt-5 text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
              Tags
            </p>
            {tags.map((tag) => {
              const isActive = activeFilter === `tag:${tag._id}`;
              return (
                <div
                  key={tag._id}
                  className={`group w-full flex items-center rounded-lg py-2 pl-3 pr-1.5 gap-2 mb-1 text-xs font-semibold transition-smooth ${
                    isActive
                      ? "text-primary bg-primary-light/60 dark:text-primary-light dark:bg-primary/20"
                      : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800/60"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onFilterChange(`tag:${tag._id}`)}
                    className="flex-1 min-w-0 flex items-center gap-3 text-left cursor-pointer"
                    title={`Filter by #${tag.name}`}
                  >
                    <span className="shrink-0 opacity-70">#</span>
                    <span className="truncate flex-1">{tag.name}</span>
                    <span className="shrink-0 text-[10px] font-bold text-slate-400 dark:text-zinc-500">
                      {tag.count}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteTag(tag)}
                    className="shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-smooth cursor-pointer"
                    title={`Delete tag #${tag.name}`}
                    aria-label={`Delete tag ${tag.name}`}
                  >
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M6 18 18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Footer: shortcut hint + user menu */}
      <div className="p-3 border-t border-slate-200 dark:border-zinc-800">
        <div className="text-[11px] text-slate-400 dark:text-zinc-500 flex items-center justify-center gap-1.5 py-1 mb-1.5">
          <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded text-[10px] font-mono text-slate-600 dark:text-zinc-300">
            ⌘K
          </kbd>
          <span>to search</span>
        </div>

        <div className="relative" ref={userMenuRef}>
          {menuOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg shadow-slate-900/5 dark:shadow-black/40 overflow-hidden z-30">
              <button
                type="button"
                onClick={handleSettings}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-white transition-smooth cursor-pointer"
              >
                <UserIcon size="md" />
                <span>Profile settings</span>
              </button>
              <div className="h-px bg-slate-100 dark:bg-zinc-800" />
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-smooth cursor-pointer"
              >
                <LogoutIcon size="md" />
                <span>Log out</span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg transition-smooth cursor-pointer ${
              menuOpen
                ? "bg-slate-100 dark:bg-zinc-800/60"
                : "hover:bg-slate-100 dark:hover:bg-zinc-800/60"
            }`}
            title="Account menu"
          >
            <span className="h-8 w-8 shrink-0 rounded-full bg-primary text-white text-[11px] font-bold flex items-center justify-center">
              {username ? getInitials(username) : <UserIcon size="md" />}
            </span>
            <span className="flex-1 min-w-0 text-left">
              <span className="block truncate text-xs font-semibold text-slate-700 dark:text-zinc-200">
                {username ?? "Account"}
              </span>
            </span>
            <svg
              className={`w-3.5 h-3.5 shrink-0 text-slate-400 dark:text-zinc-500 transition-transform ${menuOpen ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="m18 15-6-6-6 6"
              />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
});
export default Sidebar;

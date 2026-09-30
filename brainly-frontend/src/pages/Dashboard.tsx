import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { api, getErrorMessage } from "../lib/api";
import { useToast } from "../hooks/useToast";
import { useTwitterWidgets } from "../hooks/useTwitterWidgets";
import { Sidebar } from "../components/ui/Sidebar";
import { Card, type PostType } from "../components/ui/Card";
import { type TagChipItem } from "../components/ui/TagChips";
import { SkeletonCard } from "../components/ui/SkeletonCard";
import { ListView } from "../components/views/ListView";
import { MasonryGrid, useColumnCount } from "../components/views/MasonryGrid";
import { ViewSwitcher, type ViewMode } from "../components/ui/ViewSwitcher";
import { CreateContentModal } from "../components/ui/CreateContentModal";
import { EditContentModal } from "../components/ui/EditContentModal";
import { ShareBrainModal } from "../components/ui/ShareBrainModal";
import { CommandPalette } from "../components/ui/CommandPalette";
import { ShareIcon } from "../icons/ShareIcon";
import { PlusIcon } from "../icons/PlusIcon";

interface ContentItem {
  _id: string;
  title: string;
  link: string;
  type: PostType;
  tags?: TagChipItem[];
  createdAt?: string;
}

export function Dashboard() {
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const columnCount = useColumnCount();
  // Bumped whenever content changes so the sidebar re-fetches tag counts
  const [tagsVersion, setTagsVersion] = useState(0);
  // Bumped to trigger a refetch of the content list
  const [reloadKey, setReloadKey] = useState(0);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<ContentItem | null>(
    null,
  );
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Favorites / Pinned state (persisted in localStorage)
  // Array of content IDs, where index 0 is the most recently favorited (top of pinned stack)
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("brainly_favorites");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const { addToast } = useToast();

  useTwitterWidgets();

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      let updated: string[];
      if (prev.includes(id)) {
        updated = prev.filter((favId) => favId !== id);
        addToast("Removed from favorites", "info");
      } else {
        // Prepend to top: newly pinned item becomes the top one, previous top becomes second
        updated = [id, ...prev.filter((favId) => favId !== id)];
        addToast("Pinned to top", "success");
      }
      try {
        localStorage.setItem("brainly_favorites", JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to save favorites to localStorage", e);
      }
      return updated;
    });
  }, [addToast]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘K or Ctrl+K for search
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
      // ⌘N or Ctrl+N for new content
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        setIsCreateModalOpen(true);
      }
      // V to toggle view (when not inside inputs)
      if (
        e.key.toLowerCase() === "v" &&
        !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)
      ) {
        setViewMode((prev) => (prev === "grid" ? "list" : "grid"));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    let ignore = false;

    (async () => {
      try {
        const response = await api.get("/api/v1/content");
        if (ignore) return;
        setContents(response.data.content || []);
        setTagsVersion((v) => v + 1);
      } catch (error) {
        if (ignore) return;
        addToast(getErrorMessage(error, "Failed to load content"), "error");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [addToast, reloadKey]);

  const removeContentLocally = useCallback((id: string) => {
    setContents((prev) => prev.filter((c) => c._id !== id));
    setFavorites((prev) => {
      const next = prev.filter((favId) => favId !== id);
      try {
        localStorage.setItem("brainly_favorites", JSON.stringify(next));
      } catch {
        // Storage unavailable; favorites still work for this session.
      }
      return next;
    });
    setTagsVersion((v) => v + 1);
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await api.delete("/api/v1/content", { data: { contentId: id } });
      removeContentLocally(id);
      addToast("Item deleted", "success");
    } catch (error) {
      addToast(getErrorMessage(error, "Failed to delete content"), "error");
    }
  }, [addToast, removeContentLocally]);

  // Ref mirror keeps openEditById stable so memo(Card) keeps working.
  const contentsRef = useRef<ContentItem[]>([]);
  useEffect(() => {
    contentsRef.current = contents;
  }, [contents]);

  const openEditById = useCallback((id: string) => {
    const matched = contentsRef.current.find((c) => c._id === id);
    if (matched) setEditingContent(matched);
  }, []);

  const handleTagClick = useCallback((tagId: string) => {
    setFilter("tag:" + tagId);
  }, []);

  // Stable so memo(Sidebar) isn't defeated by a new closure every render.
  const handleTagsChanged = useCallback(() => setReloadKey((k) => k + 1), []);

  const filteredContents = useMemo(() => {
    // 1. Filter by category / favorites / tag / search
    const filtered = contents.filter((c) => {
      const matchesFilter =
        filter === "all"
          ? true
          : filter === "favorites"
            ? favorites.includes(c._id)
            : filter.startsWith("tag:")
              ? c.tags?.some((t) => t._id === filter.slice(4)) ?? false
              : c.type === filter;
      const matchesSearch =
        !searchQuery ||
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.link.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });

    // 2. Sort favorites (pinned) to top:
    // favorites array has newest-pinned at index 0, previous at index 1, etc.
    return [...filtered].sort((a, b) => {
      const aIndex = favorites.indexOf(a._id);
      const bIndex = favorites.indexOf(b._id);
      const aFav = aIndex !== -1;
      const bFav = bIndex !== -1;

      if (aFav && bFav) {
        return aIndex - bIndex; // lower index = pinned more recently = top
      }
      if (aFav) return -1;
      if (bFav) return 1;
      return 0; // retain default order for unpinned items
    });
  }, [contents, filter, searchQuery, favorites]);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-white overflow-hidden">
      {/* Sidebar Component */}
      <Sidebar
        onFilterChange={setFilter}
        activeFilter={filter}
        refreshKey={tagsVersion}
        onTagsChanged={handleTagsChanged}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-black">
        {/* Header */}
        <header className="h-14 px-6 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-4 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md shrink-0">
          {/* Search Bar */}
          <div className="flex-1 max-w-md relative">
            <svg
              className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <circle cx="11" cy="11" r="8" strokeWidth="2" />
              <path
                d="m21 21-4.35-4.35"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <input
              type="text"
              placeholder="Search content (or press ⌘K)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-14 bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-smooth"
            />
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-[10px] font-mono text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 transition-smooth cursor-pointer"
              title="Open Command Palette"
            >
              ⌘K
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            {/* View Switcher */}
            <ViewSwitcher currentView={viewMode} onViewChange={setViewMode} />

            {/* Share Brain Button */}
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="h-9 px-3.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-850 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-smooth cursor-pointer"
              title="Share your Second Brain"
            >
              <ShareIcon size="md" />
              <span>Share Brain</span>
            </button>

            {/* Add Content Button */}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="h-9 px-3.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-smooth cursor-pointer"
              title="Add New Content (⌘N)"
            >
              <PlusIcon size="md" />
              <span>Add Content</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filteredContents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-90 text-center p-8">
              <div className="w-14 h-14 rounded-2xl bg-primary-light/50 dark:bg-primary/20 text-primary flex items-center justify-center mb-4">
                <svg
                  className="w-7 h-7"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                {searchQuery
                  ? "No matching content found"
                  : filter === "favorites"
                    ? "No favorites pinned yet"
                    : filter.startsWith("tag:")
                      ? "No content with this tag"
                      : "Your brain is empty"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mb-5">
                {searchQuery
                  ? "Try searching for a different keyword or clear your filter."
                  : filter === "favorites"
                    ? "Click the star icon on any card to pin it to the top of your items list."
                    : filter.startsWith("tag:")
                      ? "Add this tag to some items, or tag something new to fill this view."
                      : "Save videos, tweets, links, and documents to start building your personal knowledge base."}
              </p>
              {!searchQuery && filter !== "favorites" && (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-smooth cursor-pointer"
                >
                  <PlusIcon size="sm" />
                  <span>Add your first item</span>
                </button>
              )}
            </div>
          ) : viewMode === "list" ? (
            <ListView
              contents={filteredContents}
              onDelete={handleDelete}
              onEdit={(item) => setEditingContent(item as ContentItem)}
              onTagClick={(tagId) => setFilter("tag:" + tagId)}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
            />
          ) : (
            <MasonryGrid
              items={filteredContents}
              columnCount={columnCount}
              keyOf={(content) => content._id}
              renderItem={(content) => (
                <Card
                  contentId={content._id}
                  title={content.title}
                  link={content.link}
                  type={content.type}
                  tags={content.tags}
                  onTagClick={handleTagClick}
                  createdAt={content.createdAt}
                  isFavorite={favorites.includes(content._id)}
                  onToggleFavorite={toggleFavorite}
                  onDelete={removeContentLocally}
                  onEdit={openEditById}
                />
              )}
            />
          )}
        </div>
      </main>

      {/* Create Content Modal */}
      {isCreateModalOpen && (
        <CreateContentModal
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => setReloadKey((k) => k + 1)}
        />
      )}

      {/* Edit Content Modal (Google Keep style) */}
      {editingContent && (
        <EditContentModal
          content={editingContent}
          onClose={() => setEditingContent(null)}
          onSuccess={(updated) => {
            setContents((prev) =>
              prev.map((c) => (c._id === updated._id ? { ...c, ...updated } : c)),
            );
            setTagsVersion((v) => v + 1);
          }}
        />
      )}

      {/* Share Brain Modal */}
      {isShareModalOpen && (
        <ShareBrainModal onClose={() => setIsShareModalOpen(false)} />
      )}

      {/* Command Palette (⌘K) */}
      {isCommandPaletteOpen && (
        <CommandPalette
          onClose={() => setIsCommandPaletteOpen(false)}
          onSelectContent={(id) => {
            const matched = contents.find((c) => c._id === id);
            if (matched) {
              setEditingContent(matched);
            }
          }}
        />
      )}
    </div>
  );
}

export default Dashboard;

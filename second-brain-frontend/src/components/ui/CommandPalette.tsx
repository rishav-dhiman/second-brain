import { useEffect, useRef, useState } from "react";
import { api } from "../../lib/api";

interface SearchResult {
  _id: string;
  title: string;
  link: string;
  type: string;
}

interface CommandPaletteProps {
  onClose: () => void;
  onSelectContent: (contentId: string) => void;
}

export function CommandPalette({ onClose, onSelectContent }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mounted fresh each time the palette opens
  useEffect(() => {
    const focusTimer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(focusTimer);
  }, []);

  useEffect(() => {
    if (!query.trim()) return;

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await api.get(
          `/api/v1/search?q=${encodeURIComponent(query)}`,
        );
        setResults(response.data.results || []);
        setSelectedIndex(0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter" && query.trim() && results[selectedIndex]) {
      onSelectContent(results[selectedIndex]._id);
      onClose();
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-zinc-800">
          <svg
            className="w-5 h-5 text-slate-400 dark:text-zinc-500 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search notes, tweets, videos..."
            className="flex-1 bg-transparent border-none outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 text-sm font-medium"
          />
          <kbd className="px-2 py-0.5 text-[10px] font-semibold text-slate-400 dark:text-zinc-500 bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded font-mono">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[360px] overflow-y-auto">
          {loading && (
            <div className="p-8 text-center text-slate-400 dark:text-zinc-500 text-xs">
              <div className="inline-block w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin mb-2" />
              <p>Searching...</p>
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="p-8 text-center text-slate-400 dark:text-zinc-500 text-xs">
              No results found for "{query}"
            </div>
          )}

          {!loading && query.trim() && results.length > 0 && (
            <div className="p-2 space-y-1">
              {results.map((result, index) => (
                <button
                  key={result._id}
                  onClick={() => {
                    onSelectContent(result._id);
                    onClose();
                  }}
                  className={`w-full px-3 py-2.5 rounded-lg flex items-center gap-3 text-left transition-smooth cursor-pointer ${
                    index === selectedIndex
                      ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light"
                      : "text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800"
                  }`}
                >
                  <div className="shrink-0 w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-sm">
                    {result.type === "youtube" && "🎥"}
                    {result.type === "twitter" && "🐦"}
                    {result.type === "document" && "📄"}
                    {result.type === "link" && "🔗"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-xs truncate">{result.title}</p>
                    <p className="text-[11px] text-slate-400 dark:text-zinc-500 truncate">{result.link}</p>
                  </div>
                  {index === selectedIndex && (
                    <kbd className="px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded">
                      ↵
                    </kbd>
                  )}
                </button>
              ))}
            </div>
          )}

          {!query && (
            <div className="p-6 text-center">
              <p className="text-xs text-slate-400 dark:text-zinc-500 mb-2">Type to instantly search all items</p>
              <div className="flex items-center justify-center gap-3 text-[11px] text-slate-400 dark:text-zinc-500">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-zinc-800 rounded font-mono">↑</kbd>
                  <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-zinc-800 rounded font-mono">↓</kbd>
                  to navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-zinc-800 rounded font-mono">↵</kbd>
                  to open
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default CommandPalette;

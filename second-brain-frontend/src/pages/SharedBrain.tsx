import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api, getHttpStatus } from "../lib/api";
import { useTwitterWidgets } from "../hooks/useTwitterWidgets";
import { Card, type PostType } from "../components/ui/Card";
import { type TagChipItem } from "../components/ui/TagChips";
import { BrainLogo } from "../icons/BrainLogo";
import { ThemeToggle } from "../components/ui/ThemeToggle";

interface SharedContent {
  _id: string;
  title: string;
  link: string;
  type: PostType;
  tags?: TagChipItem[];
  createdAt?: string;
}

export const SharedBrain = () => {
  const { sharelink } = useParams();
  const [username, setUsername] = useState("");
  const [contents, setContents] = useState<SharedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [errorType, setErrorType] = useState<"error" | "expired">("error");
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());

  useTwitterWidgets();

  // Keep the countdown fresh
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const fetchSharedBrain = async () => {
      try {
        const response = await api.get(`/api/v1/brain/${sharelink}`);
        setUsername(response.data.username);
        setContents(response.data.content);
        setExpiresAt(response.data.expiresAt || null);
      } catch (err) {
        if (getHttpStatus(err) === 410) {
          setErrorType("expired");
          setError("This shared brain link has expired. Ask the owner to share it again.");
        } else {
          setErrorType("error");
          setError(
            "Failed to load shared brain. The link may be invalid or expired."
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSharedBrain();
  }, [sharelink]);

  const formatRemaining = (iso: string | null) => {
    if (!iso) return "No time limit";
    const diffMs = new Date(iso).getTime() - now.getTime();
    if (diffMs <= 0) return "Expired";

    const minutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h left`;
    if (hours > 0) return `${hours}h ${minutes % 60}m left`;
    return `${minutes}m left`;
  };

  if (loading) {
    return (
      <div className="h-screen w-screen bg-slate-50 dark:bg-black flex flex-col justify-center items-center gap-3">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Loading second brain...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-screen bg-slate-50 dark:bg-black flex flex-col justify-center items-center p-6 text-center">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
            errorType === "expired"
              ? "bg-amber-100 dark:bg-amber-950/40 text-amber-500"
              : "bg-rose-100 dark:bg-rose-950/40 text-rose-500"
          }`}
        >
          {errorType === "expired" ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )}
        </div>
        <p
          className={`text-sm font-semibold max-w-sm ${
            errorType === "expired"
              ? "text-amber-600 dark:text-amber-400"
              : "text-rose-600 dark:text-rose-400"
          }`}
        >
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-white">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-primary w-9 h-9 flex items-center justify-center">
              <BrainLogo size="md" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>{username}&apos;s Second Brain</span>
                <span className="px-2 py-0.5 rounded-full bg-primary-light/60 dark:bg-primary/20 text-primary dark:text-primary-light text-[10px] font-semibold">
                  Shared
                </span>
              </h1>
              <p className="text-xs text-slate-400 dark:text-zinc-500">
                Public curated collection ({contents.length} {contents.length === 1 ? "item" : "items"})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold ${
                expiresAt
                  ? "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40"
                  : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {formatRemaining(expiresAt)}
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Content Grid */}
      <main className="max-w-7xl mx-auto p-6">
        {contents.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-8">
            <p className="text-sm text-slate-500 dark:text-zinc-400">No content shared in this brain yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start">
            {contents.map((content) => (
              <Card
                key={content._id}
                contentId={content._id}
                title={content.title}
                link={content.link}
                type={content.type}
                tags={content.tags}
                createdAt={content.createdAt}
                readOnly={true}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default SharedBrain;

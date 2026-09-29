import { useEffect, useState } from "react";
import { api, getErrorMessage } from "../../lib/api";
import { shareUrl } from "../../config";
import { useToast } from "../../hooks/useToast";
import { CrossIcon } from "../../icons/CrossIcon";
import { ShareIcon } from "../../icons/ShareIcon";

interface ShareBrainModalProps {
  onClose: () => void;
}

interface ShareStatus {
  share: boolean;
  hash: string | null;
  expiresAt: string | null;
  createdAt: string | null;
}

const EMPTY_STATUS: ShareStatus = {
  share: false,
  hash: null,
  expiresAt: null,
  createdAt: null,
};

// Duration options for a share link (minutes, null = never expires)
const EXPIRY_OPTIONS: { label: string; value: number | null }[] = [
  { label: "1 Hour", value: 60 },
  { label: "24 Hours", value: 1440 },
  { label: "7 Days", value: 10080 },
  { label: "30 Days", value: 43200 },
  { label: "No Expiry", value: null },
];

function formatRemaining(expiresAt: string | null, now: number): string {
  if (!expiresAt) return "No expiry";
  const diff = new Date(expiresAt).getTime() - now;
  if (diff <= 0) return "Expired";

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h left`;
  if (hours > 0) return `${hours}h ${minutes % 60}m left`;
  if (minutes > 0) return `${minutes}m left`;
  return `${Math.ceil(diff / 1000)}s left`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ShareBrainModal({ onClose }: ShareBrainModalProps) {
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [status, setStatus] = useState<ShareStatus>(EMPTY_STATUS);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  // "Not shared" view: selected duration before generating
  const [selectedExpiry, setSelectedExpiry] = useState<string>("7 Days");
  // "Shared" view: inline panels
  const [showExpiryOptions, setShowExpiryOptions] = useState(false);
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState(false);

  const [now, setNow] = useState(() => Date.now());
  const { addToast } = useToast();

  const link = status.hash ? shareUrl(status.hash) : "";

  // Live countdown
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Load the current share status when the modal opens
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get("/api/v1/brain/share");
        if (cancelled) return;
        setStatus({
          share: !!res.data.share,
          hash: res.data.hash ?? null,
          expiresAt: res.data.expiresAt ?? null,
          createdAt: res.data.createdAt ?? null,
        });
        setLoadFailed(false);
      } catch {
        if (!cancelled) setLoadFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  async function copyToClipboard(url: string, announce = true) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      if (announce) addToast("Link copied to clipboard!", "success");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      if (announce) addToast("Could not copy — copy it manually", "info");
    }
  }

  async function handleCreate(expiresIn: number | null) {
    setBusy(true);
    try {
      const res = await api.post("/api/v1/brain/share", {
        share: true,
        expiresIn,
      });
      setStatus({
        share: true,
        hash: res.data.hash ?? null,
        expiresAt: res.data.expiresAt ?? null,
        createdAt: res.data.createdAt ?? null,
      });
      addToast("Share link created", "success");
      if (res.data.hash) await copyToClipboard(shareUrl(res.data.hash), false);
    } catch (error) {
      addToast(getErrorMessage(error, "Failed to create share link"), "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleChangeExpiry(expiresIn: number | null) {
    setBusy(true);
    try {
      const res = await api.post("/api/v1/brain/share", {
        share: true,
        expiresIn,
      });
      setStatus((prev) => ({
        ...prev,
        expiresAt: res.data.expiresAt ?? null,
      }));
      setShowExpiryOptions(false);
      addToast("Link expiry updated", "success");
    } catch (error) {
      addToast(getErrorMessage(error, "Failed to update expiry"), "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleRegenerate() {
    setBusy(true);
    try {
      // Keep the same deadline when the current link still has time left
      let expiresIn: number | null = null;
      if (status.expiresAt) {
        const diffMs = new Date(status.expiresAt).getTime() - Date.now();
        expiresIn = diffMs > 0 ? Math.ceil(diffMs / 60000) : null;
      }
      const res = await api.post("/api/v1/brain/share", {
        share: true,
        regenerate: true,
        expiresIn,
      });
      setStatus({
        share: true,
        hash: res.data.hash ?? null,
        expiresAt: res.data.expiresAt ?? null,
        createdAt: res.data.createdAt ?? null,
      });
      setConfirmRegenerate(false);
      addToast("New link generated — the old link no longer works", "success");
      if (res.data.hash) await copyToClipboard(shareUrl(res.data.hash), false);
    } catch (error) {
      addToast(getErrorMessage(error, "Failed to regenerate link"), "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleRevoke() {
    setBusy(true);
    try {
      await api.delete("/api/v1/brain/share");
      setStatus(EMPTY_STATUS);
      setConfirmRevoke(false);
      setShowExpiryOptions(false);
      addToast("Share link revoked", "success");
    } catch (error) {
      addToast(getErrorMessage(error, "Failed to revoke link"), "error");
    } finally {
      setBusy(false);
    }
  }

  const handleShareEmail = () => {
    const subject = encodeURIComponent("Check out my Second Brain");
    const body = encodeURIComponent(
      `I've shared my curated collection of notes, videos, and links with you.\n\nView it here: ${link}`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`Check out my Second Brain! 🧠\n${link}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const handleShareTwitter = () => {
    const text = encodeURIComponent(
      "Check out my Second Brain — a curated collection of knowledge 🧠"
    );
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(link)}`,
      "_blank"
    );
  };

  const handleShareTelegram = () => {
    const text = encodeURIComponent("Check out my Second Brain! 🧠");
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${text}`,
      "_blank"
    );
  };

  const expiryIsUrgent =
    !!status.expiresAt && new Date(status.expiresAt).getTime() - now < 3600000;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex justify-center items-center z-50 p-4 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Share Second Brain"
    >
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slideUp">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4.5 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-light/60 dark:bg-primary/20 text-primary flex items-center justify-center shrink-0">
              <ShareIcon size="md" />
            </div>
            <div>
              <h2 className="font-doto text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Share Second Brain
              </h2>
              <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                {status.share
                  ? "Manage your public link"
                  : "Create a public read-only link"}
              </p>
            </div>
          </div>
          <button
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-smooth cursor-pointer"
            onClick={onClose}
            aria-label="Close modal"
          >
            <CrossIcon size="md" />
          </button>
        </div>

        {/* Body */}
        {loading ? (
          <div className="p-6 flex flex-col items-center gap-3 py-12">
            <div className="w-7 h-7 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
              Checking share status...
            </p>
          </div>
        ) : loadFailed ? (
          <div className="p-6 space-y-4">
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 text-rose-600 dark:text-rose-400 text-xs">
              Could not load your share status. Check your connection and try
              again.
            </div>
            <button
              onClick={() => {
                setLoading(true);
                setReloadKey((k) => k + 1);
              }}
              className="w-full py-2.5 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg transition-smooth cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : status.share && status.hash ? (
          <div className="p-6 space-y-5">
            {/* Link + Copy */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                Public Share Link
              </label>
              <div className="flex items-center gap-2 p-1.5 bg-slate-50 dark:bg-zinc-800/80 rounded-xl border border-slate-200 dark:border-zinc-700">
                <input
                  type="text"
                  readOnly
                  value={link}
                  className="flex-1 bg-transparent text-xs text-slate-800 dark:text-zinc-200 font-mono outline-none px-2.5 select-all min-w-0"
                />
                <button
                  onClick={() => copyToClipboard(link)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary hover:bg-primary-hover text-white transition-smooth flex items-center gap-1 cursor-pointer shrink-0 shadow-xs"
                >
                  {copied ? (
                    <>
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    "Copy"
                  )}
                </button>
              </div>
            </div>

            {/* Status row */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border ${
                  !status.expiresAt
                    ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40"
                    : expiryIsUrgent
                      ? "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/40"
                      : "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/40"
                }`}
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {formatRemaining(status.expiresAt, now)}
              </span>
              <span className="text-[11px] text-slate-400 dark:text-zinc-500">
                Shared {formatDate(status.createdAt)}
              </span>
            </div>

            {/* Link actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => {
                  setShowExpiryOptions((v) => !v);
                  setConfirmRegenerate(false);
                  setConfirmRevoke(false);
                }}
                disabled={busy}
                className={`px-3 py-1.5 rounded-lg border text-[11px] font-semibold transition-smooth cursor-pointer disabled:opacity-50 flex items-center gap-1.5 ${
                  showExpiryOptions
                    ? "border-primary text-primary bg-primary-light/40 dark:bg-primary/20"
                    : "border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800"
                }`}
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Change expiry
              </button>
              <button
                onClick={() => {
                  setConfirmRegenerate((v) => !v);
                  setConfirmRevoke(false);
                  setShowExpiryOptions(false);
                }}
                disabled={busy}
                className={`px-3 py-1.5 rounded-lg border text-[11px] font-semibold transition-smooth cursor-pointer disabled:opacity-50 flex items-center gap-1.5 ${
                  confirmRegenerate
                    ? "border-amber-400 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30"
                    : "border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800"
                }`}
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h5M20 20v-5h-5M4 9a8 8 0 0114-2.3M20 15a8 8 0 01-14 2.3"
                  />
                </svg>
                Regenerate
              </button>
              <button
                onClick={() => {
                  setConfirmRevoke((v) => !v);
                  setConfirmRegenerate(false);
                  setShowExpiryOptions(false);
                }}
                disabled={busy}
                className={`px-3 py-1.5 rounded-lg border text-[11px] font-semibold transition-smooth cursor-pointer disabled:opacity-50 flex items-center gap-1.5 ${
                  confirmRevoke
                    ? "border-rose-400 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30"
                    : "border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                }`}
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Revoke
              </button>
            </div>

            {/* Change expiry options */}
            {showExpiryOptions && (
              <div className="p-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50/70 dark:bg-zinc-800/40 space-y-2 animate-fadeIn">
                <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                  Link available for
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {EXPIRY_OPTIONS.map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => handleChangeExpiry(opt.value)}
                      disabled={busy}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[11px] font-semibold text-slate-600 dark:text-zinc-300 hover:border-primary hover:text-primary transition-smooth cursor-pointer disabled:opacity-50"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Regenerate confirm */}
            {confirmRegenerate && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 space-y-2.5 animate-fadeIn">
                <p className="text-[11px] text-amber-700 dark:text-amber-400">
                  Generate a new link? The current one will stop working
                  immediately.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleRegenerate}
                    disabled={busy}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-semibold transition-smooth cursor-pointer disabled:opacity-50"
                  >
                    {busy ? "Generating..." : "Yes, regenerate"}
                  </button>
                  <button
                    onClick={() => setConfirmRegenerate(false)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 text-[11px] font-semibold text-slate-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800 transition-smooth cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Revoke confirm */}
            {confirmRevoke && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 space-y-2.5 animate-fadeIn">
                <p className="text-[11px] text-rose-600 dark:text-rose-400">
                  Revoke public access? Anyone with this link will lose access
                  immediately.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleRevoke}
                    disabled={busy}
                    className="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-[11px] font-semibold transition-smooth cursor-pointer disabled:opacity-50"
                  >
                    {busy ? "Revoking..." : "Yes, revoke"}
                  </button>
                  <button
                    onClick={() => setConfirmRevoke(false)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 text-[11px] font-semibold text-slate-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800 transition-smooth cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Share Via */}
            <div className="space-y-2.5">
              <label className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                Share Via
              </label>
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={handleShareEmail}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 transition-smooth cursor-pointer group"
                  title="Share via Email"
                >
                  <div className="w-9 h-9 rounded-full bg-red-50 dark:bg-red-950/40 text-red-500 dark:text-red-400 flex items-center justify-center group-hover:scale-110 transition-smooth">
                    <svg
                      className="w-4.5 h-4.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400">
                    Email
                  </span>
                </button>

                <button
                  onClick={handleShareWhatsApp}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 transition-smooth cursor-pointer group"
                  title="Share via WhatsApp"
                >
                  <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-smooth">
                    <svg
                      className="w-4.5 h-4.5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400">
                    WhatsApp
                  </span>
                </button>

                <button
                  onClick={handleShareTwitter}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 transition-smooth cursor-pointer group"
                  title="Share on X / Twitter"
                >
                  <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-zinc-700/50 text-slate-700 dark:text-zinc-300 flex items-center justify-center group-hover:scale-110 transition-smooth">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400">
                    X
                  </span>
                </button>

                <button
                  onClick={handleShareTelegram}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 transition-smooth cursor-pointer group"
                  title="Share via Telegram"
                >
                  <div className="w-9 h-9 rounded-full bg-sky-50 dark:bg-sky-950/40 text-sky-500 dark:text-sky-400 flex items-center justify-center group-hover:scale-110 transition-smooth">
                    <svg
                      className="w-4.5 h-4.5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400">
                    Telegram
                  </span>
                </button>
              </div>
            </div>

            {/* Info Text */}
            <p className="text-[11px] text-slate-400 dark:text-zinc-500 leading-relaxed">
              Anyone with this link can view your collection in read-only mode.
              They cannot edit, delete, or modify your content.
            </p>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            {/* Not shared yet */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-800 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary-light/60 dark:bg-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5">
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
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-700 dark:text-zinc-200">
                  No active share link
                </p>
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5 leading-relaxed">
                  Generate a public link to your Second Brain. You can change
                  its expiry or revoke access at any time.
                </p>
              </div>
            </div>

            {/* Expiry selection */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                Link available for
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {EXPIRY_OPTIONS.map((opt) => {
                  const selected = selectedExpiry === opt.label;
                  return (
                    <button
                      key={opt.label}
                      onClick={() => setSelectedExpiry(opt.label)}
                      className={`px-3 py-2.5 rounded-xl border text-xs font-semibold transition-smooth cursor-pointer flex items-center justify-between ${
                        selected
                          ? "border-primary bg-primary-light/40 dark:bg-primary/20 text-primary dark:text-primary-light"
                          : "border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:border-slate-300 dark:hover:border-zinc-600"
                      }`}
                    >
                      {opt.label}
                      {selected && (
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Create */}
            <button
              onClick={() => {
                const opt = EXPIRY_OPTIONS.find(
                  (o) => o.label === selectedExpiry
                );
                handleCreate(opt?.value ?? null);
              }}
              disabled={busy}
              className="w-full py-2.5 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-xs transition-smooth cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <ShareIcon size="sm" />
              {busy ? "Creating link..." : "Create share link"}
            </button>

            <p className="text-[11px] text-slate-400 dark:text-zinc-500 leading-relaxed">
              Anyone with the link can view your collection in read-only mode.
              They cannot edit, delete, or modify your content.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50/70 dark:bg-zinc-900/50 border-t border-slate-100 dark:border-zinc-800">
          {status.share && link ? (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              Open public page
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg transition-smooth cursor-pointer shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
export default ShareBrainModal;

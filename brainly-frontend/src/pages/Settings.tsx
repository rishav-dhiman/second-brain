import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, clearToken, getErrorMessage } from "../lib/api";
import { useToast } from "../hooks/useToast";
import { useTheme } from "../context/theme";
import { ThemeToggle } from "../components/ui/ThemeToggle";

interface ProfileData {
  username: string;
  createdAt: string | null;
  stats: { contents: number; tags: number };
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function formatMemberSince(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const inputClass =
  "w-full h-10 px-3 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-smooth";

const labelClass = "block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5";

const cardClass =
  "rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6";

const primaryButtonClass =
  "h-9 px-4 rounded-lg bg-primary hover:bg-primary-hover disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-semibold transition-smooth cursor-pointer";

export function Settings() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [newUsername, setNewUsername] = useState("");
  const [usernameBusy, setUsernameBusy] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);

  const { addToast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await api.get("/api/v1/profile");
        if (cancelled) return;
        setProfile(response.data);
        setNewUsername(response.data.username ?? "");
        setLoadFailed(false);
      } catch (error) {
        if (cancelled) return;
        setLoadFailed(true);
        addToast(getErrorMessage(error, "Failed to load profile"), "error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [addToast, reloadKey]);

  async function handleUsernameSubmit(e: FormEvent) {
    e.preventDefault();
    const name = newUsername.trim();
    if (!name || name === profile?.username) return;

    setUsernameBusy(true);
    try {
      const response = await api.patch("/api/v1/profile", { username: name });
      setProfile((prev) =>
        prev ? { ...prev, username: response.data.username } : prev
      );
      setNewUsername(response.data.username);
      addToast("Username updated", "success");
    } catch (error) {
      addToast(getErrorMessage(error, "Failed to update username"), "error");
    } finally {
      setUsernameBusy(false);
    }
  }

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      addToast("New passwords do not match", "error");
      return;
    }

    setPasswordBusy(true);
    try {
      await api.post("/api/v1/profile/password", {
        currentPassword,
        newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      addToast("Password changed", "success");
    } catch (error) {
      addToast(getErrorMessage(error, "Failed to change password"), "error");
    } finally {
      setPasswordBusy(false);
    }
  }

  async function handleDeleteAccount() {
    if (!deletePassword || deleteBusy) return;

    setDeleteBusy(true);
    try {
      await api.delete("/api/v1/profile", { data: { password: deletePassword } });
      addToast("Account deleted", "success");
      clearToken();
      navigate("/signin", { replace: true });
    } catch (error) {
      addToast(getErrorMessage(error, "Failed to delete account"), "error");
      setDeleteBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-white">
      <header className="h-14 px-6 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-4 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-20">
        <Link
          to="/dashboard"
          className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-smooth"
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
              d="M19 12H5m0 0 7 7m-7-7 7-7"
            />
          </svg>
          <span>Back to dashboard</span>
        </Link>
        <ThemeToggle />
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-xl font-bold tracking-tight mb-1">Settings</h1>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mb-8">
          Manage your account, security, and appearance.
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : loadFailed ? (
          <div className={`${cardClass} text-center py-12`}>
            <p className="text-sm font-semibold text-rose-600 dark:text-rose-400 mb-1">
              Could not load your profile
            </p>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mb-5">
              Check your connection and try again.
            </p>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                setReloadKey((k) => k + 1);
              }}
              className={primaryButtonClass}
            >
              Retry
            </button>
          </div>
        ) : profile ? (
          <div className="space-y-6">
            {/* Account overview */}
            <section className={cardClass}>
              <div className="flex items-center gap-4">
                <span className="h-14 w-14 shrink-0 rounded-full bg-primary text-white text-lg font-bold flex items-center justify-center">
                  {getInitials(profile.username)}
                </span>
                <div className="min-w-0">
                  <p className="text-base font-bold truncate">
                    {profile.username}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Member since {formatMemberSince(profile.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-5">
                <span className="px-2.5 py-1 rounded-full bg-primary-light/60 dark:bg-primary/20 text-primary text-[11px] font-bold">
                  {profile.stats.contents}{" "}
                  {profile.stats.contents === 1 ? "item" : "items"}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-primary-light/60 dark:bg-primary/20 text-primary text-[11px] font-bold">
                  {profile.stats.tags} {profile.stats.tags === 1 ? "tag" : "tags"}
                </span>
              </div>
            </section>

            {/* Username */}
            <section className={cardClass}>
              <h2 className="text-sm font-bold mb-1">Profile</h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mb-4">
                Your username is shown in the sidebar and on shared pages.
              </p>
              <form onSubmit={handleUsernameSubmit} className="flex items-end gap-3">
                <div className="flex-1">
                  <label htmlFor="username" className={labelClass}>
                    Username
                  </label>
                  <input
                    id="username"
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    minLength={3}
                    maxLength={20}
                    required
                    className={inputClass}
                    placeholder="3–20 characters"
                  />
                </div>
                <button
                  type="submit"
                  disabled={
                    usernameBusy ||
                    !newUsername.trim() ||
                    newUsername.trim() === profile.username
                  }
                  className={primaryButtonClass}
                >
                  {usernameBusy ? "Saving..." : "Save"}
                </button>
              </form>
            </section>

            {/* Password */}
            <section className={cardClass}>
              <h2 className="text-sm font-bold mb-1">Password</h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mb-4">
                Use at least 6 characters. You will stay signed in on this
                device.
              </p>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label htmlFor="current-password" className={labelClass}>
                    Current password
                  </label>
                  <input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className={inputClass}
                    placeholder="••••••••"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="new-password" className={labelClass}>
                      New password
                    </label>
                    <input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      minLength={6}
                      maxLength={72}
                      required
                      autoComplete="new-password"
                      className={inputClass}
                      placeholder="At least 6 characters"
                    />
                  </div>
                  <div>
                    <label htmlFor="confirm-password" className={labelClass}>
                      Confirm new password
                    </label>
                    <input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      minLength={6}
                      maxLength={72}
                      required
                      autoComplete="new-password"
                      className={inputClass}
                      placeholder="Repeat new password"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={
                      passwordBusy ||
                      !currentPassword ||
                      !newPassword ||
                      !confirmPassword
                    }
                    className={primaryButtonClass}
                  >
                    {passwordBusy ? "Updating..." : "Update password"}
                  </button>
                </div>
              </form>
            </section>

            {/* Appearance */}
            <section className={cardClass}>
              <h2 className="text-sm font-bold mb-1">Appearance</h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mb-4">
                Choose how Second Brain looks on this device.
              </p>
              <div className="inline-flex rounded-lg border border-slate-200 dark:border-zinc-800 p-1 bg-slate-50 dark:bg-zinc-900">
                <button
                  type="button"
                  onClick={() => {
                    if (theme !== "light") toggleTheme();
                  }}
                  aria-pressed={theme === "light"}
                  className={`px-4 h-8 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-smooth cursor-pointer ${
                    theme === "light"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <circle cx="12" cy="12" r="4" strokeWidth={2} />
                    <path
                      strokeLinecap="round"
                      strokeWidth={2}
                      d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
                    />
                  </svg>
                  Light
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (theme !== "dark") toggleTheme();
                  }}
                  aria-pressed={theme === "dark"}
                  className={`px-4 h-8 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-smooth cursor-pointer ${
                    theme === "dark"
                      ? "bg-zinc-800 text-white shadow-xs"
                      : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
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
                      d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"
                    />
                  </svg>
                  Dark
                </button>
              </div>
            </section>

            {/* Danger zone */}
            <section className="rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-zinc-950 p-6">
              <h2 className="text-sm font-bold text-rose-600 dark:text-rose-400 mb-1">
                Danger zone
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mb-4">
                Permanently delete your account along with all saved items,
                tags, and share links. This cannot be undone.
              </p>

              {confirmDeleteOpen ? (
                <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/20 p-4">
                  <label htmlFor="delete-password" className={labelClass}>
                    Enter your password to confirm
                  </label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      id="delete-password"
                      type="password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      autoComplete="current-password"
                      className={`${inputClass} sm:flex-1`}
                      placeholder="Your password"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleDeleteAccount}
                        disabled={!deletePassword || deleteBusy}
                        className="h-10 px-4 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-semibold transition-smooth cursor-pointer"
                      >
                        {deleteBusy ? "Deleting..." : "Delete my account"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmDeleteOpen(false);
                          setDeletePassword("");
                        }}
                        disabled={deleteBusy}
                        className="h-10 px-4 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-zinc-800/60 transition-smooth cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDeleteOpen(true)}
                  className="h-9 px-4 rounded-lg border border-rose-300 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold transition-smooth cursor-pointer"
                >
                  Delete account
                </button>
              )}
            </section>
          </div>
        ) : null}
      </main>
    </div>
  );
}

export default Settings;

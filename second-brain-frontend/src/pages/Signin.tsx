import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api, getErrorMessage, setToken } from "../lib/api";
import { useToast } from "../hooks/useToast";
import { BrainLogo } from "../icons/BrainLogo";
import { ThemeToggle } from "../components/ui/ThemeToggle";

export function Signin() {
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  // The api client redirects here with ?expired=1 when a session token is rejected
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("expired") === "1") {
      addToast("Your session expired. Please sign in again.", "info");
      window.history.replaceState(null, "", "/signin");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signin() {
    const username = usernameRef.current?.value?.trim();
    const password = passwordRef.current?.value;

    if (!username || !password) {
      addToast("Please fill all fields", "error");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/api/v1/signin", {
        username,
        password,
      });
      setToken(response.data.token);
      addToast("Welcome back!", "success");
      navigate("/dashboard");
    } catch (e) {
      addToast(
        getErrorMessage(e, "Invalid username or password"),
        "error",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 dark:bg-black text-slate-900 dark:text-white p-4 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm bg-white dark:bg-zinc-900 p-8 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xl animate-slideUp">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-light/60 dark:bg-primary/20 text-primary mb-3">
            <BrainLogo size="lg" />
          </div>
          <h1 className="font-doto text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Welcome back
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Sign in to access your Second Brain
          </p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">
              Username
            </label>
            <input
              ref={usernameRef}
              type="text"
              placeholder="Enter your username"
              onKeyDown={(e) => e.key === "Enter" && signin()}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-smooth"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">
              Password
            </label>
            <input
              ref={passwordRef}
              type="password"
              placeholder="••••••••"
              onKeyDown={(e) => e.key === "Enter" && signin()}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-smooth"
            />
          </div>

          <button
            onClick={signin}
            disabled={loading}
            className="w-full py-2.5 mt-2 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-lg shadow-sm transition-smooth cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-500 dark:text-zinc-400">
          Don&apos;t have an account?{" "}
          <button
            onClick={() => navigate("/signup")}
            className="text-primary hover:underline font-semibold cursor-pointer"
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
}
export default Signin;

import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, getErrorMessage, setToken } from "../lib/api";
import { useToast } from "../hooks/useToast";
import { BrainLogo } from "../icons/BrainLogo";
import { ThemeToggle } from "../components/ui/ThemeToggle";

export function Signup() {
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  async function signup() {
    const username = usernameRef.current?.value?.trim();
    const password = passwordRef.current?.value;

    if (!username || !password) {
      addToast("Please fill all fields", "error");
      return;
    }

    if (username.length < 3) {
      addToast("Username must be at least 3 characters", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post<{ token: string }>("/api/v1/signup", {
        username,
        password,
      });
      setToken(res.data.token);
      addToast("Welcome to Second Brain!", "success");
      navigate("/dashboard", { replace: true });
    } catch (e) {
      addToast(
        getErrorMessage(e, "Failed to create account. Please try a different username."),
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
            Create an account
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Start organizing your digital mind today
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
              placeholder="At least 3 characters"
              onKeyDown={(e) => e.key === "Enter" && signup()}
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
              placeholder="Enter your password"
              onKeyDown={(e) => e.key === "Enter" && signup()}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-smooth"
            />
          </div>

          <button
            onClick={signup}
            disabled={loading}
            className="w-full py-2.5 mt-2 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-lg shadow-sm transition-smooth cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-500 dark:text-zinc-400">
          Already have an account?{" "}
          <button
            onClick={() => navigate("/signin")}
            className="text-primary hover:underline font-semibold cursor-pointer"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
export default Signup;

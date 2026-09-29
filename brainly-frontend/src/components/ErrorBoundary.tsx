import { Component, type ErrorInfo, type ReactNode } from "react";
import { BrainLogo } from "../icons/BrainLogo";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled UI error:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 dark:bg-black text-slate-900 dark:text-white p-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-primary-light/60 dark:bg-primary/20 text-primary flex items-center justify-center mb-4">
            <BrainLogo size="lg" />
          </div>
          <h1 className="text-lg font-bold mb-1">Something went wrong</h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mb-5">
            An unexpected error occurred while rendering this page. Reloading
            usually fixes it.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-smooth cursor-pointer"
          >
            Reload page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

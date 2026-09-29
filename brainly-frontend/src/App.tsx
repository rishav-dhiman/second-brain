import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./hooks/ToastProvider";
import { ToastContainer } from "./components/ui/ToastContainer";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { RequireAuth } from "./components/RequireAuth";
import { PageLoader } from "./components/ui/PageLoader";
import { getToken } from "./lib/api";

const Signin = lazy(() => import("./pages/Signin"));
const Signup = lazy(() => import("./pages/Signup"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Settings = lazy(() => import("./pages/Settings"));
const SharedBrain = lazy(() => import("./pages/SharedBrain"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Landing = lazy(() => import("./pages/landing/Landing"));

function RootRedirect() {
  return <Navigate to={getToken() ? "/dashboard" : "/landing"} replace />;
}

const App = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/signup" element={<Signup />} />
                <Route path="/signin" element={<Signin />} />
                <Route
                  path="/dashboard"
                  element={
                    <RequireAuth>
                      <Dashboard />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <RequireAuth>
                      <Settings />
                    </RequireAuth>
                  }
                />
                <Route path="/brain/:sharelink" element={<SharedBrain />} />
                <Route path="/landing" element={<Landing />} />
                <Route path="/landing/:variant" element={<Navigate to="/landing" replace />} />
                <Route path="/" element={<RootRedirect />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            <ToastContainer />
          </BrowserRouter>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;

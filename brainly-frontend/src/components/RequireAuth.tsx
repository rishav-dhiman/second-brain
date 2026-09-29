import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getToken } from "../lib/api";

export function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation();

  if (!getToken()) {
    return <Navigate to="/signin" replace state={{ from: location.pathname }} />;
  }

  return children;
}

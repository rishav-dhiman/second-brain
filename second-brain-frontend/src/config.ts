// Empty string means same-origin (used in Docker, where nginx proxies /api/ to the backend).
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:5000";

// Public URL of this frontend, used when building share links.
// Set VITE_APP_URL in production (e.g. https://your-app.vercel.app) so links
// never depend on whatever host served the app.
export const APP_URL: string =
  import.meta.env.VITE_APP_URL ?? window.location.origin;

export const shareUrl = (hash: string) => `${APP_URL}/brain/${hash}`;
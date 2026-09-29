import axios, { type AxiosError } from "axios";
import { BACKEND_URL } from "../config";

const TOKEN_KEY = "token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.set("Authorization", token);
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status;
    const onAuthPage = ["/signin", "/signup"].some((path) =>
      window.location.pathname.startsWith(path)
    );

    if (status === 401 && !onAuthPage && getToken()) {
      clearToken();
      window.location.assign("/signin?expired=1");
    }
    return Promise.reject(error);
  }
);

export function getHttpStatus(error: unknown): number | undefined {
  if (axios.isAxiosError(error)) {
    return error.response?.status;
  }
  return undefined;
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    if (typeof data?.message === "string" && data.message) {
      return data.message;
    }
    if (error.code === "ERR_NETWORK") {
      return "Cannot connect to the server. Please try again.";
    }
    if (error.code === "ECONNABORTED") {
      return "The request timed out. Please try again.";
    }
  }
  return fallback;
}

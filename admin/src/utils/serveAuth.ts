import { jwtDecode } from "jwt-decode";
import { deleteToken, getToken } from "./tokenHandler";

const DEFAULT_SERVE_LOGIN = "http://localhost:3000/login?mode=login";

let sessionExpiryTimer: ReturnType<typeof setTimeout> | null = null;
let sessionExpiryInterval: ReturnType<typeof setInterval> | null = null;

export function getServeLoginUrl() {
  const fromEnv = String(import.meta.env.VITE_SERVE_URL || "").trim();
  if (fromEnv) {
    const base = fromEnv.replace(/\/$/, "");
    return `${base}/login?mode=login`;
  }
  return DEFAULT_SERVE_LOGIN;
}

export function getTokenExpiryMs(token: string): number | null {
  try {
    const decoded = jwtDecode<{ exp?: number }>(token);
    if (!decoded?.exp) return null;
    return decoded.exp * 1000;
  } catch {
    return null;
  }
}

export function hasValidPosSession() {
  const token = getToken("token");
  if (!token) return false;
  const expiryMs = getTokenExpiryMs(token);
  return Boolean(expiryMs && expiryMs > Date.now());
}

export function clearSessionExpiryWatcher() {
  if (sessionExpiryTimer) {
    clearTimeout(sessionExpiryTimer);
    sessionExpiryTimer = null;
  }
  if (sessionExpiryInterval) {
    clearInterval(sessionExpiryInterval);
    sessionExpiryInterval = null;
  }
}

export function redirectToServeLogin() {
  clearSessionExpiryWatcher();
  deleteToken("token");
  if (typeof window === "undefined") return;
  window.location.replace(getServeLoginUrl());
}

/** Redirect to Serve as soon as the POS JWT expires (and on periodic checks). */
export function startSessionExpiryWatcher() {
  clearSessionExpiryWatcher();
  const token = getToken("token");
  if (!token) return;

  const expiryMs = getTokenExpiryMs(token);
  if (!expiryMs) {
    redirectToServeLogin();
    return;
  }

  const msUntilExpiry = expiryMs - Date.now();
  if (msUntilExpiry <= 0) {
    redirectToServeLogin();
    return;
  }

  sessionExpiryTimer = setTimeout(() => {
    redirectToServeLogin();
  }, msUntilExpiry);

  // Safety net in case the tab sleeps and misses the timeout.
  sessionExpiryInterval = setInterval(() => {
    if (!hasValidPosSession()) {
      redirectToServeLogin();
    }
  }, 60_000);
}

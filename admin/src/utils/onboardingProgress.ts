import { ONBOARDING_VERSION } from "@/redux/feature/onboardingSlice";

const STORAGE_KEY = "serve-onboarding-progress";

export interface OnboardingProgress {
  version: number;
  completedAt: string | null;
  skippedAt: string | null;
}

type ProgressMap = Record<string, OnboardingProgress>;

function readMap(): ProgressMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeMap(map: ProgressMap) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Private mode / quota — onboarding will simply reappear; not fatal.
  }
}

/** Stable key so each POS user only sees the welcome once on this browser. */
export function onboardingUserKey(userId: number | string | null | undefined) {
  if (userId === null || userId === undefined || userId === "") return null;
  return String(userId);
}

export function loadOnboardingProgress(
  userKey: string | null,
): OnboardingProgress | null {
  if (!userKey) return null;
  const entry = readMap()[userKey];
  if (!entry || typeof entry !== "object") return null;
  return {
    version: Number(entry.version) || 0,
    completedAt: entry.completedAt || null,
    skippedAt: entry.skippedAt || null,
  };
}

export function saveOnboardingProgress(
  userKey: string | null,
  progress: OnboardingProgress,
) {
  if (!userKey) return;
  const map = readMap();
  map[userKey] = {
    version: progress.version,
    completedAt: progress.completedAt,
    skippedAt: progress.skippedAt,
  };
  writeMap(map);
}

/** Clear completion so "Replay tour" can show the welcome again. */
export function clearOnboardingProgress(userKey: string | null) {
  if (!userKey) return;
  const map = readMap();
  delete map[userKey];
  writeMap(map);
}

/** True when this user already finished or skipped the current welcome version. */
export function hasCompletedOnboarding(userKey: string | null): boolean {
  const progress = loadOnboardingProgress(userKey);
  if (!progress) return false;
  if (progress.version !== ONBOARDING_VERSION) return false;
  return Boolean(progress.completedAt || progress.skippedAt);
}

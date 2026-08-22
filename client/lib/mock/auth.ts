import { db } from "@/lib/mock/db";
import type { User } from "@/lib/types";

const SESSION_KEY = "dayflow_session_user_id";

/** Every seeded account shares this password — there's no real credential store yet. */
export const MOCK_PASSWORD = "Password@123";

function resolveAfter<T>(value: T, delayMs = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), delayMs));
}

export function getStoredUserId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(SESSION_KEY);
}

function persistUserId(userId: string): void {
  window.localStorage.setItem(SESSION_KEY, userId);
}

export function clearSession(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(SESSION_KEY);
  }
}

export async function login(
  identifier: string,
  password: string,
): Promise<{ user: User } | { error: string }> {
  const normalized = identifier.trim().toLowerCase();
  const user = db.users.find(
    (candidate) =>
      candidate.email.toLowerCase() === normalized || candidate.loginId.toLowerCase() === normalized,
  );

  if (!user || password !== MOCK_PASSWORD) {
    return resolveAfter({ error: "Invalid Login ID/email or password." });
  }

  persistUserId(user.id);
  return resolveAfter({ user });
}

export async function completePasswordReset(userId: string): Promise<User | undefined> {
  const user = db.users.find((candidate) => candidate.id === userId);
  if (user) {
    user.mustResetPassword = false;
  }
  return resolveAfter(user);
}

import { db } from "@/lib/mock/db";
import type { User } from "@/lib/types";

const SESSION_KEY = "dayflow_session_user_id";

/** Shown as a hint on the sign-in page — matches the seed accounts' shared password in db.ts. */
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

  if (!user || db.credentials[user.id] !== password) {
    return resolveAfter({ error: "Invalid Login ID/email or password." });
  }

  persistUserId(user.id);
  return resolveAfter({ user });
}

export async function completePasswordReset(userId: string, newPassword: string): Promise<User | undefined> {
  const user = db.users.find((candidate) => candidate.id === userId);
  if (user) {
    user.mustResetPassword = false;
    db.credentials[userId] = newPassword;
  }
  return resolveAfter(user);
}

export function setCredential(userId: string, password: string): void {
  db.credentials[userId] = password;
}

/** Readable temp password for newly-created accounts — satisfies the strength validator. */
export function generateTempPassword(): string {
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `Welcome${digits}!`;
}

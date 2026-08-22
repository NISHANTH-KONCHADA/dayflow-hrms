import { db } from "@/lib/mock/db";

import type {
  AttendanceRecord,
  AttendanceStatus,
  Certification,
  EmployeePrivateInfo,
  LeaveBalance,
  LeaveRequest,
  SalaryBreakdown,
  SalaryStructure,
  Skill,
  User,
} from "@/lib/types";
import { computeSalaryBreakdown } from "@/lib/payroll";

/**
 * Fixed "today" for the mock dataset, since the fixtures are dated. Swap
 * every use of this for `new Date()` once attendance is read from the
 * real backend.
 */
export const MOCK_TODAY = "2026-08-22";

/**
 * Every function below returns a Promise, even though the data is local —
 * this keeps call sites identical to what they'll look like once they're
 * backed by `lib/api/*` fetch wrappers instead of this mock layer.
 */
function resolveAfter<T>(value: T, delayMs = 150): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), delayMs));
}

export function getUsers(): Promise<User[]> {
  return resolveAfter(db.users);
}

export function getUserById(userId: string): Promise<User | undefined> {
  return resolveAfter(db.users.find((user) => user.id === userId));
}

export function getPrivateInfo(userId: string): Promise<EmployeePrivateInfo | undefined> {
  return resolveAfter(db.privateInfo.find((info) => info.userId === userId));
}

export function getSkills(userId: string): Promise<Skill[]> {
  return resolveAfter(db.skills.filter((skill) => skill.userId === userId));
}

export function getCertifications(userId: string): Promise<Certification[]> {
  return resolveAfter(db.certifications.filter((cert) => cert.userId === userId));
}

export function getAttendanceForUser(userId: string): Promise<AttendanceRecord[]> {
  return resolveAfter(
    db.attendance.filter((record) => record.userId === userId).sort((a, b) => a.date.localeCompare(b.date)),
  );
}

export function getAttendanceForDate(date: string): Promise<AttendanceRecord[]> {
  return resolveAfter(db.attendance.filter((record) => record.date === date));
}

export async function getTodayStatus(userId: string): Promise<AttendanceStatus | null> {
  const records = await resolveAfter(
    db.attendance.filter((record) => record.userId === userId && record.date === MOCK_TODAY),
  );
  return records[0]?.status ?? null;
}

export function getLeaveBalances(userId: string): Promise<LeaveBalance[]> {
  return resolveAfter(db.leaveBalances.filter((balance) => balance.userId === userId));
}

export function getLeaveRequestsForUser(userId: string): Promise<LeaveRequest[]> {
  return resolveAfter(
    db.leaveRequests
      .filter((request) => request.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  );
}

export function getAllLeaveRequests(): Promise<LeaveRequest[]> {
  return resolveAfter([...db.leaveRequests].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
}

export function getSalaryStructure(userId: string): Promise<SalaryStructure | undefined> {
  return resolveAfter(db.payroll.find((structure) => structure.userId === userId));
}

export async function getSalaryBreakdown(userId: string): Promise<SalaryBreakdown | undefined> {
  const structure = await getSalaryStructure(userId);
  return structure ? computeSalaryBreakdown(structure) : undefined;
}

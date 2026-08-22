import usersData from "@/lib/mock/users.json";
import privateInfoData from "@/lib/mock/private-info.json";
import skillsData from "@/lib/mock/skills.json";
import certificationsData from "@/lib/mock/certifications.json";
import attendanceData from "@/lib/mock/attendance.json";
import leaveBalancesData from "@/lib/mock/leave-balances.json";
import leaveRequestsData from "@/lib/mock/leave-requests.json";
import payrollData from "@/lib/mock/payroll.json";
import sessionData from "@/lib/mock/session.json";

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

const users = usersData as User[];
const privateInfo = privateInfoData as EmployeePrivateInfo[];
const skills = skillsData as Skill[];
const certifications = certificationsData as Certification[];
const attendance = attendanceData as AttendanceRecord[];
const leaveBalances = leaveBalancesData as LeaveBalance[];
const leaveRequests = leaveRequestsData as LeaveRequest[];
const payroll = payrollData as SalaryStructure[];
const session = sessionData as { userId: string };

/**
 * Every function below returns a Promise, even though the data is local —
 * this keeps call sites identical to what they'll look like once they're
 * backed by `lib/api/*` fetch wrappers instead of this mock layer.
 */
function resolveAfter<T>(value: T, delayMs = 150): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), delayMs));
}

export function getSession(): Promise<{ userId: string }> {
  return resolveAfter(session);
}

export function getUsers(): Promise<User[]> {
  return resolveAfter(users);
}

export function getUserById(userId: string): Promise<User | undefined> {
  return resolveAfter(users.find((user) => user.id === userId));
}

export function getPrivateInfo(userId: string): Promise<EmployeePrivateInfo | undefined> {
  return resolveAfter(privateInfo.find((info) => info.userId === userId));
}

export function getSkills(userId: string): Promise<Skill[]> {
  return resolveAfter(skills.filter((skill) => skill.userId === userId));
}

export function getCertifications(userId: string): Promise<Certification[]> {
  return resolveAfter(certifications.filter((cert) => cert.userId === userId));
}

export function getAttendanceForUser(userId: string): Promise<AttendanceRecord[]> {
  return resolveAfter(
    attendance.filter((record) => record.userId === userId).sort((a, b) => a.date.localeCompare(b.date)),
  );
}

export function getAttendanceForDate(date: string): Promise<AttendanceRecord[]> {
  return resolveAfter(attendance.filter((record) => record.date === date));
}

export async function getTodayStatus(userId: string): Promise<AttendanceStatus | null> {
  const records = await resolveAfter(
    attendance.filter((record) => record.userId === userId && record.date === MOCK_TODAY),
  );
  return records[0]?.status ?? null;
}

export function getLeaveBalances(userId: string): Promise<LeaveBalance[]> {
  return resolveAfter(leaveBalances.filter((balance) => balance.userId === userId));
}

export function getLeaveRequestsForUser(userId: string): Promise<LeaveRequest[]> {
  return resolveAfter(
    leaveRequests
      .filter((request) => request.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  );
}

export function getAllLeaveRequests(): Promise<LeaveRequest[]> {
  return resolveAfter([...leaveRequests].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
}

export function getSalaryStructure(userId: string): Promise<SalaryStructure | undefined> {
  return resolveAfter(payroll.find((structure) => structure.userId === userId));
}

export async function getSalaryBreakdown(userId: string): Promise<SalaryBreakdown | undefined> {
  const structure = await getSalaryStructure(userId);
  return structure ? computeSalaryBreakdown(structure) : undefined;
}

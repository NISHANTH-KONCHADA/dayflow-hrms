import { db, generateId } from "@/lib/mock/db";
import { emitMockEvent } from "@/lib/mock/events";

import type {
  AttendanceRecord,
  AttendanceStatus,
  Certification,
  EmployeePrivateInfo,
  LeaveBalance,
  LeaveRequest,
  LeaveRequestStatus,
  LeaveType,
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

export interface ProfileBundle {
  user: User;
  privateInfo: EmployeePrivateInfo | undefined;
  skills: Skill[];
  certifications: Certification[];
}

export async function getProfileBundle(userId: string): Promise<ProfileBundle | null> {
  const [user, privateInfo, skills, certifications] = await Promise.all([
    getUserById(userId),
    getPrivateInfo(userId),
    getSkills(userId),
    getCertifications(userId),
  ]);

  if (!user) return null;
  return { user, privateInfo, skills, certifications };
}

type EditableUserFields = Partial<
  Pick<User, "phone" | "address" | "profilePictureUrl" | "about" | "interests" | "resumeUrl">
>;

export async function updateUser(userId: string, patch: EditableUserFields): Promise<User | undefined> {
  const user = db.users.find((candidate) => candidate.id === userId);
  if (user) {
    Object.assign(user, patch);
  }
  return resolveAfter(user);
}

export async function addSkill(userId: string, name: string): Promise<Skill[]> {
  db.skills.push({ id: generateId("sk"), userId, name });
  return getSkills(userId);
}

export async function removeSkill(skillId: string, userId: string): Promise<Skill[]> {
  db.skills = db.skills.filter((skill) => skill.id !== skillId);
  return getSkills(userId);
}

export async function addCertification(
  userId: string,
  input: { name: string; issuer: string; issuedDate: string },
): Promise<Certification[]> {
  db.certifications.push({ id: generateId("cert"), userId, fileUrl: null, ...input });
  return getCertifications(userId);
}

export async function removeCertification(certId: string, userId: string): Promise<Certification[]> {
  db.certifications = db.certifications.filter((certification) => certification.id !== certId);
  return getCertifications(userId);
}

export function getAttendanceForUser(userId: string): Promise<AttendanceRecord[]> {
  return resolveAfter(
    db.attendance.filter((record) => record.userId === userId).sort((a, b) => a.date.localeCompare(b.date)),
  );
}

export function getAttendanceForDate(date: string): Promise<AttendanceRecord[]> {
  return resolveAfter(db.attendance.filter((record) => record.date === date));
}

function nowTimeString(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

function hoursBetween(start: string, end: string): number {
  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);
  const minutes = endHour * 60 + endMinute - (startHour * 60 + startMinute);
  return Math.round((minutes / 60) * 100) / 100;
}

export async function checkIn(userId: string): Promise<AttendanceRecord> {
  const time = nowTimeString();
  let record = db.attendance.find((candidate) => candidate.userId === userId && candidate.date === MOCK_TODAY);

  if (!record) {
    record = {
      id: generateId("att"),
      userId,
      date: MOCK_TODAY,
      checkInTime: time,
      checkOutTime: null,
      status: "present",
      workHours: null,
      extraHours: null,
    };
    db.attendance.push(record);
  } else {
    record.checkInTime = time;
    record.checkOutTime = null;
    record.status = "present";
    record.workHours = null;
    record.extraHours = null;
  }

  emitMockEvent("attendance:update");
  return resolveAfter(record);
}

export async function checkOut(userId: string): Promise<AttendanceRecord | undefined> {
  const record = db.attendance.find((candidate) => candidate.userId === userId && candidate.date === MOCK_TODAY);

  if (record?.checkInTime) {
    const time = nowTimeString();
    record.checkOutTime = time;
    record.workHours = hoursBetween(record.checkInTime, time);
    record.extraHours = Math.round(Math.max(record.workHours - 8, 0) * 100) / 100;
  }

  emitMockEvent("attendance:update");
  return resolveAfter(record);
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

function daysBetweenInclusive(start: string, end: string): number {
  const startMs = new Date(`${start}T00:00:00Z`).getTime();
  const endMs = new Date(`${end}T00:00:00Z`).getTime();
  return Math.round((endMs - startMs) / 86_400_000) + 1;
}

export interface ApplyLeaveInput {
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  remarks: string;
  attachmentUrl: string | null;
}

export async function applyLeave(
  userId: string,
  input: ApplyLeaveInput,
): Promise<{ request: LeaveRequest } | { error: string }> {
  if (input.endDate < input.startDate) {
    return resolveAfter({ error: "End date can't be before the start date." });
  }

  const requestedDays = daysBetweenInclusive(input.startDate, input.endDate);

  if (input.leaveType !== "unpaid") {
    const balance = db.leaveBalances.find(
      (candidate) => candidate.userId === userId && candidate.leaveType === input.leaveType,
    );
    if (!balance || balance.daysAvailable < requestedDays) {
      return resolveAfter({ error: `Not enough ${input.leaveType} leave balance available.` });
    }
  }

  const request: LeaveRequest = {
    id: generateId("leave"),
    userId,
    leaveType: input.leaveType,
    startDate: input.startDate,
    endDate: input.endDate,
    remarks: input.remarks,
    attachmentUrl: input.attachmentUrl,
    status: "pending",
    reviewerComment: null,
    reviewedBy: null,
    createdAt: new Date().toISOString(),
  };

  db.leaveRequests.push(request);
  emitMockEvent("leave:update");
  return resolveAfter({ request });
}

export async function reviewLeaveRequest(
  requestId: string,
  decision: Extract<LeaveRequestStatus, "approved" | "rejected">,
  comment: string,
  reviewerId: string,
): Promise<LeaveRequest | undefined> {
  const request = db.leaveRequests.find((candidate) => candidate.id === requestId);
  if (!request) return resolveAfter(undefined);

  request.status = decision;
  request.reviewerComment = comment.trim() || null;
  request.reviewedBy = reviewerId;

  if (decision === "approved" && request.leaveType !== "unpaid") {
    const balance = db.leaveBalances.find(
      (candidate) => candidate.userId === request.userId && candidate.leaveType === request.leaveType,
    );
    if (balance) {
      const days = daysBetweenInclusive(request.startDate, request.endDate);
      balance.daysAvailable = Math.max(0, balance.daysAvailable - days);
    }
  }

  emitMockEvent("leave:update");
  return resolveAfter(request);
}

export function getSalaryStructure(userId: string): Promise<SalaryStructure | undefined> {
  return resolveAfter(db.payroll.find((structure) => structure.userId === userId));
}

export async function getSalaryBreakdown(userId: string): Promise<SalaryBreakdown | undefined> {
  const structure = await getSalaryStructure(userId);
  return structure ? computeSalaryBreakdown(structure) : undefined;
}

export async function updateSalaryStructure(
  userId: string,
  patch: Omit<SalaryStructure, "userId">,
): Promise<SalaryStructure | undefined> {
  const index = db.payroll.findIndex((structure) => structure.userId === userId);
  if (index === -1) return resolveAfter(undefined);

  db.payroll[index] = { ...patch, userId };
  emitMockEvent("payroll:update");
  return resolveAfter(db.payroll[index]);
}

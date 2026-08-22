import usersData from "@/lib/mock/users.json";
import privateInfoData from "@/lib/mock/private-info.json";
import skillsData from "@/lib/mock/skills.json";
import certificationsData from "@/lib/mock/certifications.json";
import attendanceData from "@/lib/mock/attendance.json";
import leaveBalancesData from "@/lib/mock/leave-balances.json";
import leaveRequestsData from "@/lib/mock/leave-requests.json";
import payrollData from "@/lib/mock/payroll.json";

import type {
  AttendanceRecord,
  Certification,
  EmployeePrivateInfo,
  LeaveBalance,
  LeaveRequest,
  SalaryStructure,
  Skill,
  User,
} from "@/lib/types";

export const db = {
  users: structuredClone(usersData) as unknown as User[],
  privateInfo: structuredClone(privateInfoData) as EmployeePrivateInfo[],
  skills: structuredClone(skillsData) as Skill[],
  certifications: structuredClone(certificationsData) as Certification[],
  attendance: structuredClone(attendanceData) as AttendanceRecord[],
  leaveBalances: structuredClone(leaveBalancesData) as LeaveBalance[],
  leaveRequests: structuredClone(leaveRequestsData) as LeaveRequest[],
  payroll: structuredClone(payrollData) as SalaryStructure[],
  credentials: Object.fromEntries(
    (structuredClone(usersData) as unknown as User[]).map((user) => [user.id, "Password@123"]),
  ) as Record<string, string>,
};

export function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

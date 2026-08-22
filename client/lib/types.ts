export type Role = "admin" | "employee";

export type AttendanceStatus = "present" | "absent" | "half_day" | "leave";

export type LeaveType = "paid" | "sick" | "unpaid";

export type LeaveRequestStatus = "pending" | "approved" | "rejected";

export interface User {
  id: string;
  loginId: string;
  email: string;
  role: Role;
  mustResetPassword: boolean;

  firstName: string;
  lastName: string;
  phone: string;
  personalEmail: string;
  dob: string;
  gender: string;
  maritalStatus: string;
  nationality: string;
  address: string;

  department: string;
  jobPosition: string;
  managerId: string | null;
  managerName: string | null;
  company: string;
  location: string;
  dateOfJoining: string;
  profilePictureUrl: string | null;

  about: string;
  interests: string;
}

export interface EmployeePrivateInfo {
  userId: string;
  panNo: string;
  uanNo: string;
  bankAccountNo: string;
  bankName: string;
  ifscCode: string;
}

export interface Skill {
  id: string;
  userId: string;
  name: string;
}

export interface Certification {
  id: string;
  userId: string;
  name: string;
  issuer: string;
  issuedDate: string;
  fileUrl: string | null;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  status: AttendanceStatus;
  workHours: number | null;
  extraHours: number | null;
}

export interface LeaveBalance {
  userId: string;
  leaveType: LeaveType;
  daysAvailable: number;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  remarks: string;
  attachmentUrl: string | null;
  status: LeaveRequestStatus;
  reviewerComment: string | null;
  reviewedBy: string | null;
  createdAt: string;
}

export interface SalaryStructure {
  userId: string;
  wage: number;
  basicPct: number;
  hraPct: number;
  standardAllowance: number;
  performanceBonusPct: number;
  ltaPct: number;
  pfEmployeePct: number;
  pfEmployerPct: number;
  professionalTax: number;
}

export interface SalaryBreakdown extends SalaryStructure {
  basicAmount: number;
  hraAmount: number;
  performanceBonusAmount: number;
  ltaAmount: number;
  fixedAllowanceAmount: number;
  pfEmployeeAmount: number;
  pfEmployerAmount: number;
  grossMonthly: number;
  netMonthly: number;
}

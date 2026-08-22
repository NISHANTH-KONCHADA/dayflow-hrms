export type Role = "admin" | "employee";
export type BackendRole = "ADMIN" | "HR_OFFICER" | "EMPLOYEE";

export type AttendanceStatus = "present" | "absent" | "half_day" | "leave";

export type LeaveType = "paid" | "sick" | "unpaid";

export type LeaveRequestStatus = "pending" | "approved" | "rejected";

export interface User {
  id: string;
  employeeId: string;
  loginId: string;
  employeeCode?: string;
  email: string;
  role: Role;
  rawRole?: BackendRole;
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
  departmentId?: string | null;
  jobPosition: string;
  jobPositionId?: string | null;
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
  notes?: string | null;
}

export interface LeaveBalance {
  id?: string;
  userId: string;
  leaveType: LeaveType | string;
  leaveTypeId?: string;
  leaveTypeName?: string;
  daysAvailable: number;
  allocatedDays?: number;
  usedDays?: number;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  leaveType: LeaveType | string;
  leaveTypeId?: string;
  leaveTypeName?: string;
  startDate: string;
  endDate: string;
  requestedDays?: number;
  remarks: string;
  attachmentUrl: string | null;
  attachmentName?: string | null;
  status: LeaveRequestStatus;
  reviewerComment: string | null;
  reviewedBy: string | null;
  createdAt: string;
  user?: {
    firstName: string;
    lastName: string;
    employeeCode?: string;
    department?: string;
  };
}

export interface SalaryStructure {
  userId: string;
  monthlyWage?: number;
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

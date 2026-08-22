"use client";

import { useAuth } from "@/context/AuthContext";
import EmployeeAttendanceView from "@/components/attendance/EmployeeAttendanceView";
import AdminAttendanceView from "@/components/attendance/AdminAttendanceView";

export default function AttendancePage() {
  const { user } = useAuth();

  if (!user) return null;

  return user.role === "admin" ? <AdminAttendanceView /> : <EmployeeAttendanceView />;
}

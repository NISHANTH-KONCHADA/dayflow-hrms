"use client";

import { useAuth } from "@/context/AuthContext";
import EmployeeTimeOffView from "@/components/leave/EmployeeTimeOffView";
import AdminLeaveQueue from "@/components/leave/AdminLeaveQueue";

export default function TimeOffPage() {
  const { user } = useAuth();

  if (!user) return null;

  return user.role === "admin" ? <AdminLeaveQueue /> : <EmployeeTimeOffView />;
}

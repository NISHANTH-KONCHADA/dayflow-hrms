"use client";

import { useAuth } from "@/context/AuthContext";
import EmployeeDashboard from "@/components/dashboard/EmployeeDashboard";
import AdminDashboard from "@/components/dashboard/AdminDashboard";

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) return null;

  return user.role === "admin" ? <AdminDashboard /> : <EmployeeDashboard />;
}

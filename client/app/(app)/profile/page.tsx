"use client";

import { useAuth } from "@/context/AuthContext";
import EmployeeDetailPage from "../employees/[id]/page";

export default function MyProfilePage() {
  const { user } = useAuth();

  if (!user) return null;

  const paramsPromise = Promise.resolve({ id: user.employeeId || user.id });

  return <EmployeeDetailPage params={paramsPromise} />;
}

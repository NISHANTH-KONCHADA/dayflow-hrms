"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import CreateEmployeeForm from "@/components/employees/CreateEmployeeForm";

export default function NewEmployeePage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [user, router]);

  if (!user || user.role !== "admin") return null;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-semibold text-foreground">New Employee</h1>
      <CreateEmployeeForm />
    </div>
  );
}

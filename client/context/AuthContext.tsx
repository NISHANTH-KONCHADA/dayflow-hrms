"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getMe, login as apiLogin, logout as apiLogout } from "@/lib/api/auth";
import type { User } from "@/lib/types";

type LoginResult = { user: User } | { error: string };

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function mapBackendUserToUser(data: any): User {
  const emp = data.employee || {};
  const role = data.role === "ADMIN" || data.role === "HR_OFFICER" ? "admin" : "employee";

  return {
    id: data.id,
    employeeId: emp.id || data.id,
    loginId: emp.loginId || "",
    employeeCode: emp.employeeCode || "",
    email: data.email,
    role: role,
    rawRole: data.role,
    mustResetPassword: Boolean(data.mustChangePassword),

    firstName: emp.firstName || "User",
    lastName: emp.lastName || "",
    phone: emp.phone || "",
    personalEmail: emp.personalEmail || data.email,
    dob: emp.dateOfBirth ? new Date(emp.dateOfBirth).toISOString().split("T")[0] : "",
    gender: emp.gender || "",
    maritalStatus: emp.maritalStatus || "",
    nationality: emp.nationality || "",
    address: emp.address || "",

    department: emp.department?.name || "General",
    departmentId: emp.departmentId || null,
    jobPosition: emp.jobPosition?.name || "Employee",
    jobPositionId: emp.jobPositionId || null,
    managerId: emp.managerId || null,
    managerName: emp.manager ? `${emp.manager.firstName} ${emp.manager.lastName}` : null,
    company: data.company?.name || "Dayflow Technologies",
    location: data.company?.address || "India",
    dateOfJoining: emp.dateOfJoining ? new Date(emp.dateOfJoining).toISOString().split("T")[0] : "",
    profilePictureUrl: emp.profilePictureUrl || null,

    about: emp.about || "",
    interests: emp.interestsHobbies || "",
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      try {
        const backendData = await getMe();
        if (!cancelled && backendData) {
          setUser(mapBackendUserToUser(backendData));
        }
      } catch (err) {
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  async function login(identifier: string, password: string): Promise<LoginResult> {
    try {
      const result = await apiLogin(identifier, password);
      if (result && result.user) {
        const mappedUser = mapBackendUserToUser(result.user);
        setUser(mappedUser);
        return { user: mappedUser };
      }
      return { error: "Invalid response from server" };
    } catch (err: any) {
      return { error: err.message || "Login failed" };
    }
  }

  function logout() {
    apiLogout();
    setUser(null);
    window.location.assign("/sign-in");
  }

  async function refreshUser() {
    try {
      const refreshedData = await getMe();
      if (refreshedData) {
        setUser(mapBackendUserToUser(refreshedData));
      }
    } catch (err) {
      console.error("Failed to refresh user:", err);
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

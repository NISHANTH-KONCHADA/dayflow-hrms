import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import StatusDot from "@/components/dashboard/StatusDot";
import type { AttendanceStatus, User } from "@/lib/types";

interface EmployeeCardProps {
  user: User;
  status: AttendanceStatus | null;
}

export default function EmployeeCard({ user, status }: EmployeeCardProps) {
  return (
    <Link
      href={`/employees/${user.id}`}
      className="flex flex-col items-center gap-2 rounded-lg border border-border bg-surface p-4 text-center transition-shadow hover:shadow-md"
    >
      <div className="relative">
        <Avatar
          firstName={user.firstName}
          lastName={user.lastName}
          profilePictureUrl={user.profilePictureUrl}
          size="lg"
        />
        <span className="absolute -right-1 -top-1">
          <StatusDot status={status} />
        </span>
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">
          {user.firstName} {user.lastName}
        </p>
        <p className="text-xs text-muted">{user.jobPosition}</p>
      </div>
    </Link>
  );
}

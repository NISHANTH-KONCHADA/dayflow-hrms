import Field from "@/components/ui/Field";
import type { User } from "@/lib/types";

export default function MyProfileTab({ user }: { user: User }) {
  return (
    <div className="flex flex-col gap-6 rounded-lg border border-border bg-surface p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Name" value={`${user.firstName} ${user.lastName}`} />
        <Field label="Mobile" value={user.phone} />
        <Field label="Email" value={user.email} />
        <Field label="Department" value={user.department} />
        <Field label="Job Position" value={user.jobPosition} />
        <Field label="Manager" value={user.managerName} />
        <Field label="Company" value={user.company} />
        <Field label="Location" value={user.location} />
        <Field label="Since" value={user.dateOfJoining} />
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-muted">About</span>
        <p className="text-sm text-foreground">{user.about || "—"}</p>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-muted">Interests &amp; Hobbies</span>
        <p className="text-sm text-foreground">{user.interests || "—"}</p>
      </div>
    </div>
  );
}

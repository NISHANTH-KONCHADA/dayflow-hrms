import Field from "@/components/ui/Field";
import type { EmployeePrivateInfo, User } from "@/lib/types";

interface PrivateInfoTabProps {
  user: User;
  privateInfo: EmployeePrivateInfo | undefined;
}

export default function PrivateInfoTab({ user, privateInfo }: PrivateInfoTabProps) {
  return (
    <div className="flex flex-col gap-6 rounded-lg border border-border bg-surface p-6">
      <div>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Personal Details</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Date of Birth" value={user.dob} />
          <Field label="Personal Email" value={user.personalEmail} />
          <Field label="Gender" value={user.gender} />
          <Field label="Marital Status" value={user.maritalStatus} />
          <Field label="Nationality" value={user.nationality} />
          <Field label="Residing Address" value={user.address} />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Identification</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Emp Code" value={user.loginId} />
          <Field label="PAN No" value={privateInfo?.panNo} />
          <Field label="UAN No" value={privateInfo?.uanNo} />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Bank Details</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Account Number" value={privateInfo?.bankAccountNo} />
          <Field label="Bank Name" value={privateInfo?.bankName} />
          <Field label="IFSC Code" value={privateInfo?.ifscCode} />
        </div>
      </div>
    </div>
  );
}

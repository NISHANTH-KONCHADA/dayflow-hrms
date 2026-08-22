import type { Certification } from "@/lib/types";

export default function CertificationsTab({ certifications }: { certifications: Certification[] }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      {certifications.length === 0 ? (
        <p className="text-sm text-muted">No certifications added yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {certifications.map((certification) => (
            <li key={certification.id} className="flex flex-col">
              <span className="text-sm font-medium text-foreground">{certification.name}</span>
              <span className="text-xs text-muted">
                {certification.issuer} · {certification.issuedDate}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

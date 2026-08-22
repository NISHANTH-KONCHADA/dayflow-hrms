"use client";

import { useState } from "react";
import TextField from "@/components/ui/TextField";
import Button from "@/components/ui/Button";
import { addCertification, removeCertification } from "@/lib/mock";
import type { Certification } from "@/lib/types";

interface CertificationsTabProps {
  userId: string;
  certifications: Certification[];
  editable: boolean;
  onChanged: (certifications: Certification[]) => void;
}

export default function CertificationsTab({
  userId,
  certifications,
  editable,
  onChanged,
}: CertificationsTabProps) {
  const [name, setName] = useState("");
  const [issuer, setIssuer] = useState("");
  const [issuedDate, setIssuedDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd() {
    if (!name.trim() || !issuer.trim() || !issuedDate) {
      setError("Fill in name, issuer, and issued date.");
      return;
    }
    setError(null);
    setSaving(true);
    const updated = await addCertification(userId, {
      name: name.trim(),
      issuer: issuer.trim(),
      issuedDate,
    });
    setSaving(false);
    setName("");
    setIssuer("");
    setIssuedDate("");
    onChanged(updated);
  }

  async function handleRemove(certId: string) {
    const updated = await removeCertification(certId, userId);
    onChanged(updated);
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-6">
      {certifications.length === 0 ? (
        <p className="text-sm text-muted">No certifications added yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {certifications.map((certification) => (
            <li key={certification.id} className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">{certification.name}</span>
                <span className="text-xs text-muted">
                  {certification.issuer} · {certification.issuedDate}
                </span>
              </div>
              {editable && (
                <button
                  type="button"
                  onClick={() => handleRemove(certification.id)}
                  className="text-xs text-status-danger hover:underline"
                >
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {editable && (
        <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-end">
          <TextField label="Name" name="certName" value={name} onChange={(event) => setName(event.target.value)} />
          <TextField
            label="Issuer"
            name="certIssuer"
            value={issuer}
            onChange={(event) => setIssuer(event.target.value)}
          />
          <TextField
            label="Issued Date"
            name="certDate"
            type="date"
            value={issuedDate}
            onChange={(event) => setIssuedDate(event.target.value)}
          />
          <Button variant="secondary" onClick={handleAdd} loading={saving}>
            + Add
          </Button>
        </div>
      )}
      {error && <p className="text-sm text-status-danger">{error}</p>}
    </div>
  );
}

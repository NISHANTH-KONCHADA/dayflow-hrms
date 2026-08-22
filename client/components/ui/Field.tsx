interface FieldProps {
  label: string;
  value: string | null | undefined;
}

export default function Field({ label, value }: FieldProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-muted">{label}</span>
      <span className="text-sm text-foreground">{value?.trim() ? value : "—"}</span>
    </div>
  );
}

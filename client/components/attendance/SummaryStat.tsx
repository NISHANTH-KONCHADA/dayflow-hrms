interface SummaryStatProps {
  label: string;
  value: number;
}

export default function SummaryStat({ label, value }: SummaryStatProps) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4 text-center">
      <p className="text-2xl font-semibold text-foreground">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}

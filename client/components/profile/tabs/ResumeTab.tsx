import type { User } from "@/lib/types";

export default function ResumeTab({ user }: { user: User }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      {user.resumeUrl ? (
        <a
          href={user.resumeUrl}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-primary hover:underline"
        >
          View uploaded resume
        </a>
      ) : (
        <p className="text-sm text-muted">No resume uploaded yet.</p>
      )}
    </div>
  );
}

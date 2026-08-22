import type { Skill } from "@/lib/types";

export default function SkillsTab({ skills }: { skills: Skill[] }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      {skills.length === 0 ? (
        <p className="text-sm text-muted">No skills added yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <span
              key={skill.id}
              className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
            >
              {skill.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, type KeyboardEvent } from "react";
import TextField from "@/components/ui/TextField";
import Button from "@/components/ui/Button";
import { addSkill, removeSkill } from "@/lib/mock";
import type { Skill } from "@/lib/types";

interface SkillsTabProps {
  userId: string;
  skills: Skill[];
  editable: boolean;
  onChanged: (skills: Skill[]) => void;
}

export default function SkillsTab({ userId, skills, editable, onChanged }: SkillsTabProps) {
  const [newSkill, setNewSkill] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    const name = newSkill.trim();
    if (!name) return;
    setSaving(true);
    const updated = await addSkill(userId, name);
    setSaving(false);
    setNewSkill("");
    onChanged(updated);
  }

  async function handleRemove(skillId: string) {
    const updated = await removeSkill(skillId, userId);
    onChanged(updated);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      handleAdd();
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-6">
      {skills.length === 0 ? (
        <p className="text-sm text-muted">No skills added yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <span
              key={skill.id}
              className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
            >
              {skill.name}
              {editable && (
                <button
                  type="button"
                  onClick={() => handleRemove(skill.id)}
                  aria-label={`Remove ${skill.name}`}
                  className="text-primary/70 hover:text-primary"
                >
                  ×
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {editable && (
        <div className="flex items-end gap-2">
          <TextField
            label="Add Skill"
            name="newSkill"
            value={newSkill}
            onChange={(event) => setNewSkill(event.target.value)}
            onKeyDown={handleKeyDown}
            className="max-w-xs"
          />
          <Button variant="secondary" onClick={handleAdd} loading={saving}>
            + Add Skill
          </Button>
        </div>
      )}
    </div>
  );
}

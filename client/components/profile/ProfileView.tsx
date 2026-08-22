"use client";

import { useEffect, useState } from "react";
import Avatar from "@/components/ui/Avatar";
import ProfileTabs, { type ProfileTabId } from "@/components/profile/ProfileTabs";
import MyProfileTab from "@/components/profile/tabs/MyProfileTab";
import PrivateInfoTab from "@/components/profile/tabs/PrivateInfoTab";
import ResumeTab from "@/components/profile/tabs/ResumeTab";
import SkillsTab from "@/components/profile/tabs/SkillsTab";
import CertificationsTab from "@/components/profile/tabs/CertificationsTab";
import SalaryInfoTab from "@/components/profile/tabs/SalaryInfoTab";
import { getProfileBundle, type ProfileBundle } from "@/lib/mock";
import { useAuth } from "@/context/AuthContext";
import type { Certification, Skill, User } from "@/lib/types";

interface ProfileViewProps {
  userId: string;
  /** Own profile (reached via the avatar menu) is editable; grid click-throughs never are. */
  editable: boolean;
}

export default function ProfileView({ userId, editable }: ProfileViewProps) {
  const { user: viewer, refreshUser } = useAuth();
  const [bundle, setBundle] = useState<ProfileBundle | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTabId>("profile");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setActiveTab("profile");

    getProfileBundle(userId).then((data) => {
      if (!cancelled) {
        setBundle(data);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  function handleUserUpdated(updatedUser: User) {
    setBundle((prev) => (prev ? { ...prev, user: updatedUser } : prev));
    if (viewer?.id === updatedUser.id) {
      refreshUser();
    }
  }

  function handleSkillsChanged(skills: Skill[]) {
    setBundle((prev) => (prev ? { ...prev, skills } : prev));
  }

  function handleCertificationsChanged(certifications: Certification[]) {
    setBundle((prev) => (prev ? { ...prev, certifications } : prev));
  }

  if (loading) {
    return <p className="text-sm text-muted">Loading profile…</p>;
  }

  if (!bundle) {
    return <p className="text-sm text-muted">Employee not found.</p>;
  }

  const { user, privateInfo, skills, certifications } = bundle;
  const showSalaryTab = viewer?.role === "admin";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4 rounded-lg border border-border bg-surface p-6">
        <Avatar
          firstName={user.firstName}
          lastName={user.lastName}
          profilePictureUrl={user.profilePictureUrl}
          size="lg"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-foreground">
              {user.firstName} {user.lastName}
            </h1>
            {!editable && (
              <span className="rounded-full bg-background px-2 py-0.5 text-xs text-muted">View only</span>
            )}
          </div>
          <p className="text-sm text-muted">
            {user.jobPosition} · {user.department}
          </p>
          <p className="text-xs text-muted">{user.loginId}</p>
        </div>
      </div>

      <ProfileTabs active={activeTab} onChange={setActiveTab} showSalaryTab={showSalaryTab} />

      {activeTab === "profile" && (
        <MyProfileTab user={user} editable={editable} onUpdated={handleUserUpdated} />
      )}
      {activeTab === "private" && (
        <PrivateInfoTab user={user} privateInfo={privateInfo} editable={editable} onUpdated={handleUserUpdated} />
      )}
      {activeTab === "resume" && <ResumeTab user={user} editable={editable} onUpdated={handleUserUpdated} />}
      {activeTab === "skills" && (
        <SkillsTab userId={user.id} skills={skills} editable={editable} onChanged={handleSkillsChanged} />
      )}
      {activeTab === "certifications" && (
        <CertificationsTab
          userId={user.id}
          certifications={certifications}
          editable={editable}
          onChanged={handleCertificationsChanged}
        />
      )}
      {activeTab === "salary" && showSalaryTab && <SalaryInfoTab />}
    </div>
  );
}

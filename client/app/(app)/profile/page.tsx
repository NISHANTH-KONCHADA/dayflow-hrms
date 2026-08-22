"use client";

import { useAuth } from "@/context/AuthContext";
import ProfileView from "@/components/profile/ProfileView";

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) return null;

  return <ProfileView userId={user.id} editable />;
}

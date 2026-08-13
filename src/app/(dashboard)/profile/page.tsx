import type { Metadata } from "next";

import { ProfileForm } from "@/components/profile/profile-form";

export const metadata: Metadata = {
  title: "Profile",
  description: "Edit your profile information.",
};

export default function ProfilePage() {
  return <ProfileForm />;
}

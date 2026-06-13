import type { Metadata } from "next";

import SettingsClient from "@/features/SettingsClient";

export const metadata: Metadata = {
  title: "Settings - Staredesk",
};

export default function LoginPage() {
  return <SettingsClient />;
}

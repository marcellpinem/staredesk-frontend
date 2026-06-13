import type { Metadata } from "next";

import LoginClient from "@/features/LoginClient";

export const metadata: Metadata = {
  title: "Login - Staredesk",
};

export default function LoginPage() {
  return <LoginClient />;
}

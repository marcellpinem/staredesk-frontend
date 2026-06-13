import type { Metadata } from "next";

import AnalyticsClient from "@/features/AnalyticsClient";

export const metadata: Metadata = {
  title: "Analytics - Staredesk",
};

export default function LoginPage() {
  return <AnalyticsClient />;
}

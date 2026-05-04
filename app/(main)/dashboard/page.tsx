"use client";

import DeviceStatusBar from "@/components/ui/dashboard/DeviceStatusBar";
import LiveConditionCard from "@/components/ui/dashboard/LiveConditionCard";
import SensorReadings from "@/components/ui/dashboard/SensorReadings";
import SessionTimer from "@/components/ui/dashboard/SessionTimer";
import TodaySummaryCard from "@/components/ui/dashboard/TodaySummaryCard";

export default function DashboardPage() {
  return (
    <div className="p-5 flex flex-col xl:flex-row items-center md:items-start gap-3">
      {/* LEFT CONTENT */}
      <div className="flex flex-col gap-3 w-full h-full max-w-100">
        <DeviceStatusBar />

        <LiveConditionCard />

        <SessionTimer />

        <TodaySummaryCard />
      </div>

      {/* RIGHT CONTENT */}
      <SensorReadings />
    </div>
  );
}

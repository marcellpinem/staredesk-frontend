"use client";

import ConditionBreakdown from "@/components/ui/analytics/ConditionBreakdown";
import FocusSummaryCard from "@/components/ui/analytics/FocusSummaryCard";
import PeakHoursCard from "@/components/ui/analytics/PeakHoursCard";
import SessionHistoryTable from "@/components/ui/analytics/SessionHistoryTable";
import { SessionTimeline } from "@/components/ui/analytics/TimelineChart";
import { useState } from "react";
import "react-datepicker/dist/react-datepicker.css";

type Mode = "DAILY" | "WEEKLY" | "MONTHLY";
type AnalyticsRange = "today" | "week" | "month";

const modeToRange: Record<Mode, AnalyticsRange> = {
  DAILY: "today",
  WEEKLY: "week",
  MONTHLY: "month",
};

export default function AnalyticsClient() {
  const [mode, setMode] = useState<Mode>("DAILY");

  const analyticsRange = modeToRange[mode];

  const tabClass = (m: Mode) =>
    `flex-1 text-center py-2 px-2.5 text-xs font-bold tracking-tight border-r last:border-r-0 transition-all duration-200 ease-in-out cursor-pointer ${
      mode === m ? "bg-[#fdb834]" : "hover:bg-[#fdb834]"
    }`;

  return (
    <div className="p-5">
      <div className="flex flex-col gap-3 w-full items-center md:items-start">
        <div className="w-full max-w-100">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-wide">
            Analytics
          </h1>
          <p className="text-sm md:text-md text-black/55 font-semibold mt-1">
            System monitoring and ergonomic analysis
          </p>
        </div>

        <div className="w-full max-w-100 flex flex-col gap-3">
          <div className="border bg-white flex max-w-80 cursor-pointer rounded-xs">
            {(["DAILY", "WEEKLY", "MONTHLY"] as Mode[]).map((m) => (
              <div key={m} className={tabClass(m)} onClick={() => setMode(m)}>
                {m}
              </div>
            ))}
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex flex-col xl:flex-row w-full gap-3 items-center md:items-start">
          {/* LEFT CONTENT */}
          <div className="w-full max-w-100 flex flex-col gap-3">
            <FocusSummaryCard range={analyticsRange} />

            <PeakHoursCard range={analyticsRange} />

            <ConditionBreakdown range={analyticsRange} />
          </div>

          {/* RIGHT CONTENT */}
          <div className="w-full max-w-100 flex flex-col gap-3">
            <SessionHistoryTable range={analyticsRange} />

            {mode === "DAILY" ? <SessionTimeline /> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import ConditionBreakdown from "@/components/ui/analytics/ConditionBreakdown";
import FocusSummaryCard from "@/components/ui/analytics/FocusSummaryCard";
import PeakHoursCard from "@/components/ui/analytics/PeakHoursCard";
import SessionHistoryTable from "@/components/ui/analytics/SessionHistoryTable";
import { Calendar } from "lucide-react";
import { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

type Mode = "DAILY" | "WEEKLY" | "MONTHLY";

export default function AnalyticsPage() {
  const [mode, setMode] = useState<Mode>("DAILY");
  const [singleDate, setSingleDate] = useState<Date | null>(null);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    null,
    null,
  ]);
  const [startDate, endDate] = dateRange;

  const tabClass = (m: Mode) =>
    `flex-1 text-center py-2 px-2.5 text-xs font-bold tracking-tight border-r last:border-r-0 transition-all duration-200 ease-in-out cursor-pointer ${
      mode === m ? "bg-[#fdb834]" : "hover:bg-[#fdb834]"
    }`;

  return (
    <div className="border p-5">
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

          <div className="relative max-w-80">
            {mode === "DAILY" ? (
              <DatePicker
                selected={singleDate}
                onChange={(d: Date | null) => setSingleDate(d)}
                dateFormat="d MMM yyyy"
                placeholderText="Pilih tanggal"
                wrapperClassName="w-full"
                className="border w-full inline rounded-xs pr-2.5 py-2.5 pl-9 font-bold tracking-tight focus:outline-none text-base bg-white"
              />
            ) : (
              <DatePicker
                selectsRange
                startDate={startDate}
                endDate={endDate}
                onChange={(dates) => setDateRange(dates)}
                dateFormat="d MMM yyyy"
                placeholderText="Pilih rentang tanggal"
                wrapperClassName="w-full"
                className="border w-full rounded-xs pr-2.5 py-2.5 pl-9 font-bold tracking-tight focus:outline-none text-base bg-white"
              />
            )}

            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black pointer-events-none" />
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex flex-col xl:flex-row w-full gap-3 items-center md:items-start">
          {/* LEFT CONTENT */}
          <div className="w-full max-w-100 flex flex-col gap-3">
            <FocusSummaryCard
              totalOptimalFocusTime="10h 40m"
              vsLastPeriod="+37% (45m)"
              totalSessions={27}
            />

            <PeakHoursCard
              topPeakHour={{ time: "10:00", duration: "1h 45m" }}
              peakHours={[
                { time: "10:00", duration: "1h 45m" },
                { time: "14:00", duration: "1h 20m" },
                { time: "12:00", duration: "1h 58m" },
              ]}
              period="This Week"
            />

            <ConditionBreakdown />
          </div>
          {/* RIGHT CONTENT */}
          <div className="border w-full max-w-100">
            <SessionHistoryTable />
          </div>
        </div>
      </div>
    </div>
  );
}

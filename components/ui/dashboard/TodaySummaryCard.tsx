"use client";

import Image from "next/image";
import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { useDevice } from "@/context/DeviceContext";

// ── Types ────────────────────────────────────────────────────────────────────

interface SessionSummaryItem {
  ID: string;
  UserID: string;
  StartedAt: string;
  EndedAt: string;
  DurationSec: number;
  DominantCondition: string;
}

interface SessionSummaryResponse {
  range: string;
  total_sec: number;
  session_count: number;
  sessions: SessionSummaryItem[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatTotalFocus(totalSec: number): string {
  if (totalSec <= 0) return "0m";
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  if (h > 0 && m > 0) return `${h}j ${m}m`;
  if (h > 0) return `${h}j`;
  return `${m}m`;
}

function derivePeakHour(sessions: SessionSummaryItem[]): string | null {
  if (!sessions || sessions.length === 0) return null;

  const hourCount: Record<number, number> = {};
  for (const session of sessions) {
    const utcDate = new Date(session.StartedAt);
    const wibHour = (utcDate.getUTCHours() + 7) % 24;
    hourCount[wibHour] = (hourCount[wibHour] ?? 0) + 1;
  }

  let peakHour = -1;
  let maxCount = 0;
  for (const [hourStr, count] of Object.entries(hourCount)) {
    if (count > maxCount) {
      maxCount = count;
      peakHour = Number(hourStr);
    }
  }

  if (peakHour === -1) return null;
  return `${String(peakHour).padStart(2, "0")}.00 WIB`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function TodaySummaryCard() {
  const { ws } = useDevice();

  const [totalFocusTime, setTotalFocusTime] = useState<string>("--");
  const [peakProductivityHour, setPeakProductivityHour] =
    useState<string>("--");
  const [isLoading, setIsLoading] = useState(true);

  const fetchSummary = useCallback(() => {
    apiFetch<SessionSummaryResponse>("/sessions/summary?range=today")
      .then((data) => {
        setTotalFocusTime(formatTotalFocus(data.total_sec));
        setPeakProductivityHour(derivePeakHour(data.sessions) ?? "--");
      })
      .catch(() => {
        setTotalFocusTime("--");
        setPeakProductivityHour("--");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    setTimeout(fetchSummary, 0);
  }, [fetchSummary]);

  const isActive = ws.session?.is_active ?? false;
  useEffect(() => {
    if (!isActive && !isLoading) {
      setTimeout(fetchSummary, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  return (
    <div className="border-2 bg-white rounded-xs flex flex-col w-full">
      <p className="px-4 py-2 border-b-2 text-md font-bold bg-[#eeeeee] tracking-wide">
        TODAY&apos;S SUMMARY
      </p>

      <div className="p-5 flex flex-col gap-2 border-b-2 relative">
        <Image
          src="/study-table.png"
          alt="study-table"
          height={100}
          width={100}
          loading="eager"
          className="absolute right-0 bottom-0 h-20 w-auto"
        />
        <p className="text-xs font-bold">TOTAL FOCUS TIME</p>
        <p
          className={`font-extrabold text-4xl tracking-tight ${isLoading ? "opacity-40" : ""}`}
        >
          {totalFocusTime}
        </p>
      </div>

      <div className="p-5 flex flex-col gap-2 relative">
        <Image
          src="/hour-head.png"
          alt="hour-head"
          width={100}
          height={100}
          loading="eager"
          className="absolute right-0 bottom-0 h-20 w-auto"
        />
        <p className="text-xs font-bold">PEAK PRODUCTIVITY HOUR</p>
        <p
          className={`font-extrabold text-4xl tracking-tight ${isLoading ? "opacity-40" : ""}`}
        >
          {peakProductivityHour}
        </p>
      </div>
    </div>
  );
}

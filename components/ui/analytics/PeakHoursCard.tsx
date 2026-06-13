"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import { apiFetch } from "@/lib/api";

type AnalyticsRange = "today" | "week" | "month";

type ApiPeakHourEntry = {
  Hour?: number;
  hour?: number;
  TotalSec?: number;
  total_sec?: number;
  SessionCount?: number;
  session_count?: number;
};

type PeakHoursResponse = {
  range?: "week" | "month";
  entries?: ApiPeakHourEntry[];
  Entries?: ApiPeakHourEntry[];
};

type PeakHour = {
  time: string;
  duration: string;
};

interface Props {
  range: AnalyticsRange;
}

const WIB_OFFSET_HOURS = 7;

function normalizeEntry(entry: ApiPeakHourEntry): {
  hour: number;
  totalSec: number;
  sessionCount: number;
} {
  return {
    hour: entry.Hour ?? entry.hour ?? 0,
    totalSec: entry.TotalSec ?? entry.total_sec ?? 0,
    sessionCount: entry.SessionCount ?? entry.session_count ?? 0,
  };
}

function formatHourWib(hour: number): string {
  if (!Number.isFinite(hour)) {
    return "--:--";
  }

  const normalizedHour = ((Math.trunc(hour) % 24) + 24) % 24;
  const wibHour = (normalizedHour + WIB_OFFSET_HOURS) % 24;

  return `${String(wibHour).padStart(2, "0")}:00`;
}

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "00:00:00";
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  return [hours, minutes, remainingSeconds]
    .map((unit) => String(unit).padStart(2, "0"))
    .join(":");
}

function getPeriodLabel(range: AnalyticsRange): string {
  if (range === "week") return "This Week";
  if (range === "month") return "This Month";
  return "Daily";
}

export default function PeakHoursCard({ range }: Props) {
  const [peakHours, setPeakHours] = useState<PeakHour[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isSupportedRange = range === "week" || range === "month";

  const topPeakHour = useMemo<PeakHour>(() => {
    if (!isSupportedRange) {
      return { time: "—", duration: "—" };
    }

    return peakHours[0] ?? { time: "—", duration: "—" };
  }, [isSupportedRange, peakHours]);

  useEffect(() => {
    if (!isSupportedRange) {
      return;
    }

    const controller = new AbortController();
    let isActive = true;

    async function fetchPeakHours() {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const data = await apiFetch<PeakHoursResponse>(
          `/analytics/peak-hours?range=${range}`,
          {
            signal: controller.signal,
          },
        );

        if (!isActive) return;

        const rawEntries = data.entries ?? data.Entries ?? [];

        const mappedPeakHours = rawEntries
          .map(normalizeEntry)
          .slice(0, 3)
          .map((entry) => ({
            time: formatHourWib(entry.hour),
            duration: formatDuration(entry.totalSec),
          }));

        setPeakHours(mappedPeakHours);
      } catch (error) {
        if (!isActive) return;

        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setPeakHours([]);
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to load peak hours.",
        );
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void fetchPeakHours();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [range, isSupportedRange]);

  return (
    <div className="relative bg-black text-white rounded-xs px-5 py-3 flex flex-col gap-3">
      <h1 className="text-[#FDB833] font-bold">Peak Hours</h1>

      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <p className="font-bold text-5xl leading-none tracking-tight">
            {!isSupportedRange ? "—" : isLoading ? "..." : topPeakHour.time}
          </p>
          <p className="text-sm font-semibold text-white/65">
            {isSupportedRange
              ? `${topPeakHour.duration} Focus Time`
              : "Weekly / Monthly only"}
          </p>
        </div>

        <Image
          src="/peak.png"
          alt="peak"
          width={100}
          height={100}
          loading="eager"
          className="h-22 w-auto"
        />
      </div>

      <div className="border-t flex justify-between pt-5">
        <div className="flex flex-col gap-2">
          <h1 className="text-[#FDB833] font-bold text-[13px] leading-none">
            Top 3 Peak Hours (WIB)
          </h1>

          <div className="text-sm font-semibold tracking-wide">
            {!isSupportedRange ? (
              <p>Switch to Weekly or Monthly</p>
            ) : isLoading ? (
              <p>Loading...</p>
            ) : errorMessage ? (
              <p>{errorMessage}</p>
            ) : peakHours.length === 0 ? (
              <p>No peak hours yet</p>
            ) : (
              peakHours.map((item) => (
                <p key={item.time}>
                  {item.time} - {item.duration}
                </p>
              ))
            )}
          </div>
        </div>

        <div className="flex items-end">
          <h1 className="text-[#FDB833] font-bold text-md">
            {getPeriodLabel(range)}
          </h1>
        </div>
      </div>
    </div>
  );
}

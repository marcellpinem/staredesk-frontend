"use client";

import { TrendingUp } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import { apiFetch } from "@/lib/api";

type AnalyticsRange = "today" | "week" | "month";

type ApiSession = {
  id?: string;
  ID?: string;
  ended_at?: string | null;
  EndedAt?: string | null;
  duration_sec?: number;
  DurationSec?: number;
  dominant_condition?: string;
  DominantCondition?: string;
};

type SessionsResponse = {
  sessions?: ApiSession[];
  Sessions?: ApiSession[];
  total?: number;
  Total?: number;
};

type SessionRow = {
  endedAt: string | null;
  durationSec: number;
  dominantCondition: string;
};

type FocusSummaryCardProps = {
  range: AnalyticsRange;
};

type PeriodBounds = {
  currentStartMs: number;
  currentEndMs: number;
  previousStartMs: number;
  previousEndMs: number;
};

const API_PAGE_LIMIT = 100;
const MAX_FETCH_PAGES = 50;
const DAY_MS = 24 * 60 * 60 * 1000;

function normalizeSession(session: ApiSession): SessionRow {
  return {
    endedAt: session.ended_at ?? session.EndedAt ?? null,
    durationSec: session.duration_sec ?? session.DurationSec ?? 0,
    dominantCondition:
      session.dominant_condition ?? session.DominantCondition ?? "",
  };
}

function getJakartaDateParts(date: Date): {
  year: number;
  month: number;
  day: number;
} | null {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);

  if (!year || !month || !day) {
    return null;
  }

  return { year, month, day };
}

function getStartOfTodayJakartaMs(): number {
  const parts = getJakartaDateParts(new Date());

  if (!parts) {
    return Date.now();
  }

  return Date.UTC(parts.year, parts.month - 1, parts.day, -7, 0, 0, 0);
}

function getPeriodBounds(range: AnalyticsRange): PeriodBounds {
  const nowMs = Date.now();

  if (range === "today") {
    const todayStartMs = getStartOfTodayJakartaMs();
    const yesterdayStartMs = todayStartMs - DAY_MS;

    return {
      currentStartMs: todayStartMs,
      currentEndMs: nowMs,
      previousStartMs: yesterdayStartMs,
      previousEndMs: todayStartMs,
    };
  }

  if (range === "week") {
    const currentStartMs = nowMs - 7 * DAY_MS;
    const previousStartMs = nowMs - 14 * DAY_MS;

    return {
      currentStartMs,
      currentEndMs: nowMs,
      previousStartMs,
      previousEndMs: currentStartMs,
    };
  }

  const currentStartMs = nowMs - 30 * DAY_MS;
  const previousStartMs = nowMs - 60 * DAY_MS;

  return {
    currentStartMs,
    currentEndMs: nowMs,
    previousStartMs,
    previousEndMs: currentStartMs,
  };
}

function isSessionWithinBounds(
  session: SessionRow,
  startMs: number,
  endMs: number,
): boolean {
  if (!session.endedAt) {
    return false;
  }

  const endedAtMs = new Date(session.endedAt).getTime();

  if (Number.isNaN(endedAtMs)) {
    return false;
  }

  return endedAtMs >= startMs && endedAtMs < endMs;
}

function isOptimalSession(session: SessionRow): boolean {
  return session.dominantCondition.toLowerCase() === "optimal";
}

function sumOptimalDuration(sessions: SessionRow[]): number {
  return sessions.reduce((total, session) => {
    if (!isOptimalSession(session)) {
      return total;
    }

    return total + session.durationSec;
  }, 0);
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

function formatVsLastPeriod(currentSec: number, previousSec: number): string {
  const diffSec = currentSec - previousSec;
  const sign = diffSec >= 0 ? "+" : "-";
  const absDiff = Math.abs(diffSec);

  if (previousSec <= 0) {
    if (currentSec <= 0) {
      return "0% (00:00:00)";
    }

    return `New (+${formatDuration(currentSec)})`;
  }

  const percentage = Math.round((diffSec / previousSec) * 100);

  return `${sign}${Math.abs(percentage)}% (${sign}${formatDuration(absDiff)})`;
}

async function fetchAllSessions(signal: AbortSignal): Promise<SessionRow[]> {
  const allSessions: ApiSession[] = [];
  let offset = 0;
  let total: number | null = null;

  for (let page = 0; page < MAX_FETCH_PAGES; page += 1) {
    const params = new URLSearchParams({
      limit: String(API_PAGE_LIMIT),
      offset: String(offset),
    });

    const data = await apiFetch<SessionsResponse>(`/sessions?${params}`, {
      signal,
    });

    const batch = data.sessions ?? data.Sessions ?? [];

    allSessions.push(...batch);

    total = data.total ?? data.Total ?? total;

    if (batch.length === 0) {
      break;
    }

    if (total !== null && allSessions.length >= total) {
      break;
    }

    if (batch.length < API_PAGE_LIMIT) {
      break;
    }

    offset += API_PAGE_LIMIT;
  }

  return allSessions.map(normalizeSession);
}

export default function FocusSummaryCard({ range }: FocusSummaryCardProps) {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const summary = useMemo(() => {
    const bounds = getPeriodBounds(range);

    const currentSessions = sessions.filter((session) =>
      isSessionWithinBounds(
        session,
        bounds.currentStartMs,
        bounds.currentEndMs,
      ),
    );

    const previousSessions = sessions.filter((session) =>
      isSessionWithinBounds(
        session,
        bounds.previousStartMs,
        bounds.previousEndMs,
      ),
    );

    const currentOptimalSec = sumOptimalDuration(currentSessions);
    const previousOptimalSec = sumOptimalDuration(previousSessions);

    return {
      totalOptimalFocusTime: formatDuration(currentOptimalSec),
      vsLastPeriod: formatVsLastPeriod(currentOptimalSec, previousOptimalSec),
      totalSessions: currentSessions.length,
    };
  }, [sessions, range]);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    async function loadSessions() {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const rows = await fetchAllSessions(controller.signal);

        if (!isActive) return;

        setSessions(rows);
      } catch (error) {
        if (!isActive) return;

        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setSessions([]);
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to load summary.",
        );
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadSessions();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, []);

  return (
    <div className="relative bg-black text-white rounded-xs px-5 py-3 flex flex-col gap-3">
      <h1 className="text-[#FDB833] font-bold ">Focus Summary</h1>

      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <p className="font-bold text-[43px] leading-none tracking-tight">
            {isLoading ? "..." : summary.totalOptimalFocusTime}
          </p>
          <p className="text-sm font-semibold text-white/65">
            Total Optimal Focus Time
          </p>
        </div>

        <Image
          src="/hourglass.png"
          alt="hourglass"
          width={100}
          height={100}
          loading="eager"
          className="h-22 w-auto"
        />
      </div>

      <div className="border-t flex justify-between pt-5">
        <div className="flex flex-col gap-2">
          <h1 className="text-[#FDB833] font-bold text-xs">VS Last Period</h1>
          <p className="text-md font-semibold flex gap-2 items-center">
            <TrendingUp className="h-5 w-5 text-[#FDB833]" />
            {errorMessage ? "Unavailable" : summary.vsLastPeriod}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <h1 className="text-[#FDB833] font-bold text-xs">Total Sessions</h1>
          <p className="text-md font-semibold">
            {isLoading ? "..." : summary.totalSessions}
          </p>
        </div>
      </div>
    </div>
  );
}

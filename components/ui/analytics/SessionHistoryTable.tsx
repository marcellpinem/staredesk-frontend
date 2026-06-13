"use client";

import { useEffect, useMemo, useState } from "react";

import { apiFetch } from "@/lib/api";

type AnalyticsRange = "today" | "week" | "month";

type ApiSession = {
  id?: string;
  ID?: string;
  started_at?: string;
  StartedAt?: string;
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
  id: string;
  startedAt: string;
  endedAt: string | null;
  durationSec: number;
  dominantCondition: string;
};

type SessionHistoryTableProps = {
  range?: AnalyticsRange;
};

const API_PAGE_LIMIT = 100;
const PAGE_LIMIT = 10;
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_FETCH_PAGES = 50;

function normalizeSession(session: ApiSession, index: number): SessionRow {
  return {
    id: session.id ?? session.ID ?? `session-${index}`,
    startedAt: session.started_at ?? session.StartedAt ?? "",
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

function isSessionInRange(session: SessionRow, range: AnalyticsRange): boolean {
  if (!session.endedAt) {
    return false;
  }

  const endedAtMs = new Date(session.endedAt).getTime();

  if (Number.isNaN(endedAtMs)) {
    return false;
  }

  const nowMs = Date.now();

  if (endedAtMs > nowMs) {
    return false;
  }

  if (range === "today") {
    return endedAtMs >= getStartOfTodayJakartaMs();
  }

  if (range === "week") {
    return endedAtMs >= nowMs - 7 * DAY_MS;
  }

  return endedAtMs >= nowMs - 30 * DAY_MS;
}

function formatTime(value: string | null): string {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
}

function formatTimeRange(startedAt: string, endedAt: string | null): string {
  return `${formatTime(startedAt)} – ${formatTime(endedAt)}`;
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

function getConditionLabel(condition: string): string {
  const labels: Record<string, string> = {
    optimal: "OPTIMAL",
    eye_strain_risk: "EYE STRAIN",
    posture_risk: "POSTURE RISK",
    distracted: "DISTRACTED",
    away: "AWAY",
  };

  if (!condition) return "-";

  return labels[condition] ?? condition.replaceAll("_", " ").toUpperCase();
}

function getConditionColor(condition: string): string {
  const colors: Record<string, string> = {
    optimal: "bg-[#fdb834]/40",
    eye_strain_risk: "bg-[#dc9417]/40",
    posture_risk: "bg-[#fff200]/40",
    distracted: "bg-[#a6a6a6]/40",
    away: "bg-black",
  };

  return colors[condition] ?? "bg-[#d9d9d9]";
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

export default function SessionHistoryTable({
  range = "today",
}: SessionHistoryTableProps) {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [pageByRange, setPageByRange] = useState<
    Record<AnalyticsRange, number>
  >({
    today: 1,
    week: 1,
    month: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => isSessionInRange(session, range));
  }, [sessions, range]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredSessions.length / PAGE_LIMIT));
  }, [filteredSessions.length]);

  const currentPage = Math.min(pageByRange[range] ?? 1, totalPages);

  const paginatedSessions = useMemo(() => {
    const start = (currentPage - 1) * PAGE_LIMIT;
    return filteredSessions.slice(start, start + PAGE_LIMIT);
  }, [filteredSessions, currentPage]);

  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

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

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Failed to load session log.",
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
    <div className="overflow-hidden border-2 border-black bg-white">
      <h1 className="border-b-2 border-black bg-[#eeee] px-5 py-3 text-xl font-extrabold tracking-tight sm:text-2xl">
        SESSION LOG
      </h1>

      <div className="flex border-r border-b-2 border-black text-[10px] sm:text-[11px]">
        <div className="flex items-center justify-center py-2.5 font-extrabold uppercase tracking-wide flex-1">
          Time
        </div>
        <div className="flex items-center justify-center py-2.5 font-extrabold uppercase tracking-wide flex-1">
          Duration
        </div>
        <div className="flex px-4 items-center justify-end py-2.5 font-extrabold uppercase tracking-wide flex-1">
          Condition
        </div>
      </div>

      <div className="max-h-72 overflow-y-auto scrollbar-hide sm:max-h-80">
        {isLoading ? (
          <div className="flex min-h-24 items-center justify-center px-5 py-6 text-[12px] font-semibold">
            Loading sessions...
          </div>
        ) : errorMessage ? (
          <div className="flex min-h-24 items-center justify-center px-5 py-6 text-center text-[12px] font-semibold">
            {errorMessage}
          </div>
        ) : paginatedSessions.length === 0 ? (
          <div className="flex min-h-24 items-center justify-center px-5 py-6 text-[12px] font-semibold">
            No completed sessions.
          </div>
        ) : (
          paginatedSessions.map((session) => {
            const condition = session.dominantCondition.toLowerCase();
            const isAway = condition === "away";

            if (isAway) {
              return (
                <div
                  className="border-b-2 border-black bg-black px-4 py-2.5 text-[12px] font-extrabold tracking-wide text-white last:border-b-0 sm:px-5 sm:text-[13px]"
                  key={session.id}
                >
                  AWAY – {formatDuration(session.durationSec)}
                </div>
              );
            }

            return (
              <div
                key={session.id}
                className={`flex border-r border-b-2 font-semibold border-black text-[10px] sm:text-[11px] ${getConditionColor(condition)}`}
              >
                <div className="flex items-center justify-center py-2.5 uppercase tracking-wide flex-1 text-[12px]">
                  {formatTimeRange(session.startedAt, session.endedAt)}
                </div>
                <div className="flex items-center justify-center py-2.5 tracking-wide flex-1 text-[12px]">
                  {formatDuration(session.durationSec)}
                </div>
                <div className="flex items-center justify-end px-4 py-2.5 uppercase tracking-wide flex-1 text-[11px]">
                  {getConditionLabel(session.dominantCondition)}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="flex items-center justify-between border-t-2 border-black px-4 py-2 text-[10px] font-extrabold uppercase tracking-wide sm:px-5 sm:text-[11px]">
        <button
          className="disabled:opacity-30"
          disabled={!canGoPrevious || isLoading}
          onClick={() =>
            setPageByRange((current) => ({
              ...current,
              [range]: Math.max(1, currentPage - 1),
            }))
          }
          type="button"
        >
          Prev
        </button>

        <span>
          {currentPage} / {totalPages}
        </span>

        <button
          className="disabled:opacity-30"
          disabled={!canGoNext || isLoading}
          onClick={() =>
            setPageByRange((current) => ({
              ...current,
              [range]: Math.min(totalPages, currentPage + 1),
            }))
          }
          type="button"
        >
          Next
        </button>
      </div>
    </div>
  );
}

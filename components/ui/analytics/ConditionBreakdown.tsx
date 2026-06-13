"use client";

import { apiFetch } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";
import { Cell, Pie, PieChart, Tooltip } from "recharts";

type AnalyticsRange = "today" | "week" | "month";

type ConditionKey =
  | "optimal"
  | "distracted"
  | "eye_strain_risk"
  | "posture_risk"
  | "away";

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

type Condition = {
  key: Exclude<ConditionKey, "away">;
  label: string;
  pct: number;
  totalSec: number;
  color: string;
};

type ConditionBreakdownProps = {
  range?: AnalyticsRange;
};

const API_PAGE_LIMIT = 100;
const MAX_FETCH_PAGES = 50;
const DAY_MS = 24 * 60 * 60 * 1000;

const conditionMeta: Record<
  Exclude<ConditionKey, "away">,
  { label: string; color: string }
> = {
  optimal: {
    label: "Optimal",
    color: "#F5A623",
  },
  distracted: {
    label: "Distracted",
    color: "#9B9B9B",
  },
  eye_strain_risk: {
    label: "Eye Strain Risk",
    color: "#C07D2E",
  },
  posture_risk: {
    label: "Posture Risk",
    color: "#F5E642",
  },
};

const conditionOrder: Exclude<ConditionKey, "away">[] = [
  "optimal",
  "distracted",
  "eye_strain_risk",
  "posture_risk",
];

function normalizeCondition(value?: string): ConditionKey | null {
  if (
    value === "optimal" ||
    value === "distracted" ||
    value === "eye_strain_risk" ||
    value === "posture_risk" ||
    value === "away"
  ) {
    return value;
  }

  return null;
}

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

function normalizeData(
  sessions: SessionRow[],
  range: AnalyticsRange,
): Condition[] {
  const durationMap = new Map<Exclude<ConditionKey, "away">, number>();

  sessions.forEach((session) => {
    if (!isSessionInRange(session, range)) {
      return;
    }

    const condition = normalizeCondition(session.dominantCondition);

    if (!condition || condition === "away") {
      return;
    }

    durationMap.set(
      condition,
      (durationMap.get(condition) ?? 0) + session.durationSec,
    );
  });

  const total = conditionOrder.reduce(
    (sum, condition) => sum + (durationMap.get(condition) ?? 0),
    0,
  );

  return conditionOrder.map((condition) => {
    const totalSec = durationMap.get(condition) ?? 0;

    return {
      key: condition,
      label: conditionMeta[condition].label,
      pct: total > 0 ? Math.round((totalSec / total) * 100) : 0,
      totalSec,
      color: conditionMeta[condition].color,
    };
  });
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

export default function ConditionBreakdown({
  range = "today",
}: ConditionBreakdownProps) {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const data = useMemo(() => {
    return normalizeData(sessions, range);
  }, [sessions, range]);

  const chartData = useMemo(
    () => data.filter((item) => item.totalSec > 0),
    [data],
  );

  const totalSec = useMemo(
    () => data.reduce((total, item) => total + item.totalSec, 0),
    [data],
  );

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    async function loadSessions() {
      try {
        setIsLoading(true);
        setError("");

        const rows = await fetchAllSessions(controller.signal);

        if (!isMounted) return;

        setSessions(rows);
      } catch (err) {
        if (!isMounted) return;

        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }

        setSessions([]);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load condition breakdown",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadSessions();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  return (
    <div className="border-2 rounded-xs px-5 py-3 bg-white">
      <h1 className="font-bold text-sm">Condition Breakdown</h1>

      {error ? (
        <div className="flex min-h-37.5 items-center justify-center text-center text-sm font-bold text-black/45">
          {error}
        </div>
      ) : (
        <div className={isLoading ? "opacity-40 transition" : "transition"}>
          <div className="flex items-center justify-center">
            {totalSec > 0 ? (
              <PieChart width={150} height={150}>
                <Pie
                  data={chartData}
                  cx={75}
                  cy={75}
                  outerRadius={70}
                  style={{
                    outline: "none",
                  }}
                  dataKey="totalSec"
                  strokeWidth={2}
                  stroke="#fff"
                  startAngle={90}
                  endAngle={-270}
                >
                  {chartData.map((entry) => {
                    return <Cell key={entry.key} fill={entry.color} />;
                  })}
                </Pie>

                <Tooltip
                  formatter={(value, _name, props) => {
                    const payload = props.payload as Condition | undefined;

                    return [
                      `${payload?.pct ?? 0}% (${formatDuration(
                        Number(value),
                      )})`,
                    ];
                  }}
                  contentStyle={{
                    borderRadius: 8,
                    border: "0.5px solid #e5e7eb",
                    backgroundColor: "#222",
                    fontSize: 13,
                    fontWeight: "bold",
                    color: "black",
                  }}
                />
              </PieChart>
            ) : (
              <div className="flex h-37.5 w-37.5 items-center justify-center rounded-full border-8 border-black/10 text-xs font-bold text-black/40">
                No data
              </div>
            )}
          </div>

          <div className="flex flex-col mt-2">
            {data.map((item) => (
              <div
                key={item.key}
                className="flex items-center gap-2 font-bold text-black"
              >
                <span
                  className="h-3.5 w-3.5 border shrink-0 rounded-sm"
                  style={{ backgroundColor: item.color }}
                />

                <span className="flex-3 text-sm ">{item.label}</span>

                <span className="flex-2 text-end text-sm ">
                  {formatDuration(item.totalSec)}
                </span>

                <span className="flex-1 text-end text-sm ">{item.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

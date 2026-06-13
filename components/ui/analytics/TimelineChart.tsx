"use client";

import { apiFetch } from "@/lib/api";
import { useEffect, useMemo, useRef, useState } from "react";

type SegmentType =
  | "optimal"
  | "distracted"
  | "away"
  | "eye_strain_risk"
  | "posture_risk";

type Segment = {
  type: SegmentType;
  value: number;
};

type TimelineItem = {
  label: string;
  hour: number;
  segments: Segment[];
};

type TimelineApiEntry = {
  Hour?: number;
  hour?: number;
  DominantCondition?: string;
  dominant_condition?: string;
  TotalSec?: number;
  total_sec?: number;
};

type TimelineApiResponse = {
  date?: string;
  entries?: TimelineApiEntry[];
  Entries?: TimelineApiEntry[];
};

type SessionTimelineProps = {
  date?: string;
  className?: string;
};

const segmentClass: Record<SegmentType, string> = {
  optimal: "bg-[#fdb834]",
  distracted: "bg-[#a6a6a6]",
  away: "bg-black",
  eye_strain_risk: "bg-[#dc9417]",
  posture_risk: "bg-[#fff200]",
};

const legend: { type: SegmentType; label: string }[] = [
  { type: "optimal", label: "Optimal" },
  { type: "distracted", label: "Distracted" },
  { type: "away", label: "Away" },
  { type: "eye_strain_risk", label: "Eye Strain Risk" },
  { type: "posture_risk", label: "Posture Risk" },
];

function getTodayDateParam() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getCurrentWibHour() {
  const hour = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    hour12: false,
  }).format(new Date());

  return Number(hour) % 24;
}

function toWibHour(hour: number) {
  return (hour + 7) % 24;
}

function formatHour(hour: number) {
  return String(hour).padStart(2, "0");
}

function normalizeCondition(value?: string): SegmentType | null {
  if (
    value === "optimal" ||
    value === "distracted" ||
    value === "away" ||
    value === "eye_strain_risk" ||
    value === "posture_risk"
  ) {
    return value;
  }

  return null;
}

function createEmptyTimeline(): TimelineItem[] {
  return Array.from({ length: 24 }, (_, hour) => ({
    label: formatHour(hour),
    hour,
    segments: [],
  }));
}

function normalizeTimeline(entries?: TimelineApiEntry[]): TimelineItem[] {
  const timeline = createEmptyTimeline();

  entries?.forEach((entry) => {
    const rawHour = entry.Hour ?? entry.hour;
    const totalSec = entry.TotalSec ?? entry.total_sec ?? 0;
    const condition = normalizeCondition(
      entry.DominantCondition ?? entry.dominant_condition,
    );

    if (typeof rawHour !== "number" || rawHour < 0 || rawHour > 23) {
      return;
    }

    const wibHour = toWibHour(rawHour);

    timeline[wibHour] = {
      label: formatHour(wibHour),
      hour: wibHour,
      segments:
        condition && totalSec > 0
          ? [
              {
                type: condition,
                value: totalSec,
              },
            ]
          : [],
    };
  });

  return timeline;
}

function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return "0m";
}

export function SessionTimeline({
  date = getTodayDateParam(),
  className = "",
}: SessionTimelineProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const [timelineData, setTimelineData] = useState<TimelineItem[]>(() =>
    createEmptyTimeline(),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const currentWibHour = useMemo(() => getCurrentWibHour(), []);

  const maxTotal = useMemo(() => {
    const maxValue = Math.max(
      ...timelineData.map((item) =>
        item.segments.reduce((total, segment) => total + segment.value, 0),
      ),
      0,
    );

    return Math.max(maxValue * 1.15, 1);
  }, [timelineData]);

  useEffect(() => {
    let isMounted = true;

    const timer = window.setTimeout(() => {
      setIsLoading(true);
      setError("");

      apiFetch<TimelineApiResponse>(`/analytics/timeline?date=${date}`)
        .then((response) => {
          if (!isMounted) return;

          setTimelineData(
            normalizeTimeline(response.entries ?? response.Entries),
          );
        })
        .catch((err: Error) => {
          if (!isMounted) return;

          setTimelineData(createEmptyTimeline());
          setError(err.message || "Failed to load timeline");
        })
        .finally(() => {
          if (!isMounted) return;

          setIsLoading(false);
        });
    }, 0);

    return () => {
      isMounted = false;
      window.clearTimeout(timer);
    };
  }, [date]);

  useEffect(() => {
    const container = scrollRef.current;

    if (!container) {
      return;
    }

    const timer = window.setTimeout(() => {
      const itemWidth = container.scrollWidth / 24;
      const targetLeft =
        itemWidth * currentWibHour - container.clientWidth / 2 + itemWidth / 2;

      container.scrollTo({
        left: Math.max(targetLeft, 0),
        behavior: "smooth",
      });
    }, 120);

    return () => {
      window.clearTimeout(timer);
    };
  }, [currentWibHour, timelineData]);

  return (
    <section
      className={`w-full border bg-[#f7f7f7] p-4 sm:p-5 md:p-6 ${className}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-extrabold tracking-tight text-neutral-700">
            Session Timeline
          </h2>
        </div>
      </div>

      {error ? (
        <div className="mt-8 flex min-h-52 items-center justify-center border-2 border-dashed border-black/20 bg-white px-4 text-center text-sm font-extrabold text-black/45">
          {error}
        </div>
      ) : (
        <div className={isLoading ? "opacity-40 transition" : "transition"}>
          <div className="mt-5 flex items-center justify-between text-[11px] font-extrabold text-black/40">
            <span>Current: {formatHour(currentWibHour)}:00 WIB</span>
          </div>

          <div className="relative mt-4">
            <div className="pointer-events-none absolute bottom-0 left-0 top-0 z-10 w-8 bg-linear-to-r from-[#f7f7f7] to-transparent" />
            <div className="pointer-events-none absolute bottom-0 right-0 top-0 z-10 w-8 bg-linear-to-l from-[#f7f7f7] to-transparent" />

            <div ref={scrollRef} className="w-full overflow-x-auto pb-1">
              <div className="grid min-w-230 grid-cols-24 items-end gap-2 sm:gap-3">
                {timelineData.map((item) => {
                  const isCurrentHour = item.hour === currentWibHour;

                  return (
                    <div
                      key={item.label}
                      className="flex flex-col items-center gap-2"
                    >
                      <div className="relative flex h-52.5 w-full flex-col-reverse gap-1.5 sm:h-52.5">
                        {isCurrentHour ? (
                          <span className="absolute -top-5 left-1/2 -translate-x-1/2 rounded-full border border-black bg-white px-2 py-0.5 text-[10px] font-extrabold tracking-tight text-black">
                            NOW
                          </span>
                        ) : null}

                        {item.segments.length > 0 ? (
                          item.segments.map((segment, index) => {
                            const height = (segment.value / maxTotal) * 100;

                            return (
                              <div
                                key={`${item.label}-${segment.type}-${index}`}
                                title={`${item.label}:00 WIB — ${formatDuration(
                                  segment.value,
                                )}`}
                                className={`mx-auto w-[70%] min-w-6 max-w-12 border-2 border-black transition hover:opacity-80 ${
                                  isCurrentHour ? "ring-2 ring-black/20" : ""
                                } ${segmentClass[segment.type]}`}
                                style={{
                                  height: `${height}%`,
                                }}
                              />
                            );
                          })
                        ) : (
                          <div
                            title={`${item.label}:00 WIB — No activity`}
                            className={`mx-auto w-[70%] min-w-6 max-w-12 border-2 border-black bg-black/10 ${
                              isCurrentHour ? "ring-2 ring-black/20" : ""
                            }`}
                            style={{
                              height: "5%",
                            }}
                          />
                        )}
                      </div>

                      <div
                        className={`h-1.5 w-[70%] min-w-6 max-w-12 ${
                          isCurrentHour ? "bg-[#fdb834]" : "bg-black"
                        }`}
                      />

                      <span
                        className={`text-md font-extrabold ${
                          isCurrentHour ? "text-black" : "text-neutral-700"
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-3">
            {legend.map((item) => (
              <div key={item.type} className="flex items-center gap-1.25">
                <span
                  className={`h-4 w-4 rounded-md border border-black ${segmentClass[item.type]}`}
                />
                <span className="text-sm font-extrabold">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

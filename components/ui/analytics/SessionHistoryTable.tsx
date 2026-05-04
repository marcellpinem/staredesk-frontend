"use client";

import { useState } from "react";

// ─── Types ───────────────────────────────────────────────
type Condition = "optimal" | "posture_risk" | "high_risk";

interface Session {
  id: string;
  date: string;
  timeStart: string;
  timeEnd: string;
  duration: string;
  condition: Condition;
  endTime: string;
}

const SESSION_DATA: Session[] = [
  {
    id: "1",
    date: "03 May 2026",
    timeStart: "14:00",
    timeEnd: "15:30",
    duration: "1h 30m",
    condition: "optimal",
    endTime: "15:35",
  },
  {
    id: "2",
    date: "03 May 2026",
    timeStart: "12:00",
    timeEnd: "13:30",
    duration: "1h 30m",
    condition: "posture_risk",
    endTime: "13:35",
  },
  {
    id: "3",
    date: "03 May 2026",
    timeStart: "09:00",
    timeEnd: "11:00",
    duration: "2h 0m",
    condition: "optimal",
    endTime: "11:05",
  },
  {
    id: "4",
    date: "02 May 2026",
    timeStart: "15:00",
    timeEnd: "16:30",
    duration: "1h 30m",
    condition: "optimal",
    endTime: "16:28",
  },
  {
    id: "5",
    date: "02 May 2026",
    timeStart: "11:00",
    timeEnd: "12:00",
    duration: "1h 0m",
    condition: "high_risk",
    endTime: "12:03",
  },
  {
    id: "6",
    date: "02 May 2026",
    timeStart: "08:30",
    timeEnd: "10:00",
    duration: "1h 30m",
    condition: "optimal",
    endTime: "10:05",
  },
  {
    id: "7",
    date: "01 May 2026",
    timeStart: "16:00",
    timeEnd: "17:30",
    duration: "1h 30m",
    condition: "posture_risk",
    endTime: "17:32",
  },
  {
    id: "8",
    date: "01 May 2026",
    timeStart: "13:00",
    timeEnd: "14:30",
    duration: "1h 30m",
    condition: "optimal",
    endTime: "14:28",
  },
  {
    id: "9",
    date: "01 May 2026",
    timeStart: "09:00",
    timeEnd: "10:30",
    duration: "1h 30m",
    condition: "high_risk",
    endTime: "10:35",
  },
];

// ─── Constants ───────────────────────────────────────────
const PAGE_SIZE = 4;

const CONDITION_CONFIG: Record<
  Condition,
  { label: string; color: string; dot: string }
> = {
  optimal: { label: "Optimal", color: "#FFF8E1", dot: "#EF9F27" },
  posture_risk: { label: "Posture Risk", color: "#F5F5F5", dot: "#B4B2A9" },
  high_risk: { label: "High Risk", color: "#FEECEC", dot: "#E24B4A" },
};

// ─── Sub-components ──────────────────────────────────────
function StatusBadge({ condition }: { condition: Condition }) {
  const { label, color, dot } = CONDITION_CONFIG[condition];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        borderRadius: 20,
        background: color,
        fontSize: 12,
        fontWeight: 500,
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: dot,
          flexShrink: 0,
        }}
      />
      {label}
    </span>
  );
}

function DateSeparator({ date }: { date: string }) {
  return (
    <div
      style={{
        padding: "6px 16px",
        fontSize: 12,
        fontWeight: 500,
        color: "#888",
        background: "#F9F9F9",
        borderTop: "1px solid #EBEBEB",
        borderBottom: "1px solid #EBEBEB",
      }}
    >
      {date}
    </div>
  );
}

function TableHeader() {
  const cols = ["Time", "Duration", "Condition", "End Time"];
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "130px 100px 1fr 90px",
        padding: "8px 16px",
        borderBottom: "1px solid #EBEBEB",
      }}
    >
      {cols.map((c) => (
        <span
          key={c}
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "#999",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          {c}
        </span>
      ))}
    </div>
  );
}

function TableRow({ session }: { session: Session }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "130px 100px 1fr 90px",
        padding: "12px 16px",
        borderBottom: "1px solid #F0F0F0",
        alignItems: "center",
      }}
    >
      <span style={{ fontWeight: 500, fontSize: 13 }}>
        {session.timeStart} – {session.timeEnd}
      </span>
      <span style={{ color: "#888", fontSize: 13 }}>{session.duration}</span>
      <StatusBadge condition={session.condition} />
      <span style={{ color: "#888", fontSize: 13 }}>{session.endTime}</span>
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  total,
  start,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  start: number;
  onPageChange: (p: number) => void;
}) {
  const btnStyle = (active: boolean): React.CSSProperties => ({
    minWidth: 28,
    height: 28,
    border: "1px solid #E0E0E0",
    background: active ? "#F0F0F0" : "#fff",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: active ? 600 : 400,
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 16px",
        borderTop: "1px solid #EBEBEB",
      }}
    >
      <span style={{ fontSize: 12, color: "#888" }}>
        Showing {start + 1}–{Math.min(start + PAGE_SIZE, total)} of {total}
      </span>
      <div style={{ display: "flex", gap: 4 }}>
        <button
          style={btnStyle(false)}
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
        >
          ←
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            style={btnStyle(p === page)}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        ))}
        <button
          style={btnStyle(false)}
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          →
        </button>
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────
function groupByDate(sessions: Session[]) {
  return sessions.reduce<Record<string, Session[]>>((acc, s) => {
    acc[s.date] = acc[s.date] ? [...acc[s.date], s] : [s];
    return acc;
  }, {});
}

// ─── Main Component ──────────────────────────────────────
export default function SessionHistoryTable() {
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(SESSION_DATA.length / PAGE_SIZE);
  const start = (page - 1) * PAGE_SIZE;
  const pageData = SESSION_DATA.slice(start, start + PAGE_SIZE);
  const grouped = groupByDate(pageData);
  const dates = [...new Set(pageData.map((s) => s.date))];

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #EBEBEB",
        borderRadius: 12,
        overflow: "hidden",
        fontFamily: "inherit",
      }}
    >
      <div style={{ padding: "16px", borderBottom: "1px solid #EBEBEB" }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
          Session Log
        </h2>
      </div>

      <TableHeader />

      {dates.map((date) => (
        <div key={date}>
          <DateSeparator date={date} />
          {grouped[date].map((session) => (
            <TableRow key={session.id} session={session} />
          ))}
        </div>
      ))}

      <Pagination
        page={page}
        totalPages={totalPages}
        total={SESSION_DATA.length}
        start={start}
        onPageChange={setPage}
      />
    </div>
  );
}

// frontend/hooks/useSession.ts

import { useMemo, useEffect, useState } from "react";
import { type WebSocketState } from "./useWebSocket";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SessionState {
  isActive: boolean;
  startedAt: Date | null;
  durationSec: number;
}

// ─── Utility ──────────────────────────────────────────────────────────────────

/** Format detik → "HH:MM:SS". Contoh: 3661 → "01:01:01" */
export function formatDuration(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSession(ws: WebSocketState): SessionState {
  const { isActive, startedAt } = useMemo(() => {
    const s = ws.session;
    if (s?.is_active && s.started_at) {
      return { isActive: true, startedAt: new Date(s.started_at) };
    }
    return { isActive: false, startedAt: null };
  }, [ws.session]);

  const [durationSec, setDurationSec] = useState(0);

  useEffect(() => {
    // Sesi tidak aktif — biarkan durationSec tetap di nilai terakhir
    // Reset dilakukan oleh interval saat startedAt null
    if (!isActive || !startedAt) return;

    // Capture startedAt ke closure interval — tidak perlu ref
    const origin = startedAt.getTime();

    const id = setInterval(() => {
      // setState dipanggil dari callback, bukan dari effect body — valid React 19
      setDurationSec(Math.floor((Date.now() - origin) / 1000));
    }, 1_000);

    return () => {
      clearInterval(id);
      // Reset via setter function — dipanggil dari cleanup, bukan effect body
      setDurationSec(0);
    };
  }, [isActive, startedAt]);

  return { isActive, startedAt, durationSec };
}

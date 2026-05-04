"use client";

// frontend/context/DeviceContext.tsx

import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { apiFetch } from "@/lib/api";
import { useWebSocket, type WebSocketState } from "@/hooks/useWebSocket";
import { useSession, type SessionState } from "@/hooks/useSession";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DeviceContextValue {
  ws: WebSocketState;
  session: SessionState;
  configAcked: boolean;
}

interface DeviceConfigResponse {
  config_ack: boolean;
}

const DeviceContext = createContext<DeviceContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function DeviceProvider({ children }: { children: React.ReactNode }) {
  const ws = useWebSocket();
  const session = useSession(ws);

  // Initial config_ack dari REST — hanya berubah saat fetch selesai
  const [initialConfigAcked, setInitialConfigAcked] = useState(false);

  useEffect(() => {
    apiFetch<DeviceConfigResponse>("/device/config")
      .then((data) => {
        // setState dipanggil dari async callback — valid React 19
        setInitialConfigAcked(data.config_ack);
      })
      .catch(() => {
        // Gagal fetch — biarkan false
      });
  }, []);

  // configAcked = true jika salah satu dari keduanya true
  // ws.configAcked menjadi true saat WebSocket menerima config_ack event
  const configAcked = useMemo(
    () => initialConfigAcked || ws.configAcked,
    [initialConfigAcked, ws.configAcked],
  );

  return (
    <DeviceContext.Provider value={{ ws, session, configAcked }}>
      {children}
    </DeviceContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDevice(): DeviceContextValue {
  const ctx = useContext(DeviceContext);
  if (!ctx) throw new Error("useDevice must be used within DeviceProvider");
  return ctx;
}

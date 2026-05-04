// frontend/hooks/useWebSocket.ts

import { useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Condition =
  | "optimal"
  | "eye_strain_risk"
  | "posture_risk"
  | "distracted"
  | "away";

export interface SensorData {
  distance_cm: number;
  ldr_value: number;
  pir_detected: boolean;
}

export interface DeviceInfo {
  is_online: boolean;
  last_seen: string; // ISO UTC
}

export interface SessionInfo {
  is_active: boolean;
  started_at?: string; // ISO UTC — ada saat active
}

export interface WSMessage {
  type:
    | "telemetry"
    | "condition_change"
    | "device_status"
    | "config_ack"
    | "session_start"
    | "session_end";
  timestamp: string;
  device?: DeviceInfo;
  sensors?: SensorData;
  condition?: Condition;
  session?: SessionInfo;
}

export interface WebSocketState {
  isConnected: boolean;
  lastMessage: WSMessage | null;
  device: DeviceInfo | null;
  sensors: SensorData | null;
  condition: Condition | null;
  session: SessionInfo | null;
  configAcked: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const INITIAL_RECONNECT_DELAY = 1_000;
const MAX_RECONNECT_DELAY = 30_000;
const RECONNECT_MULTIPLIER = 2;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useWebSocket(): WebSocketState {
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    lastMessage: null,
    device: null,
    sensors: null,
    condition: null,
    session: null,
    configAcked: false,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectDelay = useRef(INITIAL_RECONNECT_DELAY);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMounted = useRef(false);
  const connectRef = useRef<() => void>(() => {});

  useEffect(() => {
    isMounted.current = true;

    function connect() {
      if (!isMounted.current) return;

      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) return;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
      const wsUrl = apiUrl.replace(/^http/, "ws") + `/ws?token=${token}`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isMounted.current) return;
        reconnectDelay.current = INITIAL_RECONNECT_DELAY;
        setState((prev) => ({ ...prev, isConnected: true }));
      };

      ws.onmessage = (event: MessageEvent) => {
        if (!isMounted.current) return;
        try {
          const msg: WSMessage = JSON.parse(event.data as string);
          setState((prev) => {
            const next = { ...prev, lastMessage: msg };

            switch (msg.type) {
              case "telemetry":
              case "condition_change":
                if (msg.device) next.device = msg.device;
                if (msg.sensors) next.sensors = msg.sensors;
                if (msg.condition) next.condition = msg.condition;
                if (msg.session) next.session = msg.session;
                break;

              case "device_status":
                if (msg.device) next.device = msg.device;
                break;

              case "config_ack":
                next.configAcked = true;
                break;

              case "session_start":
                if (msg.session) next.session = msg.session;
                break;

              case "session_end":
                next.session = { is_active: false };
                break;
            }

            return next;
          });
        } catch {
          // Abaikan pesan malformed
        }
      };

      ws.onclose = () => {
        if (!isMounted.current) return;
        setState((prev) => ({ ...prev, isConnected: false }));

        if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
        reconnectTimer.current = setTimeout(() => {
          reconnectDelay.current = Math.min(
            reconnectDelay.current * RECONNECT_MULTIPLIER,
            MAX_RECONNECT_DELAY,
          );
          connectRef.current();
        }, reconnectDelay.current);
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connectRef.current = connect;
    connect();

    return () => {
      isMounted.current = false;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, []);

  return state;
}

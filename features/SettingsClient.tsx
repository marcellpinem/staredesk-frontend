"use client";

import Image from "next/image";
import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useDevice } from "@/context/DeviceContext";
import { apiFetch } from "@/lib/api";
import type { WSMessage } from "@/hooks/useWebSocket";

type ConfigStatus = "idle" | "loading" | "saving" | "pending" | "error";

type ConfigFormState = {
  distanceMinCm: number;
  distanceMaxCm: number;
  ldrThreshold: number;
  awayTimeoutMinutes: number;
};

type ConfigMeta = {
  id?: string;
  userId?: string;
  updatedAt?: string;
};

type ApiDeviceConfig = {
  [key: string]: unknown;
};

type DeviceStatusState = {
  id?: string;
  userId?: string;
  isOnline?: boolean;
  lastSeen?: string;
};

const CONFIG_LIMITS = {
  distance: {
    min: 0,
    max: 100,
    step: 1,
  },
  ldr: {
    min: 0,
    max: 1000,
    step: 1,
  },
  away: {
    min: 1,
    max: 60,
    step: 1,
  },
} as const;

const DEFAULT_CONFIG: ConfigFormState = {
  distanceMinCm: 40,
  distanceMaxCm: 90,
  ldrThreshold: 500,
  awayTimeoutMinutes: 3,
};

type SliderTrackProps = {
  thumbs: number[];
  labels: [string, string, string];
  children?: ReactNode;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function toPercent(value: number, min: number, max: number): number {
  if (max <= min) return 0;
  return ((value - min) / (max - min)) * 100;
}

function readNumber(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }

  return fallback;
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value
    : undefined;
}

function readBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;

  if (typeof value === "string") {
    const normalized = value.toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }

  return fallback;
}

function getApiField(data: ApiDeviceConfig, keys: string[]): unknown {
  for (const key of keys) {
    if (key in data) return data[key];
  }

  return undefined;
}

function isSameConfig(a: ConfigFormState, b: ConfigFormState): boolean {
  return (
    a.distanceMinCm === b.distanceMinCm &&
    a.distanceMaxCm === b.distanceMaxCm &&
    a.ldrThreshold === b.ldrThreshold &&
    a.awayTimeoutMinutes === b.awayTimeoutMinutes
  );
}

function normalizeConfig(data: ApiDeviceConfig): {
  config: ConfigFormState;
  meta: ConfigMeta;
  configAck: boolean;
} {
  const rawMin = readNumber(
    getApiField(data, ["distance_min_cm", "DistanceMinCm", "distanceMinCm"]),
    DEFAULT_CONFIG.distanceMinCm,
  );

  const rawMax = readNumber(
    getApiField(data, ["distance_max_cm", "DistanceMaxCm", "distanceMaxCm"]),
    DEFAULT_CONFIG.distanceMaxCm,
  );

  const distanceMinCm = clamp(
    Math.min(rawMin, rawMax),
    CONFIG_LIMITS.distance.min,
    CONFIG_LIMITS.distance.max,
  );

  const distanceMaxCm = clamp(
    Math.max(rawMin, rawMax),
    CONFIG_LIMITS.distance.min,
    CONFIG_LIMITS.distance.max,
  );

  return {
    config: {
      distanceMinCm,
      distanceMaxCm,
      ldrThreshold: clamp(
        readNumber(
          getApiField(data, ["ldr_threshold", "LdrThreshold", "ldrThreshold"]),
          DEFAULT_CONFIG.ldrThreshold,
        ),
        CONFIG_LIMITS.ldr.min,
        CONFIG_LIMITS.ldr.max,
      ),
      awayTimeoutMinutes: clamp(
        readNumber(
          getApiField(data, [
            "away_timeout_minutes",
            "AwayTimeoutMinutes",
            "awayTimeoutMinutes",
          ]),
          DEFAULT_CONFIG.awayTimeoutMinutes,
        ),
        CONFIG_LIMITS.away.min,
        CONFIG_LIMITS.away.max,
      ),
    },
    meta: {
      id: readString(getApiField(data, ["id", "ID"])),
      userId: readString(getApiField(data, ["user_id", "UserID", "userId"])),
      updatedAt: readString(
        getApiField(data, ["updated_at", "UpdatedAt", "updatedAt"]),
      ),
    },
    configAck: readBoolean(
      getApiField(data, ["config_ack", "ConfigAck", "configAck"]),
      false,
    ),
  };
}

function normalizeDeviceStatus(data: ApiDeviceConfig): DeviceStatusState {
  return {
    id: readString(getApiField(data, ["id", "ID"])),
    userId: readString(getApiField(data, ["user_id", "UserID", "userId"])),
    isOnline: readBoolean(
      getApiField(data, ["is_online", "IsOnline", "isOnline"]),
      false,
    ),
    lastSeen: readString(
      getApiField(data, ["last_seen", "LastSeen", "lastSeen"]),
    ),
  };
}

function formatWibDateTime(value?: string): string {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  const dateLabel = new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(date);

  const timeParts = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta",
  }).formatToParts(date);

  const hour = timeParts.find((part) => part.type === "hour")?.value ?? "00";
  const minute =
    timeParts.find((part) => part.type === "minute")?.value ?? "00";
  const second =
    timeParts.find((part) => part.type === "second")?.value ?? "00";

  return `${dateLabel}, ${hour} : ${minute} : ${second} WIB`;
}

function getStatusLabel(status: ConfigStatus): string {
  switch (status) {
    case "loading":
      return "Loading Config...";
    case "saving":
      return "Saving...";
    case "pending":
      return "Config Pending...";
    case "error":
      return "Config Error";
    case "idle":
      return "";
  }
}

function getStatusClassName(status: ConfigStatus): string {
  switch (status) {
    case "pending":
      return "border-black bg-white text-black";
    case "saving":
    case "loading":
      return "border-black bg-[#eeeeee] text-black/70";
    case "error":
      return "border-black bg-black text-white";
    case "idle":
      return "";
  }
}

function SliderTrack({ thumbs, labels, children }: SliderTrackProps) {
  return (
    <div className="mt-4 px-6">
      <div className="relative h-9">
        <div className="absolute left-0 right-0 top-3 h-0.5 bg-black/35" />

        <div className="absolute left-0 top-1 h-5 w-0.5 bg-black/45" />
        <div className="absolute left-1/2 top-1 h-5 w-0.5 -translate-x-1/2 bg-black/45" />
        <div className="absolute right-0 top-1 h-5 w-0.5 bg-black/45" />

        {thumbs.map((left, index) => (
          <div
            key={index}
            className="absolute top-0 h-7 w-4 border-2 border-black bg-[#FDB833] shadow-[2px_2px_0_rgba(0,0,0,0.25)]"
            style={{ left: `${left}%`, transform: "translateX(-50%)" }}
          />
        ))}

        {children}

        <div className="absolute left-0 top-7 text-[10px] font-semibold text-black/45">
          {labels[0]}
        </div>
        <div className="absolute left-1/2 top-7 -translate-x-1/2 text-[10px] font-semibold text-black/45">
          {labels[1]}
        </div>
        <div className="absolute right-0 top-7 text-[10px] font-semibold text-black/45">
          {labels[2]}
        </div>
      </div>
    </div>
  );
}

type RangeHitboxProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  disabled: boolean;
  onChange: (value: number) => void;
};

function RangeHitbox({
  label,
  value,
  min,
  max,
  step,
  disabled,
  onChange,
}: RangeHitboxProps) {
  return (
    <input
      aria-label={label}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(Number(event.target.value))}
      className="pointer-events-none absolute left-0 top-0 z-20 h-7 w-full appearance-none bg-transparent focus:outline-none [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-7 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-transparent [&::-webkit-slider-runnable-track]:h-7 [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:bg-transparent"
    />
  );
}

function LightIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-black">
      <path d="M12 2a6.5 6.5 0 0 0-3.8 11.77c.48.35.8.88.8 1.46V16h6v-.77c0-.58.32-1.11.8-1.46A6.5 6.5 0 0 0 12 2Z" />
      <path d="M9 18h6v2H9v-2ZM10 22h4v1h-4v-1ZM3 11h3v2H3v-2ZM18 11h3v2h-3v-2ZM4.76 4.76l2.12 2.12-1.41 1.41-2.12-2.12 1.41-1.41ZM18.53 3.35l1.41 1.41-2.12 2.12-1.41-1.41 2.12-2.12Z" />
    </svg>
  );
}

function TimerIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-black">
      <path d="M9 2h6v2H9V2ZM11 5h2v3h-2V5Z" />
      <path d="M12 6a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm1 8h3v2h-5V9h2v5Z" />
    </svg>
  );
}

export default function SettingsClient() {
  const { ws } = useDevice();

  const [form, setForm] = useState<ConfigFormState>(DEFAULT_CONFIG);
  const [savedConfig, setSavedConfig] =
    useState<ConfigFormState>(DEFAULT_CONFIG);
  const [meta, setMeta] = useState<ConfigMeta>({});
  const [deviceInfo, setDeviceInfo] = useState<DeviceStatusState | null>(null);
  const [status, setStatus] = useState<ConfigStatus>("loading");
  const [errorMessage, setErrorMessage] = useState("");

  const latestMessageRef = useRef<WSMessage | null>(ws.lastMessage);
  const pendingAnchorMessageRef = useRef<WSMessage | null>(null);
  const pendingSavedAtRef = useRef<number | null>(null);

  const isBusy = status === "loading" || status === "saving";
  const hasChanges = !isSameConfig(form, savedConfig);

  useEffect(() => {
    latestMessageRef.current = ws.lastMessage;
  }, [ws.lastMessage]);

  useEffect(() => {
    let isCancelled = false;

    apiFetch<ApiDeviceConfig>("/device/config")
      .then((data) => {
        if (isCancelled) return;

        const normalized = normalizeConfig(data);

        setForm(normalized.config);
        setSavedConfig(normalized.config);
        setMeta(normalized.meta);
        setStatus(normalized.configAck ? "idle" : "pending");
        setErrorMessage("");

        if (!normalized.configAck) {
          pendingAnchorMessageRef.current = latestMessageRef.current;
          pendingSavedAtRef.current = Date.now();
        }
      })
      .catch((error: unknown) => {
        if (isCancelled) return;

        setStatus("error");
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to load config",
        );
      });

    apiFetch<ApiDeviceConfig>("/device/status")
      .then((data) => {
        if (isCancelled) return;
        setDeviceInfo(normalizeDeviceStatus(data));
      })
      .catch(() => {
        if (isCancelled) return;
        setDeviceInfo(null);
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (status !== "pending") return;

    const message = ws.lastMessage;
    if (!message || message.type !== "config_ack") return;

    if (message === pendingAnchorMessageRef.current) return;

    const ackTime = Date.parse(message.timestamp);
    const savedAt = pendingSavedAtRef.current;

    if (
      savedAt !== null &&
      Number.isFinite(ackTime) &&
      ackTime + 5_000 < savedAt
    ) {
      return;
    }

    setStatus("idle");
    setErrorMessage("");
  }, [status, ws.lastMessage]);

  const distanceMinPercent = toPercent(
    form.distanceMinCm,
    CONFIG_LIMITS.distance.min,
    CONFIG_LIMITS.distance.max,
  );

  const distanceMaxPercent = toPercent(
    form.distanceMaxCm,
    CONFIG_LIMITS.distance.min,
    CONFIG_LIMITS.distance.max,
  );

  const ldrPercent = toPercent(
    form.ldrThreshold,
    CONFIG_LIMITS.ldr.min,
    CONFIG_LIMITS.ldr.max,
  );

  const awayPercent = toPercent(
    form.awayTimeoutMinutes,
    CONFIG_LIMITS.away.min,
    CONFIG_LIMITS.away.max,
  );

  const effectiveDevice = useMemo(() => {
    const hasDeviceData = Boolean(ws.device || deviceInfo);

    return {
      hasDeviceData,
      id: deviceInfo?.id,
      isOnline: ws.device?.is_online ?? deviceInfo?.isOnline ?? false,
      lastSeen: ws.device?.last_seen ?? deviceInfo?.lastSeen,
    };
  }, [deviceInfo, ws.device]);

  const deviceStatusLabel = effectiveDevice.hasDeviceData
    ? effectiveDevice.isOnline
      ? "ONLINE"
      : "OFFLINE"
    : ws.isConnected
      ? "WAITING"
      : "WS OFFLINE";

  const updateDistanceMin = (value: number) => {
    setForm((prev) => {
      const nextMin = clamp(
        value,
        CONFIG_LIMITS.distance.min,
        CONFIG_LIMITS.distance.max,
      );

      return {
        ...prev,
        distanceMinCm: nextMin,
        distanceMaxCm: Math.max(prev.distanceMaxCm, nextMin),
      };
    });
  };

  const updateDistanceMax = (value: number) => {
    setForm((prev) => {
      const nextMax = clamp(
        value,
        CONFIG_LIMITS.distance.min,
        CONFIG_LIMITS.distance.max,
      );

      return {
        ...prev,
        distanceMinCm: Math.min(prev.distanceMinCm, nextMax),
        distanceMaxCm: nextMax,
      };
    });
  };

  const updateLdrThreshold = (value: number) => {
    setForm((prev) => ({
      ...prev,
      ldrThreshold: clamp(value, CONFIG_LIMITS.ldr.min, CONFIG_LIMITS.ldr.max),
    }));
  };

  const updateAwayTimeout = (value: number) => {
    setForm((prev) => ({
      ...prev,
      awayTimeoutMinutes: clamp(
        value,
        CONFIG_LIMITS.away.min,
        CONFIG_LIMITS.away.max,
      ),
    }));
  };

  function handleReset() {
    setForm(savedConfig);
    setErrorMessage("");

    if (status === "error") {
      setStatus("idle");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setStatus("saving");
    setErrorMessage("");

    pendingAnchorMessageRef.current = latestMessageRef.current;
    pendingSavedAtRef.current = Date.now();

    try {
      const data = await apiFetch<ApiDeviceConfig>("/device/config", {
        method: "PUT",
        body: JSON.stringify({
          distance_min_cm: form.distanceMinCm,
          distance_max_cm: form.distanceMaxCm,
          ldr_threshold: form.ldrThreshold,
          away_timeout_minutes: form.awayTimeoutMinutes,
        }),
      });

      const normalized = normalizeConfig(data);

      setForm(normalized.config);
      setSavedConfig(normalized.config);
      setMeta(normalized.meta);
      setStatus(normalized.configAck ? "idle" : "pending");
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to save config",
      );
    }
  }

  return (
    <div className="p-5">
      <div className="flex w-full flex-col items-center gap-1 md:items-start">
        <h1 className="text-4xl font-extrabold tracking-wide md:text-5xl">
          Settings
        </h1>
        <p className="text-sm font-semibold text-black/55 md:text-base">
          Configure Sensor and Module Behavior
        </p>
      </div>

      <div className="mt-5 flex w-full flex-col items-center gap-4 lg:flex-row lg:items-start lg:gap-8">
        <section className="w-full max-w-100 border-2 border-black bg-white">
          <div className="flex items-center justify-between gap-3 border-b-2 border-black bg-[#eeeeee] px-5 py-3">
            <h2 className="text-lg font-extrabold tracking-wide">
              DEVICE CONFIGURATION
            </h2>

            {status !== "idle" ? (
              <span
                className={`shrink-0 border-2 px-2 py-1 text-[10px] font-extrabold ${getStatusClassName(
                  status,
                )}`}
              >
                {getStatusLabel(status)}
              </span>
            ) : null}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col">
            <div className="min-h-31.5 border-b-2 border-black px-5 pb-4 pt-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 shrink-0">
                    <Image
                      src="/distance-range.svg"
                      alt="Distance Range"
                      width={20}
                      height={20}
                      className="h-5 w-5 object-contain"
                    />
                  </div>
                  <h3 className="text-sm font-extrabold">
                    Distance Range (cm)
                  </h3>
                </div>

                <div>
                  <div className="flex border-2 border-black shadow-[3px_3px_0_rgba(0,0,0,0.2)]">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={form.distanceMinCm}
                      disabled={isBusy}
                      onChange={(event) =>
                        updateDistanceMin(
                          readNumber(event.target.value, form.distanceMinCm),
                        )
                      }
                      className="h-7.5 w-11 border-r-2 border-black bg-[#FDB833] text-center text-sm font-extrabold outline-none disabled:cursor-not-allowed disabled:opacity-70"
                    />
                    <input
                      type="text"
                      inputMode="numeric"
                      value={form.distanceMaxCm}
                      disabled={isBusy}
                      onChange={(event) =>
                        updateDistanceMax(
                          readNumber(event.target.value, form.distanceMaxCm),
                        )
                      }
                      className="h-7.5 w-11 bg-[#FDB833] text-center text-sm font-extrabold outline-none disabled:cursor-not-allowed disabled:opacity-70"
                    />
                  </div>
                  <div className="grid grid-cols-2 pt-1 text-center text-[9px] font-extrabold text-black/45">
                    <span>Min</span>
                    <span>Max</span>
                  </div>
                </div>
              </div>

              <SliderTrack
                thumbs={[distanceMinPercent, distanceMaxPercent]}
                labels={["0", "50", "100"]}
              >
                <RangeHitbox
                  label="Distance minimum"
                  value={form.distanceMinCm}
                  min={CONFIG_LIMITS.distance.min}
                  max={CONFIG_LIMITS.distance.max}
                  step={CONFIG_LIMITS.distance.step}
                  disabled={isBusy}
                  onChange={updateDistanceMin}
                />
                <RangeHitbox
                  label="Distance maximum"
                  value={form.distanceMaxCm}
                  min={CONFIG_LIMITS.distance.min}
                  max={CONFIG_LIMITS.distance.max}
                  step={CONFIG_LIMITS.distance.step}
                  disabled={isBusy}
                  onChange={updateDistanceMax}
                />
              </SliderTrack>
            </div>

            <div className="min-h-31.5 border-b-2 border-black px-5 pb-4 pt-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="shrink-0">
                    <LightIcon />
                  </div>
                  <h3 className="text-sm font-extrabold">
                    LDR Threshold (Lux)
                  </h3>
                </div>

                <input
                  type="text"
                  inputMode="numeric"
                  value={form.ldrThreshold}
                  disabled={isBusy}
                  onChange={(event) =>
                    updateLdrThreshold(
                      readNumber(event.target.value, form.ldrThreshold),
                    )
                  }
                  className="h-7.5 w-12 border-2 border-black bg-white text-center text-sm font-extrabold shadow-[3px_3px_0_rgba(0,0,0,0.12)] outline-none disabled:cursor-not-allowed disabled:opacity-70"
                />
              </div>

              <SliderTrack
                thumbs={[ldrPercent]}
                labels={["DARK (0)", "", "BRIGHT (1000)"]}
              >
                <RangeHitbox
                  label="LDR threshold"
                  value={form.ldrThreshold}
                  min={CONFIG_LIMITS.ldr.min}
                  max={CONFIG_LIMITS.ldr.max}
                  step={CONFIG_LIMITS.ldr.step}
                  disabled={isBusy}
                  onChange={updateLdrThreshold}
                />
              </SliderTrack>
            </div>

            <div className="min-h-31.5 border-b-2 border-black px-5 pb-4 pt-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="shrink-0">
                    <TimerIcon />
                  </div>
                  <h3 className="text-sm font-extrabold">Away Timeout (Min)</h3>
                </div>

                <input
                  type="text"
                  inputMode="numeric"
                  value={form.awayTimeoutMinutes}
                  disabled={isBusy}
                  onChange={(event) =>
                    updateAwayTimeout(
                      readNumber(event.target.value, form.awayTimeoutMinutes),
                    )
                  }
                  className="h-7.5 w-9 border-2 border-black bg-white text-center text-sm font-extrabold shadow-[3px_3px_0_rgba(0,0,0,0.12)] outline-none disabled:cursor-not-allowed disabled:opacity-70"
                />
              </div>

              <SliderTrack thumbs={[awayPercent]} labels={["1", "", "60"]}>
                <RangeHitbox
                  label="Away timeout"
                  value={form.awayTimeoutMinutes}
                  min={CONFIG_LIMITS.away.min}
                  max={CONFIG_LIMITS.away.max}
                  step={CONFIG_LIMITS.away.step}
                  disabled={isBusy}
                  onChange={updateAwayTimeout}
                />
              </SliderTrack>
            </div>

            <div className="flex flex-col gap-2 px-3 py-3">
              {errorMessage ? (
                <p className="text-xs font-extrabold text-black">
                  {errorMessage}
                </p>
              ) : null}

              <p className="text-[10px] font-extrabold text-black/45">
                Last Updated: {formatWibDateTime(meta.updatedAt)}
              </p>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={isBusy || !hasChanges}
                  onClick={handleReset}
                  className="h-10 rounded-sm border-2 border-black bg-white px-5 text-sm font-extrabold shadow-[3px_3px_0_rgba(0,0,0,0.16)] transition active:translate-x-px active:translate-y-px active:shadow-none disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none"
                >
                  RESET
                </button>

                <button
                  type="submit"
                  disabled={isBusy}
                  className="h-10 rounded-sm border-2 border-black bg-[#FDB833] px-7 text-sm font-extrabold shadow-[3px_3px_0_rgba(0,0,0,0.25)] transition active:translate-x-px active:translate-y-px active:shadow-none disabled:cursor-not-allowed disabled:opacity-70 disabled:shadow-none"
                >
                  {status === "saving" ? "SAVING..." : "SAVE & APPLY"}
                </button>
              </div>
            </div>
          </form>
        </section>

        <section className="w-full max-w-100 border-2 border-black bg-white">
          <div className="flex items-center justify-between border-b-2 border-black bg-black px-4 py-3">
            <h2 className="text-lg font-extrabold tracking-wide text-white">
              DEVICE INFO - DOIT ESP32
            </h2>
          </div>

          <div className="divide-y-2 divide-black">
            <div className="grid min-h-12 grid-cols-[1fr_auto] items-center px-5">
              <p className="text-sm font-extrabold">Device Status</p>
              <div className="flex items-center gap-2">
                <span
                  className={`h-5 w-5 rounded-sm border-2 border-black ${
                    effectiveDevice.isOnline ? "bg-[#FDB833]" : "bg-black"
                  }`}
                />
                <span className="text-sm font-extrabold">
                  {deviceStatusLabel}
                </span>
              </div>
            </div>

            <div className="grid min-h-12 grid-cols-[1fr_auto] items-center gap-4 px-5">
              <p className="text-sm font-extrabold">Last Seen</p>
              <p className="text-right text-sm font-extrabold">
                {formatWibDateTime(effectiveDevice.lastSeen)}
              </p>
            </div>

            <div className="grid min-h-12 grid-cols-[1fr_auto] items-center gap-4 px-5">
              <p className="text-sm font-extrabold">Device ID</p>
              <p className="text-right text-sm font-extrabold text-black/60">
                {effectiveDevice.id ?? meta.userId ?? "STAREDESK-001"}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

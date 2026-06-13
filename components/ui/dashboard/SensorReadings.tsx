"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useDevice } from "@/context/DeviceContext";
import { apiFetch } from "@/lib/api";

type ApiDeviceConfig = {
  ldr_threshold?: number;
  LdrThreshold?: number;
  ldrThreshold?: number;
};

function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }

  return null;
}

function normalizeLdrThreshold(data: ApiDeviceConfig): number | null {
  return (
    readNumber(data.ldr_threshold) ??
    readNumber(data.LdrThreshold) ??
    readNumber(data.ldrThreshold)
  );
}

export default function SensorReadings() {
  const { ws } = useDevice();

  const [ldrThreshold, setLdrThreshold] = useState<number | null>(null);

  const distance = ws.sensors?.distance_cm ?? null;
  const pirStatus = ws.sensors?.pir_detected ?? false;
  const light = ws.sensors?.ldr_value ?? null;

  const fetchConfig = useCallback(() => {
    apiFetch<ApiDeviceConfig>("/device/config")
      .then((data) => {
        const nextThreshold = normalizeLdrThreshold(data);
        setLdrThreshold(nextThreshold);
      })
      .catch(() => {
        setLdrThreshold(null);
      });
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  useEffect(() => {
    if (ws.lastMessage?.type !== "config_ack") return;
    fetchConfig();
  }, [fetchConfig, ws.lastMessage]);

  const lightStatus = useMemo(() => {
    if (light === null) return "Waiting Signal";
    if (ldrThreshold === null) return "Threshold Unknown";

    return light >= ldrThreshold ? "Cahaya Cukup" : "Cahaya Kurang";
  }, [light, ldrThreshold]);

  return (
    <div className="w-full max-w-100 border-2 bg-white">
      <h1 className="text-md border-b-2 bg-[#eeeeee] px-4 py-2 font-bold tracking-wide">
        LIVE TELEMETRY
      </h1>

      <div className="flex">
        <div className="flex flex-1 flex-col border-r-2">
          <div className="flex flex-col gap-1 border-b-2 px-4 pb-3 pt-10">
            <h1 className="text-6xl font-extrabold">
              {distance !== null ? distance.toFixed(1) : "--"}
            </h1>
            <p className="text-md font-bold text-black/45">Distance (cm)</p>
          </div>

          <div className="px-4 pb-3 pt-15 font-bold">
            <div className="flex items-center gap-2">
              <div
                className={`h-5 w-5 rounded-full border ${
                  pirStatus ? "bg-[#FDB833]" : "bg-black"
                }`}
              />
              <p className="text-xl">{pirStatus ? "Present" : "Away"}</p>
            </div>
            <p className="text-sm font-bold text-black/45">PIR Active</p>
          </div>
        </div>

        <div className="relative flex flex-1 flex-col justify-end p-4">
          <Image
            src="/black-logo.png"
            alt="black-logo"
            loading="eager"
            width={100}
            height={100}
            className="absolute right-0 top-0 h-53 w-36"
          />

          <p className="text-sm font-bold text-black/45">{lightStatus}</p>
          <p className="text-5xl font-extrabold tracking-tight">
            {light !== null ? light : "--"}
          </p>
          <p className="text-md font-bold text-black/45">
            Light (LDR)
            {/* {ldrThreshold !== null ? ` / Threshold ${ldrThreshold}` : ""} */}
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

import Image from "next/image";
import { useDevice } from "@/context/DeviceContext";

export default function SensorReadings() {
  const { ws } = useDevice();

  const distance = ws.sensors?.distance_cm ?? null;
  const pirStatus = ws.sensors?.pir_detected ?? false;
  const light = ws.sensors?.ldr_value ?? null;

  return (
    <div className="border-2 w-full max-w-100 bg-white">
      <h1 className="px-4 py-2 border-b-2 text-md font-bold bg-[#eeeeee] tracking-wide">
        LIVE TELEMETRY
      </h1>

      <div className="flex">
        <div className="flex flex-col border-r-2 flex-1">
          <div className="border-b-2 px-4 pb-3 pt-10 flex flex-col gap-1">
            <h1 className="font-extrabold text-6xl">
              {distance !== null ? distance.toFixed(1) : "--"}
            </h1>
            <p className="text-md font-bold text-black/45">Distance (cm)</p>
          </div>

          <div className="font-bold px-4 pb-3 pt-15">
            <div className="flex gap-2 items-center">
              <div
                className={`h-5 w-5 border rounded-full ${pirStatus ? "bg-[#FDB833]" : "bg-black"}`}
              />
              <p className="text-xl">{pirStatus ? "Present" : "Away"}</p>
            </div>
            <p className="text-sm font-bold text-black/45">PIR Active</p>
          </div>
        </div>

        <div className="relative flex-1 flex flex-col justify-end p-4">
          <Image
            src="/black-logo.png"
            alt="black-logo"
            loading="eager"
            width={100}
            height={100}
            className="absolute top-0 right-0 h-53 w-36"
          />
          <p className="text-sm font-bold text-black/45">Cahaya Cukup</p>
          <p className="text-5xl font-extrabold tracking-tight">
            {light !== null ? light : "--"}
          </p>
          <p className="text-md font-bold text-black/45">Light (LDR)</p>
        </div>
      </div>
    </div>
  );
}

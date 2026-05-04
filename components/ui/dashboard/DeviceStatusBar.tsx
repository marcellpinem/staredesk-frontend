"use client";

// frontend/components/ui/dashboard/DeviceStatusBar.tsx

import { useDevice } from "@/context/DeviceContext";

export default function DeviceStatusBar() {
  const { ws, configAcked } = useDevice();

  const isOnline = ws.device?.is_online ?? false;

  return (
    <div className="bg-[#f4f4f4] border-2 rounded-xs w-full flex justify-between md:hidden py-3 pl-3 pr-5 font-bold">
      <div className="flex items-center gap-2">
        <div
          className={`h-5 w-5 rounded-[5px] border ${
            isOnline ? "bg-[#FDB833]" : "bg-black"
          }`}
        />
        <h1>Device Status</h1>
      </div>

      <div className="flex items-center gap-3">
        {isOnline && (
          <span className="text-xs font-normal text-gray-500">
            {configAcked ? "" : "Config Pending..."}
          </span>
        )}
        <h1>{isOnline ? "ONLINE" : "OFFLINE"}</h1>
      </div>
    </div>
  );
}

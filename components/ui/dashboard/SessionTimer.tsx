"use client";

// frontend/components/ui/dashboard/SessionTimer.tsx

import { useDevice } from "@/context/DeviceContext";
import { formatDuration } from "@/hooks/useSession";
import Image from "next/image";

export default function SessionTimer() {
  const { session } = useDevice();

  const display = session.isActive
    ? formatDuration(session.durationSec)
    : "00:00:00";

  return (
    <div className="relative bg-black border-2 p-5 rounded-xs flex flex-col gap-6">
      <Image
        src="/clock.png"
        alt="clock"
        width={100}
        height={100}
        loading="eager"
        className="absolute right-0 bottom-0 h-26 w-26"
      />

      <h1 className="font-bold text-[#FDB833]">Current Session</h1>

      <div className="flex flex-col gap-1">
        <p className="text-white text-[45px] leading-none font-extrabold tracking-wide">
          {display}
        </p>
        <p className="text-white/70 font-semibold tracking-tight text-sm">
          {session.isActive ? "Active focus time" : "No active session"}
        </p>
      </div>
    </div>
  );
}

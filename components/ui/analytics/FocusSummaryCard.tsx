import { TrendingUp } from "lucide-react";
import Image from "next/image";

interface FocusSummaryCardProps {
  totalOptimalFocusTime: string;
  vsLastPeriod: string;
  totalSessions: number;
}

export default function FocusSummaryCard({
  totalOptimalFocusTime,
  vsLastPeriod,
  totalSessions,
}: FocusSummaryCardProps) {
  return (
    <div className="relative bg-black text-white rounded-xs px-5 py-3 flex flex-col gap-3">
      <h1 className="text-[#FDB833] font-bold ">Focus Summary</h1>

      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <p className="font-bold text-[43px] leading-none tracking-tight">
            {totalOptimalFocusTime}
          </p>
          <p className="text-sm font-semibold text-white/65">
            Total Optimal Focus Time
          </p>
        </div>

        <Image
          src="/hourglass.png"
          alt="hourglass"
          width={100}
          height={100}
          loading="eager"
          className="h-22 w-auto"
        />
      </div>

      <div className="border-t flex justify-between pt-5">
        <div className="flex flex-col gap-2">
          <h1 className="text-[#FDB833] font-bold text-xs">VS Last Period</h1>
          <p className="text-md font-semibold flex gap-2 items-center">
            <TrendingUp className="h-5 w-5 text-[#FDB833]" /> {vsLastPeriod}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <h1 className="text-[#FDB833] font-bold text-xs">Total Sessions</h1>
          <p className="text-md font-semibold">{totalSessions}</p>
        </div>
      </div>
    </div>
  );
}

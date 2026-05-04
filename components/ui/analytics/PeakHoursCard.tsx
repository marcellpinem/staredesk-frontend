import Image from "next/image";

interface PeakHour {
  time: string;
  duration: string;
}

interface Props {
  topPeakHour: PeakHour;
  peakHours: PeakHour[];
  period?: string;
}

export default function PeakHoursCard({
  topPeakHour,
  peakHours,
  period = "This Week",
}: Props) {
  return (
    <div className="relative bg-black text-white rounded-xs px-5 py-3 flex flex-col gap-3">
      <h1 className="text-[#FDB833] font-bold">Peak Hours</h1>

      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <p className="font-bold text-5xl leading-none tracking-tight">
            {topPeakHour.time}
          </p>
          <p className="text-sm font-semibold text-white/65">
            {topPeakHour.duration} Focus Time
          </p>
        </div>

        <Image
          src="/peak.png"
          alt="peak"
          width={100}
          height={100}
          loading="eager"
          className="h-22 w-auto"
        />
      </div>

      <div className="border-t flex justify-between pt-5">
        <div className="flex flex-col gap-2">
          <h1 className="text-[#FDB833] font-bold text-[13px] leading-none">
            Top 3 Peak Hours
          </h1>

          <div className="text-sm font-semibold tracking-wide">
            {peakHours.map((item) => (
              <p key={item.time}>
                {item.time} - {item.duration}
              </p>
            ))}
          </div>
        </div>

        <div className="flex items-end">
          <h1 className="text-[#FDB833] font-bold text-md">{period}</h1>
        </div>
      </div>
    </div>
  );
}

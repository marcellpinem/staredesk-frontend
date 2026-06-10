"use client";

type SegmentType =
  | "optimal"
  | "distracted"
  | "away"
  | "eyeStrain"
  | "postureRisk";

type Segment = {
  type: SegmentType;
  value: number;
};

type TimelineItem = {
  label: string;
  segments: Segment[];
};

type SessionTimelineProps = {
  className?: string;
};

const timelineData: TimelineItem[] = [
  {
    label: "08",
    segments: [
      { type: "optimal", value: 25 },
      { type: "postureRisk", value: 35 },
      { type: "eyeStrain", value: 15 },
    ],
  },
  {
    label: "09",
    segments: [
      { type: "distracted", value: 45 },
      { type: "optimal", value: 55 },
    ],
  },
  {
    label: "10",
    segments: [
      { type: "eyeStrain", value: 55 },
      { type: "optimal", value: 35 },
    ],
  },
  {
    label: "11",
    segments: [{ type: "optimal", value: 95 }],
  },
  {
    label: "12",
    segments: [
      { type: "optimal", value: 50 },
      { type: "away", value: 35 },
    ],
  },
  {
    label: "13",
    segments: [
      { type: "optimal", value: 70 },
      { type: "distracted", value: 55 },
    ],
  },
  {
    label: "14",
    segments: [
      { type: "away", value: 35 },
      { type: "optimal", value: 45 },
    ],
  },
  {
    label: "15",
    segments: [
      { type: "eyeStrain", value: 45 },
      { type: "optimal", value: 50 },
    ],
  },
  {
    label: "16",
    segments: [{ type: "distracted", value: 40 }],
  },
];

const segmentClass: Record<SegmentType, string> = {
  optimal: "bg-[#fdb834]",
  distracted: "bg-[#a6a6a6]",
  away: "bg-black",
  eyeStrain: "bg-[#dc9417]",
  postureRisk: "bg-[#fff200]",
};

const legend: { type: SegmentType; label: string }[] = [
  { type: "optimal", label: "Optimal" },
  { type: "distracted", label: "Distracted" },
  { type: "away", label: "Away" },
  { type: "eyeStrain", label: "Eye Strain Risk" },
  { type: "postureRisk", label: "Posture Risk" },
];

export function SessionTimeline({ className = "" }: SessionTimelineProps) {
  const maxTotal =
    Math.max(
      ...timelineData.map((item) =>
        item.segments.reduce((total, segment) => total + segment.value, 0),
      ),
    ) * 1.15;

  return (
    <section
      className={`w-full border bg-[#f7f7f7] p-4 sm:p-5 md:p-6 ${className}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-extrabold tracking-tight text-neutral-700">
          Session Timeline
        </h2>

        <div className="flex w-fit overflow-hidden rounded-md border-2 border-black text-[12px] font-extrabold tracking-widest">
          <button type="button" className="bg-[#fdb834] px-2.5 py-1.5 sm:px-2">
            HOURS
          </button>
          <button type="button" className="bg-white px-2.5 py-1.5 sm:px-2">
            MINUTES
          </button>
        </div>
      </div>

      <div className="mt-8 w-full overflow-x-auto pb-1">
        <div className="grid grid-cols-9 items-end gap-2 sm:min-w-0 sm:gap-3">
          {timelineData.map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-2">
              <div className="flex h-52.5 w-full flex-col-reverse gap-1.5 sm:h-52.5">
                {item.segments.map((segment, index) => {
                  const height = (segment.value / maxTotal) * 100;

                  return (
                    <div
                      key={`${item.label}-${segment.type}-${index}`}
                      className={`mx-auto w-[70%] min-w-6 max-w-12 border-2 border-black ${segmentClass[segment.type]}`}
                      style={{
                        height: `${height}%`,
                      }}
                    />
                  );
                })}
              </div>

              <div className="h-1.5 w-[70%] min-w-6 max-w-12 bg-black" />

              <span className="text-md font-extrabold text-neutral-700">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-x-5 gap-y-3">
        {legend.map((item) => (
          <div key={item.type} className="flex items-center gap-1.25">
            <span
              className={`h-4 w-4 rounded-md border border-black ${segmentClass[item.type]}`}
            />
            <span className="text-sm font-extrabold">{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

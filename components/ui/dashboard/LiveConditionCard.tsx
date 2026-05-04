"use client";

// frontend/components/ui/dashboard/LiveConditionCard.tsx

import { useDevice } from "@/context/DeviceContext";
import { type Condition } from "@/hooks/useWebSocket";
import Image from "next/image";

// ─── Config ───────────────────────────────────────────────────────────────────

const conditionConfig = {
  Away: {
    src: "/away-card.svg",
    label: "Away",
    desc: "Doing other stuff or sleeping?",
    style: "h-5 w-5 rounded-full border bg-black",
    font: "text-5xl md:text-5xl font-extrabold",
  },
  Distracted: {
    src: "/distracted-card.svg",
    label: "Distracted",
    desc: "Seems you're not focus?",
    style: "h-5 w-5 rounded-full border bg-[#929292]",
    font: "text-4xl md:text-5xl font-extrabold",
  },
  "Eye Strain": {
    src: "/eyestrain-card.svg",
    label: "Eye Strain Risk",
    desc: "Who turn the light's off?",
    style: "h-5 w-5 rounded-full border bg-[#F4B63E]",
    font: "text-2xl md:text-3xl font-extrabold",
  },
  "Posture Risk": {
    src: "/posturerisk-card.svg",
    label: "Posture Risk",
    desc: "Fix your posture dude!",
    style: "h-5 w-5 rounded-full border bg-[#F4B63E]",
    font: "text-2xl md:text-3xl font-extrabold",
  },
  Optimal: {
    src: "/optimal-card.png",
    label: "Optimal",
    desc: "Maintaining healthy alignment",
    style: "h-5 w-5 rounded-full border bg-[#F4B63E]",
    font: "text-5xl md:text-6xl font-extrabold",
  },
} as const;

type ConditionKey = keyof typeof conditionConfig;

// Map backend condition string → ConditionKey
const conditionMap: Record<Condition, ConditionKey> = {
  optimal: "Optimal",
  eye_strain_risk: "Eye Strain",
  posture_risk: "Posture Risk",
  distracted: "Distracted",
  away: "Away",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function LiveConditionCard() {
  const { ws } = useDevice();

  const conditionKey: ConditionKey = ws.condition
    ? conditionMap[ws.condition]
    : "Away";

  const config = conditionConfig[conditionKey];

  return (
    <div className="relative bg-white border-2 rounded-xs p-5 w-full flex flex-col gap-6">
      <Image
        src={config.src}
        alt={config.label}
        height={100}
        width={100}
        loading="eager"
        className="absolute right-0 bottom-0 h-30 w-30"
      />

      <h1 className="font-bold text-black/70">Current Condition</h1>

      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <div className={config.style} />
          <h1 className={config.font}>{config.label}</h1>
        </div>

        <p className="font-semibold text-md text-black/55">{config.desc}</p>
      </div>
    </div>
  );
}

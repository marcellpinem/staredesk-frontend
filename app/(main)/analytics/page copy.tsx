"use client";

import { Calendar, TrendingUp } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Cell, Pie, PieChart, Tooltip } from "recharts";

type Mode = "DAILY" | "WEEKLY" | "MONTHLY";

type Condition = {
  label: string;
  pct: number;
  time: string;
  color: string;
};

const data: Condition[] = [
  { label: "Optimal", pct: 50, time: "2h 50m", color: "#F5A623" },
  { label: "Distracted", pct: 20, time: "0h 34m", color: "#9B9B9B" },
  { label: "Eye Strain Risk", pct: 15, time: "0h 51m", color: "#C07D2E" },
  { label: "Posture Risk", pct: 15, time: "0h 51m", color: "#F5E642" },
];

export default function AnalyticsPage() {
  const [mode, setMode] = useState<Mode>("DAILY");
  const [singleDate, setSingleDate] = useState<Date | null>(null);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    null,
    null,
  ]);
  const [startDate, endDate] = dateRange;

  const tabClass = (m: Mode) =>
    `py-2 px-2.5 text-xs font-bold tracking-tight border-r last:border-r-0 transition-all duration-200 ease-in-out cursor-pointer ${
      mode === m ? "bg-[#fdb834]" : "hover:bg-[#fdb834]"
    }`;

  return (
    <div className="px-5 md:px-10 py-5 flex flex-col">
      <div>
        <h1 className="text-5xl font-extrabold tracking-wide">Analytics</h1>
        <p className="text-md text-black/65 mt-1">
          System monitoring and ergonomic analysis
        </p>
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-center gap-2 mt-3">
        <div className="flex border w-fit rounded-sm cursor-pointer overflow-hidden">
          {(["DAILY", "WEEKLY", "MONTHLY"] as Mode[]).map((m) => (
            <div key={m} className={tabClass(m)} onClick={() => setMode(m)}>
              {m}
            </div>
          ))}
        </div>

        <div className="relative flex-1">
          {mode === "DAILY" ? (
            <DatePicker
              selected={singleDate}
              onChange={(d: Date | null) => setSingleDate(d)}
              dateFormat="d MMMM yyyy"
              placeholderText="Pilih tanggal"
              className="border rounded-sm px-2.5 py-2 pl-9 text-xs font-bold tracking-tight focus:outline-none min-w-50"
            />
          ) : (
            <DatePicker
              selectsRange
              startDate={startDate}
              endDate={endDate}
              onChange={(dates) => setDateRange(dates)}
              dateFormat="d MMMM yyyy"
              placeholderText="Pilih rentang tanggal"
              className="border rounded-sm px-2.5 py-2 pl-9 text-xs font-bold tracking-tight focus:outline-none min-w-72.5"
            />
          )}
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black pointer-events-none" />
        </div>
      </div>

      <div className="mt-5 flex flex-col xl:flex-row gap-3">
        <div className="flex flex-col gap-3">
          <div className="px-5 py-3 w-100 bg-black text-white rounded-[10px]">
            <h1 className="text-[#FDB833] font-bold mb-2">Focus Summary</h1>

            <div className="flex items-center justify-between pb-3">
              <div>
                <h1 className="font-bold text-5xl tracking-tight">5h 40m</h1>
                <p className="text-sm font-semibold text-white/65 mt-1">
                  Total Optimal Focus Time
                </p>
              </div>
              <Image
                src="/hourglass.png"
                alt="hourglass"
                width={100}
                height={100}
                loading="eager"
                className="h-20 w-auto"
              />
            </div>

            <div className="border-t border-white/65 pt-3 flex justify-between">
              <div>
                <h1 className="text-[#FDB833] font-bold text-xs mb-1.5">
                  VS Last Period
                </h1>
                <p className="flex items-center gap-2.25">
                  <TrendingUp className="text-[#FDB833] h-5 w-5" />
                  <span className="text-sm font-semibold">+12% (45m)</span>
                </p>
              </div>

              <div className="flex flex-col items-end">
                <h1 className="text-[#FDB833] font-bold text-xs mb-1.5">
                  Total Sessions
                </h1>
                <p className="font-semibold text-sm">8</p>
              </div>
            </div>
          </div>

          <div className="px-5 py-3 w-100 bg-black text-white rounded-[10px]">
            <h1 className="text-[#FDB833] font-bold mb-2">Peak Hours</h1>

            <div className="flex items-center justify-between pb-3">
              <div>
                <h1 className="font-bold text-5xl tracking-tight">10:00</h1>
                <p className="text-sm font-semibold text-white/65 mt-1">
                  1hr 45m Focus time
                </p>
              </div>
              <Image
                src="/peak.png"
                alt="peak"
                width={100}
                height={100}
                loading="eager"
                className="h-20 w-auto"
              />
            </div>

            <div className="border-t border-white/65 pt-3 flex justify-between">
              <div>
                <h1 className="text-[#FDB833] font-bold text-xs mb-1.5">
                  Top 3 Peak Hours
                </h1>

                <div className="text-sm font-semibold">
                  <p>10:00 - 1h 45m</p>
                  <p>14:00 - 1h 20m</p>
                  <p>12:00 - 58m</p>
                </div>
              </div>

              <div className="flex items-end justify-end">
                <h1 className="text-[#FDB833] font-bold text-sm">This Week</h1>
              </div>
            </div>
          </div>

          <div className="px-5 py-3 w-100 border-2  rounded-[10px]">
            <h1 className="font-bold text-sm">Condition Breakdown</h1>

            <div className="flex items-center justify-center">
              <PieChart width={150} height={150}>
                <Pie
                  data={data}
                  cx={75}
                  cy={75}
                  outerRadius={70}
                  style={{
                    outline: "none",
                  }}
                  dataKey="pct"
                  strokeWidth={2}
                  stroke="#fff"
                  startAngle={90}
                  endAngle={-270}
                >
                  {data.map((entry, index) => {
                    return <Cell key={index} fill={entry.color} />;
                  })}
                </Pie>

                <Tooltip
                  formatter={(value) => [`${value}%`]}
                  contentStyle={{
                    borderRadius: 8,
                    border: "0.5px solid #e5e7eb",
                    fontSize: 13,
                    fontWeight: "bold",
                    color: "black",
                  }}
                />
              </PieChart>
            </div>

            <div className="flex flex-col mt-4">
              {data.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-2 font-bold text-black"
                >
                  <span
                    className="h-3.5 w-3.5 border shrink-0 rounded-sm"
                    style={{ backgroundColor: item.color }}
                  />

                  <span className="flex-1 text-sm ">{item.label}</span>

                  <span className="text-sm ">{item.pct}%</span>

                  <span className="w-17 text-right text-sm ">{item.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="border">RIGHT CONTENT</div>
      </div>
    </div>
  );
}

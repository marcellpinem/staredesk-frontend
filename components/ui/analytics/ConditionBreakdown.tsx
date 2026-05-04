import { Cell, Pie, PieChart, Tooltip } from "recharts";

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

export default function ConditionBreakdown() {
  return (
    <div className="border-2 rounded-xs px-5 py-3 bg-white">
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
              backgroundColor: "#222",
              fontSize: 13,
              fontWeight: "bold",
              color: "black",
            }}
          />
        </PieChart>
      </div>

      <div className="flex flex-col mt-2">
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
  );
}

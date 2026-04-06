import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, Sector } from "recharts";
import { useState } from "react";

const STATUS_LABELS: Record<string, string> = {
  pending: "منتظر",
  confirmed: "مؤكد",
  preparing: "قيد التحضير",
  ready: "جاهز",
  delivered: "تم التسليم",
  cancelled: "ملغي",
};

const COLORS = ["#f59e0b", "#3b82f6", "#8b5cf6", "#06b6d4", "#22c55e", "#ef4444"];

interface Props {
  data: { name: string; value: number }[];
}

export default function StatusDistribution({ data }: Props) {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const labeled = data.map((d) => ({
    ...d,
    label: STATUS_LABELS[d.name] || d.name,
    percent: total > 0 ? ((d.value / total) * 100).toFixed(1) : "0",
  }));

  const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, index }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 20;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text
        x={x}
        y={y}
        fill={COLORS[index % COLORS.length]}
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize={12}
        fontWeight={600}
      >
        {labeled[index].percent}%
      </text>
    );
  };

  const renderLegend = (props: any) => {
    const { payload } = props;
    return (
      <div className="flex flex-wrap justify-center gap-4 mt-2" dir="rtl">
        {payload.map((entry: any, i: number) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: entry.color }} />
            <span className="text-sm font-medium" style={{ color: entry.color }}>
              {labeled[i]?.label}
            </span>
            <span className="text-sm font-semibold" style={{ color: entry.color }}>
              ({labeled[i]?.value} طلب) {labeled[i]?.percent}%
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">توزيع حالات الطلبات</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">لا توجد بيانات</p>
        ) : (
          <div dir="ltr">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={labeled}
                  dataKey="value"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  outerRadius={65}
                  label={renderLabel}
                  labelLine={false}
                  activeIndex={activeIndex}
                  activeShape={({ cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill }: any) => (
                    <g>
                      <Sector
                        cx={cx}
                        cy={cy}
                        innerRadius={innerRadius}
                        outerRadius={outerRadius + 8}
                        startAngle={startAngle}
                        endAngle={endAngle}
                        fill={fill}
                        style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.25))", transition: "all 0.2s ease" }}
                      />
                    </g>
                  )}
                  onMouseEnter={(_, i) => setActiveIndex(i)}
                  onMouseLeave={() => setActiveIndex(undefined)}
                >
                  {labeled.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" className="cursor-pointer" />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div
                        className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg text-right"
                        dir="rtl"
                      >
                        <p className="font-semibold text-sm" style={{ color: payload[0].payload.fill || COLORS[0] }}>
                          {d.label}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {d.value} طلب — {d.percent}%
                        </p>
                      </div>
                    );
                  }}
                />
                <Legend content={renderLegend} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useMemo } from 'react';
import { calcYAxisWidth } from '@/lib/chartUtils';

interface Props {
  data: { hour: string; count: number }[];
}

export default function PeakHours({ data }: Props) {
  const hasData = data.some(d => d.count > 0);

  const yAxisWidth = useMemo(() => {
    const max = Math.max(0, ...data.map(d => d.count));
    return calcYAxisWidth(max);
  }, [data]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">أوقات الذروة</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <p className="text-center text-muted-foreground py-8">لا توجد بيانات</p>
        ) : (
          <div dir="ltr">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data} margin={{ left: 5, right: 5, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" fontSize={11} reversed={true} />
                <YAxis
                  orientation="right"
                  fontSize={12}
                  width={yAxisWidth}
                  tickMargin={8}
                  tick={{ direction: 'ltr' }}
                />
                <Tooltip formatter={(v: number) => [v, 'طلبات']} />
                <Bar dataKey="count" fill="hsl(271, 91%, 65%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

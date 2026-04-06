import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useMemo } from 'react';
import { calcYAxisWidth } from '@/lib/chartUtils';

interface Props {
  data: { date: string; revenue: number }[];
  isWeekly: boolean;
}

export default function RevenueChart({ data, isWeekly }: Props) {
  const formatted = data.map(d => ({
    ...d,
    label: format(new Date(d.date), isWeekly ? 'dd MMM' : 'dd/MM', { locale: ar }),
  }));

  const yAxisWidth = useMemo(() => {
    const max = Math.max(0, ...data.map(d => d.revenue));
    return calcYAxisWidth(max, v => v.toLocaleString('ar-EG'));
  }, [data]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">الإيرادات عبر الزمن</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">لا توجد بيانات</p>
        ) : (
          <div dir="ltr">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={formatted} margin={{ left: 5, right: 5, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" fontSize={12} reversed={true} />
                <YAxis
                  orientation="right"
                  fontSize={12}
                  width={yAxisWidth}
                  tickMargin={8}
                  tick={{ direction: 'ltr' }}
                />
                <Tooltip formatter={(v: number) => [`${v.toLocaleString('ar-EG')} ج.م`, 'الإيرادات']} />
                <Area type="monotone" dataKey="revenue" stroke="hsl(14, 88%, 35%)" fill="hsl(14, 88%, 35%)" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

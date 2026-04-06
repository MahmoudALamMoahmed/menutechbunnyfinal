import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useMemo } from 'react';
import { calcYAxisWidth } from '@/lib/chartUtils';

interface Props {
  data: { date: string; orders: number }[];
  isWeekly: boolean;
}

export default function OrdersChart({ data, isWeekly }: Props) {
  const formatted = data.map(d => ({
    ...d,
    label: format(new Date(d.date), isWeekly ? 'dd MMM' : 'dd/MM', { locale: ar }),
  }));

  const yAxisWidth = useMemo(() => {
    const max = Math.max(0, ...data.map(d => d.orders));
    return calcYAxisWidth(max);
  }, [data]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">عدد الطلبات عبر الزمن</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">لا توجد بيانات</p>
        ) : (
          <div dir="ltr">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={formatted} margin={{ left: 5, right: 5, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" fontSize={12} reversed={true} />
                <YAxis
                  orientation="right"
                  fontSize={12}
                  width={yAxisWidth}
                  tickMargin={8}
                  tick={{ direction: 'ltr' }}
                />
                <Tooltip formatter={(v: number) => [v, 'طلبات']} />
                <Bar dataKey="orders" fill="hsl(14, 88%, 55%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

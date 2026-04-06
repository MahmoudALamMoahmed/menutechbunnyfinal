import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface BranchData {
  branchId: string;
  orders: number;
  revenue: number;
}

interface Props {
  data: BranchData[];
  branches: { id: string; name: string }[];
}

export default function BranchPerformance({ data, branches }: Props) {
  if (branches.length <= 1) return null;

  const getName = (id: string) => branches.find(b => b.id === id)?.name || 'بدون فرع';

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">أداء الفروع</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">لا توجد بيانات</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الفرع</TableHead>
                <TableHead>الطلبات</TableHead>
                <TableHead>الإيرادات</TableHead>
                <TableHead>المتوسط</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.sort((a, b) => b.revenue - a.revenue).map(row => (
                <TableRow key={row.branchId}>
                  <TableCell className="font-medium">{getName(row.branchId)}</TableCell>
                  <TableCell>{row.orders}</TableCell>
                  <TableCell>{row.revenue.toLocaleString('ar-EG')} ج.م</TableCell>
                  <TableCell>{row.orders > 0 ? (row.revenue / row.orders).toFixed(1) : 0} ج.م</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

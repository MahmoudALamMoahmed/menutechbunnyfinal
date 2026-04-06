import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Props {
  data: { name: string; quantity: number; revenue: number }[];
}

export default function AllItemsTable({ data }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">جميع الأصناف المباعة ({data.length} صنف)</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">لا توجد بيانات</p>
        ) : (
          <div className="max-h-[400px] overflow-y-auto" dir="rtl">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>الصنف</TableHead>
                  <TableHead>الكمية</TableHead>
                  <TableHead>الإيرادات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item, i) => (
                  <TableRow key={item.name}>
                    <TableCell className="font-medium">{i + 1}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.revenue.toLocaleString('ar-EG')} ج.م</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <tfoot>
                <tr className="border-t-2 border-primary/30 bg-muted/50">
                  <td colSpan={3} className="p-4 font-bold text-right">الإجمالي</td>
                  <td className="p-4 font-bold">{data.reduce((sum, item) => sum + item.revenue, 0).toLocaleString('ar-EG')} ج.م</td>
                </tr>
              </tfoot>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

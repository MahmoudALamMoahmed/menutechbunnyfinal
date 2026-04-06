import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Phone, MapPin, Calendar, DollarSign, Building2, Truck, CreditCard, StickyNote, ShoppingBag } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Order = Tables<'orders'>;

interface OrderItemSize {
  id: string;
  name: string;
  price: number;
}

interface OrderItemExtra {
  id: string;
  name: string;
  price: number;
}

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
  size?: OrderItemSize;
  extras?: OrderItemExtra[];
}

interface OrderCardProps {
  order: Order;
  onUpdateStatus: (orderId: string, newStatus: string, isConfirmed?: boolean) => void;
  isUpdating?: boolean;
}

const STATUS_CONFIG: Record<string, { color: string; text: string }> = {
  pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', text: 'في الانتظار' },
  confirmed: { color: 'bg-blue-100 text-blue-800 border-blue-200', text: 'مؤكد' },
  preparing: { color: 'bg-purple-100 text-purple-800 border-purple-200', text: 'قيد التحضير' },
  ready: { color: 'bg-green-100 text-green-800 border-green-200', text: 'جاهز' },
  delivered: { color: 'bg-gray-100 text-gray-800 border-gray-200', text: 'تم التسليم' },
  cancelled: { color: 'bg-red-100 text-red-800 border-red-200', text: 'ملغي' },
};

function getOrderItems(order: Order): OrderItem[] {
  return Array.isArray(order.items) ? (order.items as unknown as OrderItem[]) : [];
}

function parseNotesInfo(notes: string | null): { branch?: string; area?: string; extra?: string } {
  if (!notes) return {};
  const branchMatch = notes.match(/الفرع:\s*([^-\n]+)/);
  const areaMatch = notes.match(/المنطقة:\s*([^-\n]+)/);
  const branch = branchMatch?.[1]?.trim();
  const area = areaMatch?.[1]?.trim();
  // Remaining text after removing branch/area info
  const extra = notes
    .replace(/الفرع:\s*[^-\n]+/g, '')
    .replace(/المنطقة:\s*[^-\n]+/g, '')
    .replace(/[-–]/g, '')
    .trim();
  return { branch, area, extra: extra || undefined };
}

function getPaymentText(method: string | null) {
  if (!method || method === 'cash') return 'الدفع عند الاستلام';
  return method;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString('ar-EG', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function OrderCard({ order, onUpdateStatus, isUpdating }: OrderCardProps) {
  const items = getOrderItems(order);
  const status = order.status ?? 'pending';
  const statusConfig = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const notesInfo = parseNotesInfo(order.notes);

  // Calculate items subtotal and delivery fee
  const itemsSubtotal = items.reduce((sum, item) => sum + item.total, 0);
  const deliveryFee = Number(order.total_price) - itemsSubtotal;

  return (
    <Card className="overflow-hidden border shadow-sm">
      {/* Header */}
      <CardHeader className="bg-muted/50 border-b px-5 py-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base font-bold">
              #{order.id.slice(0, 8).toUpperCase()}
            </CardTitle>
            <Badge className={`${statusConfig.color} border text-xs font-medium`}>
              {statusConfig.text}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" />
            {formatDate(order.created_at)}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Customer Info */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              معلومات العميل
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex gap-2">
                <span className="text-muted-foreground min-w-[50px]">الاسم:</span>
                <span className="font-medium">{order.customer_name}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-muted-foreground min-w-[50px]">الهاتف:</span>
                <a href={`tel:${order.customer_phone}`} dir="ltr" className="font-medium text-primary hover:underline">
                  {order.customer_phone}
                </a>
              </div>
              {order.customer_address && (
                <div className="flex gap-2">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <span>{order.customer_address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Delivery & Payment Info */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Truck className="w-4 h-4 text-muted-foreground" />
              معلومات التوصيل
            </h4>
            <div className="space-y-2 text-sm">
              {notesInfo.branch && (
                <div className="flex gap-2">
                  <Building2 className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <span>{notesInfo.branch}</span>
                </div>
              )}
              {notesInfo.area && (
                <div className="flex gap-2">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <span>{notesInfo.area}</span>
                </div>
              )}
              <div className="flex gap-2">
                <CreditCard className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <span>{getPaymentText(order.payment_method)}</span>
              </div>
              {notesInfo.extra && (
                <div className="flex gap-2">
                  <StickyNote className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">{notesInfo.extra}</span>
                </div>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-muted-foreground" />
              تفاصيل الطلب
            </h4>
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="bg-muted/40 rounded-lg p-2.5 text-sm">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <span className="font-medium">{item.name}</span>
                      {item.size && (
                        <span className="text-muted-foreground"> - {item.size.name}</span>
                      )}
                      <span className="text-muted-foreground mr-1"> x{item.quantity}</span>
                    </div>
                    <span className="font-semibold whitespace-nowrap">{item.total} جنيه</span>
                  </div>
                  {item.extras && item.extras.length > 0 && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      + {item.extras.map(e => `${e.name} (${e.price} جنيه)`).join('، ')}
                    </div>
                  )}
                </div>
              ))}

              <Separator />

              <div className="space-y-1 text-sm">
                {deliveryFee > 0 && (
                  <>
                    <div className="flex justify-between text-muted-foreground">
                      <span>مجموع الأصناف</span>
                      <span>{itemsSubtotal} جنيه</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>التوصيل</span>
                      <span>{deliveryFee} جنيه</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between font-bold text-base pt-1">
                  <span>الإجمالي</span>
                  <span className="text-primary">{order.total_price} جنيه</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {!['delivered', 'cancelled'].includes(status) && (
          <>
            <Separator />
            <div className="flex flex-wrap gap-2">
              {status === 'pending' && (
                <>
                  <Button size="sm" onClick={() => onUpdateStatus(order.id, 'confirmed', true)} disabled={isUpdating} className="bg-blue-600 hover:bg-blue-700">تأكيد الطلب</Button>
                  <Button size="sm" onClick={() => onUpdateStatus(order.id, 'cancelled')} disabled={isUpdating} variant="destructive">إلغاء الطلب</Button>
                </>
              )}
              {status === 'confirmed' && <Button size="sm" onClick={() => onUpdateStatus(order.id, 'preparing')} disabled={isUpdating} className="bg-purple-600 hover:bg-purple-700">بدء التحضير</Button>}
              {status === 'preparing' && <Button size="sm" onClick={() => onUpdateStatus(order.id, 'ready')} disabled={isUpdating} className="bg-green-600 hover:bg-green-700">الطلب جاهز</Button>}
              {status === 'ready' && <Button size="sm" onClick={() => onUpdateStatus(order.id, 'delivered')} disabled={isUpdating} className="bg-gray-600 hover:bg-gray-700">تم التسليم</Button>}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

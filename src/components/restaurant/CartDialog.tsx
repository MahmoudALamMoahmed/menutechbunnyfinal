import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingCart, Plus, Minus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PaymentMethodSection from '@/components/PaymentMethodSection';
import { supabase } from '@/integrations/supabase/client';
import type { CartItem } from '@/hooks/useCart';
import type { Tables } from '@/integrations/supabase/types';

type Branch = Tables<'branches'>;
type DeliveryArea = Tables<'delivery_areas'>;

interface CartDialogProps {
  cart: CartItem[];
  branches: Branch[];
  deliveryAreas: DeliveryArea[];
  getTotalPrice: () => number;
  addToCart: (item: any, size?: any, extras?: any[]) => void;
  removeFromCart: (itemId: string, sizeId?: string, extrasKey?: string) => void;
  clearCart: () => void;
  restaurant: { id: string; name: string; [key: string]: any };
  limits: any;
}

export default function CartDialog({
  cart, branches, deliveryAreas, getTotalPrice, addToCart, removeFromCart,
  clearCart, restaurant, limits,
}: CartDialogProps) {
  const { toast } = useToast();

  // All customer/order state lives here — not in Restaurant.tsx
  const [showCartDialog, setShowCartDialog] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');

  const getAreasForBranch = (branchId: string) => deliveryAreas.filter(a => a.branch_id === branchId);

  const getDeliveryPrice = () => {
    if (!selectedArea) return 0;
    return deliveryAreas.find(a => a.id === selectedArea)?.delivery_price || 0;
  };

  const getFinalTotal = () => getTotalPrice() + getDeliveryPrice();

  const getSelectedBranchOrderMode = (): string => {
    if (!selectedBranch) return 'whatsapp';
    const branch = branches.find(b => b.id === selectedBranch);
    return (branch as any)?.order_mode || 'whatsapp';
  };

  const resetOrderState = () => {
    clearCart();
    setShowCartDialog(false);
    setCustomerName('');
    setCustomerAddress('');
    setCustomerPhone('');
    setSelectedBranch('');
    setSelectedArea('');
    setPaymentMethod('cash');
  };

  const validateOrder = (): boolean => {
    if (cart.length === 0 || !customerName || !customerAddress || !customerPhone) return false;
    if (branches.length > 0 && !selectedBranch) {
      toast({ title: 'اختر الفرع', description: 'يرجى اختيار الفرع الذي تريد الطلب منه', variant: 'destructive' });
      return false;
    }
    if (selectedBranch && getAreasForBranch(selectedBranch).length > 0 && !selectedArea) {
      toast({ title: 'اختر المنطقة', description: 'يرجى اختيار منطقة التوصيل', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const buildOrderData = () => {
    const branch = branches.find(b => b.id === selectedBranch);
    const area = deliveryAreas.find(a => a.id === selectedArea);
    const orderItems = cart.map(item => ({
      id: item.id, name: item.name, price: item.price, quantity: item.quantity,
      total: item.price * item.quantity,
      size: item.selectedSize ? { id: item.selectedSize.id, name: item.selectedSize.name, price: item.selectedSize.price } : undefined,
      extras: item.selectedExtras?.map(e => ({ id: e.id, name: e.name, price: e.price })),
    }));
    return { branch, area, orderItems };
  };

  const sendOrderToDashboard = async () => {
    if (!validateOrder()) return;
    try {
      const { branch, area, orderItems } = buildOrderData();
      const { error } = await supabase.from('orders').insert({
        restaurant_id: restaurant.id, branch_id: selectedBranch || null, delivery_area_id: selectedArea || null,
        customer_name: customerName, customer_phone: customerPhone, customer_address: customerAddress,
        payment_method: paymentMethod, items: orderItems as any, total_price: getFinalTotal(),
        notes: area ? `المنطقة: ${area.name} - الفرع: ${branch?.name || ''}` : (branch?.name ? `الفرع: ${branch.name}` : null),
        status: 'pending',
      });
      if (error) throw error;
      resetOrderState();
      toast({ title: 'تم إرسال الطلب', description: 'تم إرسال طلبك بنجاح وسيتم التواصل معك قريباً' });
    } catch (error) {
      console.error('خطأ في إرسال الطلب:', error);
      toast({ title: 'خطأ', description: 'حدث خطأ في إرسال الطلب، يرجى المحاولة مرة أخرى', variant: 'destructive' });
    }
  };

  const sendOrderToWhatsApp = async () => {
    if (!validateOrder()) return;
    try {
      const { branch, area, orderItems } = buildOrderData();
      const totalPrice = getTotalPrice();
      const deliveryPrice = getDeliveryPrice();
      const finalTotal = getFinalTotal();
      const branchName = branch?.name || '';
      const areaName = area?.name || '';
      const whatsappNumber = branch?.whatsapp_phone || '';

      const hasDashboardOrders = limits?.features?.dashboard_orders;
      if (hasDashboardOrders) {
        await supabase.from('orders').insert({
          restaurant_id: restaurant.id, branch_id: selectedBranch || null, delivery_area_id: selectedArea || null,
          customer_name: customerName, customer_phone: customerPhone, customer_address: customerAddress,
          payment_method: paymentMethod, items: orderItems as any, total_price: finalTotal,
          notes: areaName ? `المنطقة: ${areaName} - الفرع: ${branchName || ''}` : (branchName ? `الفرع: ${branchName}` : null),
          status: 'pending', order_source: 'whatsapp',
        } as any);
      }

      const orderText = cart.map(item => {
        const sizeText = item.selectedSize ? ` (${item.selectedSize.name})` : '';
        const extrasText = item.selectedExtras?.length ? ` + ${item.selectedExtras.map(e => e.name).join(', ')}` : '';
        return `${item.quantity} - ${item.name}${sizeText}${extrasText} = ${item.price * item.quantity} جنيه`;
      }).join('\n');

      const branchText = branchName ? `\n🏪 الفرع: ${branchName}` : '';
      const areaText = areaName ? `\n📍 المنطقة: ${areaName}` : '';
      const deliveryText = deliveryPrice > 0 ? `\n🚗 سعر التوصيل: ${deliveryPrice} جنيه` : '';
      const paymentMethodText = paymentMethod === 'cash' ? 'الدفع عند الاستلام' : paymentMethod;
      const paymentNote = paymentMethod !== 'cash' ? '\n\n⏳ ملاحظة: العميل سيرسل إثبات الدفع بعد هذه الرسالة' : '';

      const message = `🛒 طلب جديد من ${restaurant.name}${branchText}${areaText}\n\n👤 بيانات العميل:\nالاسم: ${customerName}\nالعنوان: ${customerAddress}\nرقم الهاتف: ${customerPhone}\n\n📋 تفاصيل الطلب:\n${orderText}\n\n💰 إجمالي الطلب: ${totalPrice} جنيه${deliveryText}\n💵 الإجمالي الكلي: ${finalTotal} جنيه\n💳 طريقة الدفع: ${paymentMethodText}${paymentNote}\n\nالرجاء تأكيد استلام الطلب.\nشكراً لكم.`;
      window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');

      resetOrderState();
      toast({ title: 'تم إرسال الطلب', description: 'تم إرسال طلبك عبر واتساب بنجاح' });
    } catch (error) {
      console.error('خطأ عام:', error);
      toast({ title: 'خطأ', description: 'حدث خطأ في إرسال الطلب، يرجى المحاولة مرة أخرى', variant: 'destructive' });
    }
  };

  const orderMode = getSelectedBranchOrderMode();
  const isDisabled = cart.length === 0 || !customerName || !customerAddress || !customerPhone;

  return (
    <Dialog open={showCartDialog} onOpenChange={setShowCartDialog}>
      <DialogTrigger asChild>
        <button className={`relative flex flex-col items-center gap-0.5 text-xs transition ${showCartDialog ? "text-red-600 font-bold" : "text-gray-600"} hover:text-red-500`}>
          <ShoppingCart className="w-6 h-6" />
          سلة الطلبات
          <Badge className="absolute -top-1 -right-1 bg-primary text-white text-xs min-w-5 h-5 flex items-center justify-center rounded-full">
            {cart.length}
          </Badge>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md p-4 flex flex-col" dir="rtl">
        <DialogHeader>
          <DialogTitle>سلة الطلبات</DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 space-y-4 pr-2 pl-2 max-h-[calc(90vh-100px)]">
          {/* عناصر السلة */}
          <div className="space-y-2">
            {cart.map(item => {
              const extrasKey = item.selectedExtras?.map(e => e.id).sort().join(',') || '';
              return (
                <div key={`${item.id}-${item.selectedSize?.id || 'no-size'}-${extrasKey}`} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <div className="flex-1">
                    <div className="font-medium">
                      {item.name}
                      {item.selectedExtras && item.selectedExtras.length > 0 && (
                        <span className="text-xs text-primary mr-1">
                          + {item.selectedExtras.map(e => e.name).join(', ')}
                        </span>
                      )}
                    </div>
                    {item.selectedSize && <div className="text-xs text-gray-500">الحجم: {item.selectedSize.name}</div>}
                    <div className="text-sm text-gray-600">{item.price} جنيه × {item.quantity}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => removeFromCart(item.id, item.selectedSize?.id, extrasKey)}>
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="font-medium">{item.quantity}</span>
                    <Button size="sm" onClick={() => addToCart(item, item.selectedSize, item.selectedExtras)}>
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <Separator />

          {/* ملخص الأسعار */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>إجمالي الطلب:</span>
              <span>{getTotalPrice()} جنيه</span>
            </div>
            {getDeliveryPrice() > 0 && (
              <div className="flex justify-between text-sm text-primary">
                <span>سعر التوصيل:</span>
                <span>{getDeliveryPrice()} جنيه</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>الإجمالي الكلي:</span>
              <span>{getFinalTotal()} جنيه</span>
            </div>
          </div>

          <Separator />

          {/* بيانات التوصيل */}
          <div className="space-y-3">
            <h3 className="font-medium">بيانات التوصيل</h3>

            {branches.length > 0 && (
              <div>
                <Label htmlFor="branch">اختر الفرع</Label>
                <Select
                  value={selectedBranch}
                  onValueChange={(value) => {
                    setSelectedBranch(value);
                    setSelectedArea('');
                    setPaymentMethod('cash');
                  }}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="اختر الفرع الذي تريد الطلب منه" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {branches.map(branch => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name} {branch.address ? `- ${branch.address}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedBranch && getAreasForBranch(selectedBranch).length > 0 && (
              <div>
                <Label htmlFor="area">اختر منطقة التوصيل</Label>
                <Select value={selectedArea} onValueChange={setSelectedArea}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="اختر المنطقة" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {getAreasForBranch(selectedBranch).map(area => (
                      <SelectItem key={area.id} value={area.id}>
                        {area.name} - {area.delivery_price} جنيه توصيل
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedBranch && <PaymentMethodSection
              branchId={selectedBranch}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              finalTotal={getFinalTotal()}
              toast={toast}
            />}

            {/* بيانات العميل */}
            <div>
              <Label htmlFor="customerName">الاسم</Label>
              <Input id="customerName" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="اسمك الكريم" />
            </div>
            <div>
              <Label htmlFor="customerAddress">العنوان</Label>
              <Textarea id="customerAddress" value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} placeholder="عنوان التوصيل بالتفصيل" rows={2} />
            </div>
            <div>
              <Label htmlFor="customerPhone">رقم الهاتف</Label>
              <Input id="customerPhone" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="رقم هاتفك" />
            </div>

            {/* أزرار إرسال الطلب */}
            <div className="space-y-2">
              {orderMode === 'whatsapp' && (
                <Button onClick={sendOrderToWhatsApp} disabled={isDisabled} className="w-full bg-green-600 hover:bg-green-700">
                  إرسال الطلب واتساب
                </Button>
              )}
              {orderMode === 'dashboard' && (
                <Button onClick={sendOrderToDashboard} disabled={isDisabled} className="w-full">
                  إرسال الطلب للمطعم
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

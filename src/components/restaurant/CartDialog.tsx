import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingCart, Plus, Minus, Tag } from 'lucide-react';
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
  addToCart: (item: any, size?: any, extras?: any[], variant?: any) => void;
  removeFromCart: (itemId: string, sizeId?: string, variantId?: string, extrasKey?: string) => void;
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

  // نُرسل معرّفات وكميات فقط — كل الأسعار تُحسب في السيرفر داخل create_order
  const buildRpcItems = () =>
    cart.map(item => ({
      menu_item_id: item.offer_id ? null : item.id,
      offer_id: item.offer_id ?? null,
      size_id: item.selectedSize?.id ?? null,
      variant_id: item.selectedVariant?.id ?? null,
      extra_ids: item.selectedExtras?.map(e => e.id) ?? [],
      quantity: item.quantity,
    }));

  const ERROR_MESSAGES: Record<string, string> = {
    RESTAURANT_NOT_FOUND: 'المطعم غير موجود',
    INVALID_CUSTOMER_DATA: 'بيانات العميل غير صحيحة، تأكد من الاسم والعنوان ورقم الهاتف',
    INVALID_ORDER_SOURCE: 'مصدر الطلب غير صالح',
    BRANCH_REQUIRED: 'يرجى اختيار الفرع',
    INVALID_BRANCH: 'الفرع المختار غير متاح',
    DELIVERY_AREA_REQUIRED: 'يرجى اختيار منطقة التوصيل',
    INVALID_DELIVERY_AREA: 'منطقة التوصيل غير متاحة',
    INVALID_PAYMENT_METHOD: 'طريقة الدفع غير متاحة',
    EMPTY_CART: 'السلة فارغة',
    TOO_MANY_ITEMS: 'عدد الأصناف كبير جداً',
    RATE_LIMITED: 'لقد أرسلت طلبات كثيرة، يرجى المحاولة بعد قليل',
    INVALID_ITEM_REFERENCE: 'أحد الأصناف غير صالح',
    INVALID_QUANTITY: 'الكمية غير صحيحة',
    INVALID_MENU_ITEM: 'أحد الأصناف غير متاح حالياً',
    INVALID_OFFER: 'العرض غير متاح حالياً',
    INVALID_SIZE: 'الحجم المختار غير متاح',
    SIZE_REQUIRED: 'يرجى اختيار الحجم',
    INVALID_VARIANT: 'النوع المختار غير متاح',
    VARIANT_REQUIRED: 'يرجى اختيار النوع',
    INVALID_EXTRA: 'إحدى الإضافات غير متاحة',
    TOO_MANY_EXTRAS: 'عدد الإضافات كبير جداً',
    INVALID_PRICE: 'حدث خطأ في حساب السعر',
  };

  const translateError = (error: any): string => {
    const raw = (error?.message || '') as string;
    for (const code of Object.keys(ERROR_MESSAGES)) {
      if (raw.includes(code)) return ERROR_MESSAGES[code];
    }
    return 'حدث خطأ في إرسال الطلب، يرجى المحاولة مرة أخرى';
  };

  const submitOrder = async (orderSource: 'dashboard' | 'whatsapp') => {
    const { data, error } = await supabase.rpc('create_order', {
      p_restaurant_username: restaurant.username,
      p_branch_id: selectedBranch || null,
      p_delivery_area_id: selectedArea || null,
      p_customer_name: customerName,
      p_customer_phone: customerPhone,
      p_customer_address: customerAddress,
      p_payment_method: paymentMethod,
      p_order_source: orderSource,
      p_items: buildRpcItems() as any,
    } as any);
    if (error) throw error;
    return data as any;
  };

  const sendOrderToDashboard = async () => {
    if (!validateOrder()) return;
    try {
      await submitOrder('dashboard');
      resetOrderState();
      toast({ title: 'تم إرسال الطلب', description: 'تم إرسال طلبك بنجاح وسيتم التواصل معك قريباً' });
    } catch (error) {
      console.error('خطأ في إرسال الطلب:', error);
      toast({ title: 'خطأ', description: translateError(error), variant: 'destructive' });
    }
  };

  const sendOrderToWhatsApp = async () => {
    if (!validateOrder()) return;
    try {
      const result = await submitOrder('whatsapp');

      const branch = branches.find(b => b.id === selectedBranch);
      const whatsappNumber = branch?.whatsapp_phone || '';
      const branchName = result?.branch_name || '';
      const areaName = result?.area_name || '';
      const subtotal = Number(result?.subtotal ?? 0);
      const deliveryPrice = Number(result?.delivery_fee ?? 0);
      const finalTotal = Number(result?.total_price ?? 0);
      const serverItems: any[] = Array.isArray(result?.items) ? result.items : [];

      // نص الرسالة يُبنى من أرقام السيرفر فقط
      const orderText = serverItems.map(item => {
        const sizeText = item.size ? ` (${item.size.name})` : '';
        const variantText = item.variant ? ` 🏷️ ${item.variant.name}` : '';
        const extrasText = item.extras?.length ? ` + ${item.extras.map((e: any) => e.name).join(', ')}` : '';
        return `${item.quantity} - ${item.name}${sizeText}${variantText}${extrasText} = ${item.total} جنيه`;
      }).join('\n');

      const branchText = branchName ? `\n🏪 الفرع: ${branchName}` : '';
      const areaText = areaName ? `\n📍 المنطقة: ${areaName}` : '';
      const deliveryText = deliveryPrice > 0 ? `\n🚗 سعر التوصيل: ${deliveryPrice} جنيه` : '';
      const paymentMethodText = paymentMethod === 'cash' ? 'الدفع عند الاستلام' : paymentMethod;
      const paymentNote = paymentMethod !== 'cash' ? '\n\n⏳ ملاحظة: العميل سيرسل إثبات الدفع بعد هذه الرسالة' : '';

      const message = `🛒 طلب جديد من ${restaurant.name}${branchText}${areaText}\n\n👤 بيانات العميل:\nالاسم: ${customerName}\nالعنوان: ${customerAddress}\nرقم الهاتف: ${customerPhone}\n\n📋 تفاصيل الطلب:\n${orderText}\n\n💰 إجمالي الطلب: ${subtotal} جنيه${deliveryText}\n💵 الإجمالي الكلي: ${finalTotal} جنيه\n💳 طريقة الدفع: ${paymentMethodText}${paymentNote}\n\nالرجاء تأكيد استلام الطلب.\nشكراً لكم.`;
      window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');

      resetOrderState();
      toast({ title: 'تم إرسال الطلب', description: 'تم إرسال طلبك عبر واتساب بنجاح' });
    } catch (error) {
      console.error('خطأ عام:', error);
      toast({ title: 'خطأ', description: translateError(error), variant: 'destructive' });
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
                <div key={`${item.id}-${item.selectedSize?.id || 'no-size'}-${item.selectedVariant?.id || 'no-variant'}-${extrasKey}`} className="flex justify-between items-start p-2 bg-gray-50 rounded">
                  <div className="flex-1 space-y-1">
                    <div className="font-medium">
                      {item.name}
                      {item.selectedExtras && item.selectedExtras.length > 0 && (
                        <span className="text-xs text-primary mr-1">
                          + {item.selectedExtras.map(e => e.name).join(', ')}
                        </span>
                      )}
                    </div>
                    {item.selectedSize && <div className="text-xs text-gray-500">الحجم: {item.selectedSize.name}</div>}
                    {item.selectedVariant && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium bg-accent/40 text-accent-foreground border border-accent rounded-full px-2 py-0.5">
                        <Tag className="w-3 h-3" />
                        {item.selectedVariant.name}
                        {item.selectedVariant.price != null && item.selectedVariant.price > 0 && (
                          <span className="text-[10px] opacity-80">+{item.selectedVariant.price}ج</span>
                        )}
                      </span>
                    )}
                    <div className="text-sm text-gray-600">{item.price} جنيه × {item.quantity}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => removeFromCart(item.id, item.selectedSize?.id, item.selectedVariant?.id, extrasKey)}>
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="font-medium">{item.quantity}</span>
                    <Button size="sm" onClick={() => addToCart(item, item.selectedSize, item.selectedExtras, item.selectedVariant)}>
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

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy } from 'lucide-react';
import { useBranchPaymentMethods } from '@/hooks/useRestaurantData';

interface Props {
  branchId: string;
  paymentMethod: string;
  setPaymentMethod: (v: string) => void;
  finalTotal: number;
  toast: (opts: { title: string; description: string }) => void;
}

export default function PaymentMethodSection({ branchId, paymentMethod, setPaymentMethod, finalTotal, toast }: Props) {
  const { data: allPaymentMethods = [] } = useBranchPaymentMethods(branchId);
  const paymentMethods = allPaymentMethods.filter(pm => pm.is_active !== false);

  const selectedPm = paymentMethods.find(pm => pm.name === paymentMethod);

  return (
    <div className="space-y-3">
      <Label className="font-medium">طريقة الدفع</Label>
      <Select value={paymentMethod} onValueChange={setPaymentMethod}>
        <SelectTrigger className="bg-background">
          <SelectValue placeholder="اختر طريقة الدفع" />
        </SelectTrigger>
        <SelectContent className="bg-background z-50">
          <SelectItem value="cash">
            <span className="flex items-center gap-2">💵 الدفع عند الاستلام</span>
          </SelectItem>
          {paymentMethods.map(pm => (
            <SelectItem key={pm.id} value={pm.name}>
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 bg-primary rounded-full"></span>
                {pm.name}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* تعليمات الدفع الإلكتروني */}
      {paymentMethod !== 'cash' && selectedPm && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-center gap-2 text-lg font-bold text-amber-800">
            <span>{selectedPm.account_number}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-amber-700 hover:text-amber-900 hover:bg-amber-100"
              onClick={() => {
                navigator.clipboard.writeText(selectedPm.account_number);
                toast({ title: 'تم النسخ', description: 'تم نسخ الرقم بنجاح' });
              }}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <div className="text-center text-sm text-amber-700">
            <p className="font-medium">⚠️ تنبيه مهم:</p>
            <p>ارسل المبلغ ({finalTotal} جنيه) عبر {selectedPm.name} للرقم الظاهر أعلاه</p>
            <p>وخد اسكرين شوت لإثبات الدفع</p>
            <p className="mt-2 font-medium">واضغط على "إرسال الطلب"</p>
            <p>وبعد إرسال طلبك ارسل إثبات الدفع على الواتساب</p>
          </div>
        </div>
      )}
    </div>
  );
}

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Save, GripVertical, Trash2 } from 'lucide-react';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';

interface PaymentMethodItem {
  id?: string;
  name: string;
  account_number: string;
  is_active: boolean;
}

// مكون طريقة الدفع القابل للسحب
function SortablePaymentMethod({
  id, pm, index, onUpdate, onToggleActive, onDelete,
}: {
  id: string;
  pm: PaymentMethodItem;
  index: number;
  onUpdate: (i: number, field: 'name' | 'account_number', value: string) => void;
  onToggleActive: (i: number) => void;
  onDelete: (i: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <>
      <div ref={setNodeRef} style={style} className={`flex gap-3 items-start rounded-lg p-3 border ${pm.is_active ? 'bg-gray-50' : 'bg-gray-50 opacity-60'}`} dir="rtl">
        <button className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none mt-7 flex-shrink-0" {...attributes} {...listeners}>
          <GripVertical className="w-4 h-4" />
        </button>
        <div className="flex-1 space-y-2">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">اسم الطريقة</label>
            <Input value={pm.name} onChange={e => onUpdate(index, 'name', e.target.value)} placeholder="مثال: انستاباي" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">رقم الحساب</label>
            <Input value={pm.account_number} onChange={e => onUpdate(index, 'account_number', e.target.value)} placeholder="رقم الحساب أو المحفظة" />
          </div>
        </div>
        <div className="flex flex-col items-center gap-3 mt-6">
          <div className="flex flex-col items-center gap-1">
            <Switch checked={pm.is_active} onCheckedChange={() => onToggleActive(index)} />
            <span className="text-[10px] text-muted-foreground">{pm.is_active ? 'مفعّل' : 'معطّل'}</span>
          </div>
          <Button type="button" variant="destructive" size="sm" onClick={() => setShowDeleteConfirm(true)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <DeleteConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={() => { onDelete(index); setShowDeleteConfirm(false); }}
        title="حذف طريقة الدفع"
        description={`هل أنت متأكد من حذف "${pm.name || 'طريقة الدفع'}"؟ لا يمكن التراجع عن هذا الإجراء.`}
      />
    </>
  );
}

interface BranchFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingBranch: any;
  formData: {
    name: string; address: string; phone: string; whatsapp_phone: string;
    delivery_phone: string; working_hours: string; is_active: boolean; order_mode: string;
  };
  setFormData: (fn: (prev: any) => any) => void;
  branchPaymentMethods: PaymentMethodItem[];
  setBranchPaymentMethods: (fn: (prev: PaymentMethodItem[]) => PaymentMethodItem[]) => void;
  onSave: () => void;
  onReset: () => void;
  saving: boolean;
  features: { dashboard_orders?: boolean };
  sensors: any;
}

export default function BranchFormDialog({
  open, onOpenChange, editingBranch, formData, setFormData,
  branchPaymentMethods, setBranchPaymentMethods, onSave, onReset, saving, features, sensors,
}: BranchFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={o => { onOpenChange(o); if (!o) onReset(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>{editingBranch ? 'تعديل الفرع' : 'إضافة فرع جديد'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="branchName">اسم الفرع *</Label>
            <Input id="branchName" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="مثال: فرع المعادي" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="branchAddress">العنوان</Label>
            <Input id="branchAddress" value={formData.address} onChange={e => setFormData(p => ({ ...p, address: e.target.value }))} placeholder="العنوان التفصيلي" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="branchPhone">رقم الهاتف</Label>
              <Input id="branchPhone" value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} placeholder="01xxxxxxxxx" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="branchDeliveryPhone">رقم الدليفري</Label>
              <Input id="branchDeliveryPhone" value={formData.delivery_phone} onChange={e => setFormData(p => ({ ...p, delivery_phone: e.target.value }))} placeholder="01xxxxxxxxx" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="branchWhatsapp">رقم الواتساب</Label>
            <Input id="branchWhatsapp" value={formData.whatsapp_phone} onChange={e => setFormData(p => ({ ...p, whatsapp_phone: e.target.value }))} placeholder="01xxxxxxxxx" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="branchHours">مواعيد العمل</Label>
            <Input id="branchHours" value={formData.working_hours} onChange={e => setFormData(p => ({ ...p, working_hours: e.target.value }))} placeholder="يومياً من 9 ص إلى 11 م" />
          </div>

          {/* Order Mode */}
          <div className="space-y-2 border-t pt-4">
            <Label className="text-base font-semibold">طريقة استقبال الطلبات</Label>
            <Select value={!features.dashboard_orders ? 'whatsapp' : formData.order_mode} onValueChange={v => setFormData(p => ({ ...p, order_mode: v }))} disabled={!features.dashboard_orders}>
              <SelectTrigger><SelectValue placeholder="اختر طريقة استقبال الطلبات" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="whatsapp">واتساب فقط</SelectItem>
                <SelectItem value="dashboard" disabled={!features.dashboard_orders}>لوحة التحكم فقط</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {!features.dashboard_orders && '🔒 استقبال الطلبات عبر لوحة التحكم متاح في الباقات المدفوعة'}
              {features.dashboard_orders && formData.order_mode === 'whatsapp' && 'العميل يرسل الطلب عبر واتساب فقط'}
              {features.dashboard_orders && formData.order_mode === 'dashboard' && 'الطلبات تظهر في صفحة الطلبات بلوحة التحكم'}
            </p>
          </div>

          {/* Payment Methods */}
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">طرق الدفع الإلكترونية</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => setBranchPaymentMethods(p => [...p, { name: '', account_number: '', is_active: true }])}>
                <Plus className="w-4 h-4 ml-1" />
                إضافة
              </Button>
            </div>
            {branchPaymentMethods.length === 0 && <p className="text-sm text-muted-foreground text-center py-2">لم تتم إضافة طرق دفع بعد</p>}
            {branchPaymentMethods.length > 0 && (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(event: DragEndEvent) => {
                const { active, over } = event;
                if (over && active.id !== over.id) {
                  const oldIndex = branchPaymentMethods.findIndex((_, i) => `pm-${i}` === active.id);
                  const newIndex = branchPaymentMethods.findIndex((_, i) => `pm-${i}` === over.id);
                  setBranchPaymentMethods(prev => arrayMove(prev, oldIndex, newIndex));
                }
              }}>
                <SortableContext items={branchPaymentMethods.map((_, i) => `pm-${i}`)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {branchPaymentMethods.map((pm, index) => (
                      <SortablePaymentMethod
                        key={`pm-${index}`}
                        id={`pm-${index}`}
                        pm={pm}
                        index={index}
                        onUpdate={(idx, field, value) => {
                          const updated = [...branchPaymentMethods];
                          updated[idx] = { ...updated[idx], [field]: value };
                          setBranchPaymentMethods(() => updated);
                        }}
                        onToggleActive={idx => {
                          const updated = [...branchPaymentMethods];
                          updated[idx] = { ...updated[idx], is_active: !updated[idx].is_active };
                          setBranchPaymentMethods(() => updated);
                        }}
                        onDelete={idx => setBranchPaymentMethods(prev => prev.filter((_, i) => i !== idx))}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={formData.is_active} onCheckedChange={checked => setFormData(p => ({ ...p, is_active: checked }))} />
            <Label>الفرع نشط</Label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => { onOpenChange(false); onReset(); }}>إلغاء</Button>
            <Button onClick={onSave} disabled={saving}>
              {saving ? (
                <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>جاري الحفظ...</>
              ) : (
                <><Save className="w-4 h-4 ml-2" />{editingBranch ? 'تحديث' : 'إضافة'}</>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

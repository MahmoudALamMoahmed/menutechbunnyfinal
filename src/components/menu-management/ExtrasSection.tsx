import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SortableItem } from '@/components/SortableItem';
import { Edit, Trash2, Save, Cookie } from 'lucide-react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Tables } from '@/integrations/supabase/types';

type Extra = Tables<'extras'>;

interface ExtrasSectionProps {
  extras: Extra[];
  frozenExtraIds: Set<string>;
  extraLimits: { canAdd: boolean; usageText: string };
  sensors: any;
  saving: boolean;
  onSave: (data: { id?: string; name: string; price: number; display_order: number }) => void;
  onDelete: (id: string, name: string) => void;
  onDragEnd: (event: DragEndEvent) => void;
}

export default function ExtrasSection({
  extras, frozenExtraIds, extraLimits, sensors, saving,
  onSave, onDelete, onDragEnd,
}: ExtrasSectionProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<Extra | null>(null);
  const [form, setForm] = useState({ name: '', price: '', display_order: 0 });

  const handleSave = () => {
    if (!form.name.trim() || !form.price) return;
    onSave({ id: editing?.id, name: form.name, price: parseFloat(form.price), display_order: form.display_order });
    setForm({ name: '', price: '', display_order: 0 });
    setEditing(null);
  };

  return (
    <>
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>إدارة الإضافات</CardTitle>
              <CardDescription>أضف إضافات اختيارية للوجبات (جبنة إضافية، صوص، إلخ)</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{extraLimits.usageText}</span>
              <Button onClick={() => setShowDialog(true)}>
                <Cookie className="w-4 h-4 ml-2" />
                إدارة الإضافات
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {extras.map(extra => (
              <div key={extra.id} className={`flex items-center gap-2 bg-muted px-3 py-2 rounded-lg ${frozenExtraIds.has(extra.id) ? 'opacity-50' : ''}`}>
                <span className="font-medium">{extra.name}</span>
                <span className="text-sm text-green-600">+{extra.price} ج.م</span>
                {frozenExtraIds.has(extra.id) && <Badge variant="secondary" className="text-xs">🔒</Badge>}
              </div>
            ))}
            {extras.length === 0 && <p className="text-gray-500">لا توجد إضافات بعد</p>}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>إدارة الإضافات</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
              <div>
                <Label htmlFor="extraName">اسم الإضافة</Label>
                <Input id="extraName" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="مثال: جبنة موتزاريلا، صوص حار" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="extraPrice">السعر الإضافي</Label>
                  <Input id="extraPrice" type="number" step="0.01" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} placeholder="0.00" />
                </div>
                <div>
                  <Label htmlFor="extraOrder">ترتيب العرض</Label>
                  <Input id="extraOrder" type="number" value={form.display_order} onChange={e => setForm(p => ({ ...p, display_order: parseInt(e.target.value) || 0 }))} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="w-4 h-4 ml-2" />
                  {editing ? 'تحديث' : 'حفظ'}
                </Button>
                <Button variant="outline" onClick={() => { setForm({ name: '', price: '', display_order: 0 }); setEditing(null); }}>إلغاء</Button>
              </div>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={extras.map(e => e.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {extras.map(extra => (
                    <SortableItem key={extra.id} id={extra.id}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{extra.name}</p>
                          <p className="text-sm text-green-600">+{extra.price} ج.م</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => {
                            setEditing(extra);
                            setForm({ name: extra.name, price: extra.price.toString(), display_order: extra.display_order });
                          }}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => onDelete(extra.id, extra.name)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </SortableItem>
                  ))}
                  {extras.length === 0 && <p className="text-gray-500 text-center py-4">لا توجد إضافات بعد</p>}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

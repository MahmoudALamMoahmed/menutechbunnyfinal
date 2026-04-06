import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Save, Edit2, Trash2, Navigation, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Tables } from '@/integrations/supabase/types';

type DeliveryArea = Tables<'delivery_areas'>;
type Branch = Tables<'branches'>;

// مكون عنصر منطقة التوصيل القابل للسحب
function SortableAreaItem({ area, onEdit, onDelete }: { area: DeliveryArea; onEdit: (a: DeliveryArea) => void; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: area.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border" dir="rtl">
      <div className="flex items-center gap-2">
        <button className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none" {...attributes} {...listeners}>
          <GripVertical className="w-4 h-4" />
        </button>
        <div>
          <span className="font-medium">{area.name}</span>
          <span className="text-primary mr-2">({area.delivery_price} جنيه)</span>
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => onEdit(area)}><Edit2 className="w-3 h-3" /></Button>
        <Button variant="destructive" size="sm" onClick={() => onDelete(area.id)}><Trash2 className="w-3 h-3" /></Button>
      </div>
    </div>
  );
}

interface DeliveryAreasDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedBranch: Branch | null;
  areas: DeliveryArea[];
  sensors: any;
  saving: boolean;
  onSave: (data: { id?: string; branch_id: string; name: string; delivery_price: number; display_order?: number }) => void;
  onDelete: (id: string) => void;
  onDragEnd: (event: DragEndEvent) => void;
}

export default function DeliveryAreasDialog({
  open, onOpenChange, selectedBranch, areas, sensors, saving, onSave, onDelete, onDragEnd,
}: DeliveryAreasDialogProps) {
  const [form, setForm] = useState({ name: '', delivery_price: 0 });
  const [editing, setEditing] = useState<DeliveryArea | null>(null);

  const branchAreas = areas.filter(a => a.branch_id === selectedBranch?.id);

  const handleSave = () => {
    if (!selectedBranch || !form.name.trim()) return;
    onSave({
      id: editing?.id,
      branch_id: selectedBranch.id,
      name: form.name,
      delivery_price: form.delivery_price,
      display_order: editing ? undefined : branchAreas.length,
    });
    setForm({ name: '', delivery_price: 0 });
    setEditing(null);
  };

  return (
    <Dialog open={open} onOpenChange={o => { onOpenChange(o); if (!o) { setForm({ name: '', delivery_price: 0 }); setEditing(null); } }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>مناطق التوصيل - {selectedBranch?.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="areaName">اسم المنطقة</Label>
                <Input id="areaName" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="مثال: المعادي" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="areaPrice">سعر التوصيل</Label>
                <Input id="areaPrice" type="number" value={form.delivery_price} onChange={e => setForm(p => ({ ...p, delivery_price: parseFloat(e.target.value) || 0 }))} placeholder="0" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} disabled={saving}>
                <Save className="w-4 h-4 ml-1" />
                {editing ? 'تحديث' : 'إضافة'}
              </Button>
              {editing && <Button size="sm" variant="outline" onClick={() => { setForm({ name: '', delivery_price: 0 }); setEditing(null); }}>إلغاء</Button>}
            </div>
          </div>

          {selectedBranch && (
            <ScrollArea className="max-h-[400px]">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                <SortableContext items={branchAreas.map(a => a.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {branchAreas.map(area => (
                      <SortableAreaItem key={area.id} area={area} onEdit={a => { setEditing(a); setForm({ name: a.name, delivery_price: a.delivery_price }); }} onDelete={onDelete} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
              {branchAreas.length === 0 && (
                <div className="text-center py-8">
                  <Navigation className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">لا توجد مناطق توصيل بعد</p>
                </div>
              )}
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

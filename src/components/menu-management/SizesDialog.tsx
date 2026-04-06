import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Edit, Trash2, Save } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Size = Tables<'sizes'>;

interface SizesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedItemId: string | null;
  sizes: Size[];
  saving: boolean;
  onSave: (data: { id?: string; menu_item_id: string; name: string; price: number; display_order: number }) => void;
  onDelete: (id: string, name: string) => void;
}

export default function SizesDialog({ open, onOpenChange, selectedItemId, sizes, saving, onSave, onDelete }: SizesDialogProps) {
  const [form, setForm] = useState({ name: '', price: '', display_order: 0 });
  const [editing, setEditing] = useState<Size | null>(null);

  const itemSizes = sizes.filter(s => s.menu_item_id === selectedItemId);

  const handleSave = () => {
    if (!selectedItemId || !form.name.trim() || !form.price) return;
    onSave({
      id: editing?.id,
      menu_item_id: selectedItemId,
      name: form.name,
      price: parseFloat(form.price),
      display_order: form.display_order,
    });
    setForm({ name: '', price: '', display_order: 0 });
    setEditing(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>إدارة الأحجام</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <div>
              <Label htmlFor="sizeName">اسم الحجم</Label>
              <Input id="sizeName" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="مثال: صغير، وسط، كبير" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sizePrice">السعر</Label>
                <Input id="sizePrice" type="number" step="0.01" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} placeholder="0.00" />
              </div>
              <div>
                <Label htmlFor="sizeOrder">ترتيب العرض</Label>
                <Input id="sizeOrder" type="number" value={form.display_order} onChange={e => setForm(p => ({ ...p, display_order: parseInt(e.target.value) || 0 }))} />
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

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {itemSizes.map(size => (
              <div key={size.id} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                <div>
                  <p className="font-medium">{size.name}</p>
                  <p className="text-sm text-gray-500">{size.price} ج.م</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => { setEditing(size); setForm({ name: size.name, price: size.price.toString(), display_order: size.display_order }); }}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onDelete(size.id, size.name)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            {itemSizes.length === 0 && <p className="text-gray-500 text-center py-4">لا توجد أحجام مضافة بعد</p>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

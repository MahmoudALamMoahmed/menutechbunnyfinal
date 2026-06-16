import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Edit, Trash2, Save, Ruler, Tag } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Size = Tables<'sizes'>;
type Variant = Tables<'item_variants'>;

interface SaveSizePayload { id?: string; menu_item_id: string; name: string; price: number; display_order: number }
interface SaveVariantPayload { id?: string; menu_item_id: string; name: string; price: number | null; display_order: number }

interface SizesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedItemId: string | null;
  sizes: Size[];
  variants: Variant[];
  saving: boolean;
  onSaveSize: (data: SaveSizePayload) => void;
  onDeleteSize: (id: string, name: string) => void;
  onSaveVariant: (data: SaveVariantPayload) => void;
  onDeleteVariant: (id: string, name: string) => void;
}

/** نموذج موحّد لإدارة الأحجام/الأنواع — يقلّل التكرار ويحافظ على clean code. */
function OptionForm<T extends { id: string; name: string; price: number | null; display_order: number | null }>({
  items,
  saving,
  priceOptional,
  emptyText,
  pricePlaceholder,
  onSave,
  onDelete,
}: {
  items: T[];
  saving: boolean;
  priceOptional: boolean;
  emptyText: string;
  pricePlaceholder: string;
  onSave: (payload: { id?: string; name: string; price: number | null; display_order: number }) => void;
  onDelete: (id: string, name: string) => void;
}) {
  const [form, setForm] = useState({ name: '', price: '', display_order: 0 });
  const [editing, setEditing] = useState<T | null>(null);

  const reset = () => { setForm({ name: '', price: '', display_order: 0 }); setEditing(null); };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (!priceOptional && !form.price) return;
    onSave({
      id: editing?.id,
      name: form.name.trim(),
      price: form.price ? parseFloat(form.price) : (priceOptional ? null : 0),
      display_order: form.display_order,
    });
    reset();
  };

  const startEdit = (item: T) => {
    setEditing(item);
    setForm({ name: item.name, price: item.price != null ? String(item.price) : '', display_order: item.display_order ?? 0 });
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-lg space-y-4">
        <div>
          <Label htmlFor="opt-name">الاسم</Label>
          <Input id="opt-name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="مثال: صغير، وسط، كبير" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="opt-price">
              السعر {priceOptional && <span className="text-xs text-muted-foreground">(اختياري)</span>}
            </Label>
            <Input id="opt-price" type="number" step="0.01" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} placeholder={pricePlaceholder} />
          </div>
          <div>
            <Label htmlFor="opt-order">ترتيب العرض</Label>
            <Input id="opt-order" type="number" value={form.display_order} onChange={e => setForm(p => ({ ...p, display_order: parseInt(e.target.value) || 0 }))} />
          </div>
        </div>
        {priceOptional && (
          <p className="text-xs text-muted-foreground">اتركه فارغاً إذا لم يكن للنوع سعر إضافي.</p>
        )}
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 ml-2" />
            {editing ? 'تحديث' : 'حفظ'}
          </Button>
          <Button variant="outline" onClick={reset}>إلغاء</Button>
        </div>
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {items.map(item => (
          <div key={item.id} className="flex items-center justify-between p-3 bg-background border rounded-lg">
            <div>
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-muted-foreground">
                {item.price != null ? `${item.price} ج.م` : 'بدون سعر إضافي'}
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => startEdit(item)}>
                <Edit className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => onDelete(item.id, item.name)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-muted-foreground text-center py-4">{emptyText}</p>}
      </div>
    </div>
  );
}


export default function SizesDialog({
  open, onOpenChange, selectedItemId, sizes, variants, saving,
  onSaveSize, onDeleteSize, onSaveVariant, onDeleteVariant,
}: SizesDialogProps) {
  const itemSizes = sizes.filter(s => s.menu_item_id === selectedItemId);
  const itemVariants = variants.filter(v => v.menu_item_id === selectedItemId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>إدارة الأحجام والأنواع</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="sizes" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sizes" className="flex items-center gap-2">
              <Ruler className="w-4 h-4" />
              الأحجام
            </TabsTrigger>
            <TabsTrigger value="variants" className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              الأنواع
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sizes" className="mt-4">
            <OptionForm
              items={itemSizes}
              saving={saving}
              priceOptional={false}
              emptyText="لا توجد أحجام مضافة بعد"
              pricePlaceholder="0.00"
              onSave={({ id, name, price, display_order }) => {
                if (!selectedItemId) return;
                onSaveSize({ id, menu_item_id: selectedItemId, name, price: price ?? 0, display_order });
              }}
              onDelete={onDeleteSize}
            />
          </TabsContent>

          <TabsContent value="variants" className="mt-4">
            <OptionForm
              items={itemVariants}
              saving={saving}
              priceOptional
              emptyText="لا توجد أنواع مضافة بعد"
              pricePlaceholder="اختياري"
              onSave={({ id, name, price, display_order }) => {
                if (!selectedItemId) return;
                onSaveVariant({ id, menu_item_id: selectedItemId, name, price, display_order });
              }}
              onDelete={onDeleteVariant}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

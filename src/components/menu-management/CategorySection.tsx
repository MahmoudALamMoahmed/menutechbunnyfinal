import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { SortableItem } from '@/components/SortableItem';
import { Plus, Edit, Trash2, Save } from 'lucide-react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Tables } from '@/integrations/supabase/types';

type Category = Tables<'categories'>;

interface CategorySectionProps {
  categories: Category[];
  frozenCategoryIds: Set<string>;
  catLimits: { canAdd: boolean; usageText: string };
  sensors: any;
  saving: boolean;
  onSave: (data: { id?: string; name: string; display_order: number }) => void;
  onDelete: (id: string, name: string) => void;
  onDragEnd: (event: DragEndEvent) => void;
}

export default function CategorySection({
  categories, frozenCategoryIds, catLimits, sensors, saving,
  onSave, onDelete, onDragEnd,
}: CategorySectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: '', display_order: 0 });

  const handleSave = () => {
    if (!form.name.trim()) return;
    onSave({ id: editing?.id, name: form.name, display_order: form.display_order });
    setForm({ name: '', display_order: 0 });
    setShowForm(false);
    setEditing(null);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>إدارة الفئات</CardTitle>
            <CardDescription>أضف وعدل فئات القائمة</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{catLimits.usageText}</span>
            <Button
              onClick={() => setShowForm(!showForm)}
              disabled={!catLimits.canAdd}
              title={!catLimits.canAdd ? 'وصلت للحد الأقصى - قم بترقية باقتك' : ''}
            >
              <Plus className="w-4 h-4 ml-2" />
              {catLimits.canAdd ? 'إضافة فئة' : 'الحد الأقصى'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <div>
              <Label htmlFor="categoryName">اسم الفئة</Label>
              <Input id="categoryName" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="مثال: المقبلات" />
            </div>
            <div>
              <Label htmlFor="categoryOrder">ترتيب العرض</Label>
              <Input id="categoryOrder" type="number" value={form.display_order} onChange={e => setForm(p => ({ ...p, display_order: parseInt(e.target.value) || 0 }))} />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving}>
                <Save className="w-4 h-4 ml-2" />
                {editing ? 'تحديث' : 'حفظ'}
              </Button>
              <Button variant="outline" onClick={() => { setShowForm(false); setEditing(null); setForm({ name: '', display_order: 0 }); }}>
                إلغاء
              </Button>
            </div>
          </div>
        )}

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={categories.map(c => c.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {categories.map(category => {
                const isFrozen = frozenCategoryIds.has(category.id);
                return (
                  <SortableItem key={category.id} id={category.id}>
                    <div className={`flex items-center justify-between ${isFrozen ? 'opacity-50' : ''}`}>
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="font-medium">{category.name}</p>
                          <p className="text-sm text-muted-foreground">ترتيب: {category.display_order}</p>
                        </div>
                        {isFrozen && <Badge variant="secondary" className="text-xs">🔒 مجمّد</Badge>}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" disabled={isFrozen} onClick={() => {
                          setEditing(category);
                          setForm({ name: category.name, display_order: category.display_order });
                          setShowForm(true);
                        }}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" disabled={isFrozen} onClick={() => onDelete(category.id, category.name)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </SortableItem>
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      </CardContent>
    </Card>
  );
}

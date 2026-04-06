import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SortableItem } from '@/components/SortableItem';
import ImageUploader from '@/components/ImageUploader';
import { getMenuItemPublicId } from '@/lib/bunny';
import { Plus, Edit, Trash2, Save, Ruler, Search } from 'lucide-react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Tables } from '@/integrations/supabase/types';

type Category = Tables<'categories'>;
type MenuItem = Tables<'menu_items'>;

interface MenuItemsSectionProps {
  menuItems: MenuItem[];
  categories: Category[];
  frozenItemIds: Set<string>;
  itemLimits: { canAdd: boolean; usageText: string };
  sensors: any;
  saving: boolean;
  restaurantUsername: string;
  onSave: (data: any) => void;
  onDelete: (id: string, name: string) => void;
  onOpenSizes: (itemId: string) => void;
  onDragEnd: (event: DragEndEvent) => void;
}

export default function MenuItemsSection({
  menuItems, categories, frozenItemIds, itemLimits, sensors, saving,
  restaurantUsername, onSave, onDelete, onOpenSizes, onDragEnd,
}: MenuItemsSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [tempItemId, setTempItemId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const [form, setForm] = useState({
    name: '', description: '', price: '', category_id: '',
    image_url: '', image_public_id: '', is_available: true, display_order: 0,
  });

  const resetForm = () => {
    setForm({ name: '', description: '', price: '', category_id: '', image_url: '', image_public_id: '', is_available: true, display_order: 0 });
    setEditing(null);
    setTempItemId(null);
    setShowForm(false);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.price) return;
    onSave({
      id: editing?.id,
      name: form.name,
      description: form.description || null,
      price: parseFloat(form.price),
      category_id: form.category_id || null,
      image_url: form.image_url || null,
      image_public_id: form.image_public_id || null,
      is_available: form.is_available,
      display_order: form.display_order,
    });
    resetForm();
  };

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || (categoryFilter === 'none' && !item.category_id) || item.category_id === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>إدارة الأصناف</CardTitle>
            <CardDescription>أضف وعدل أصناف القائمة</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{itemLimits.usageText}</span>
            <Button onClick={() => { setShowForm(!showForm); if (!showForm) setTempItemId(crypto.randomUUID()); }} disabled={!itemLimits.canAdd} title={!itemLimits.canAdd ? 'وصلت للحد الأقصى - قم بترقية باقتك' : ''}>
              <Plus className="w-4 h-4 ml-2" />
              {itemLimits.canAdd ? 'إضافة صنف' : 'الحد الأقصى'}
            </Button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="ابحث عن صنف..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pr-9 h-9 text-sm" />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[180px] h-9">
              <SelectValue placeholder="جميع الفئات" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الفئات</SelectItem>
              <SelectItem value="none">بدون فئة</SelectItem>
              {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <div>
              <Label htmlFor="itemName">اسم الصنف</Label>
              <Input id="itemName" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="مثال: شاورما لحم" />
            </div>
            <div>
              <Label htmlFor="itemDescription">الوصف</Label>
              <Textarea id="itemDescription" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="وصف الصنف..." rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="itemPrice">السعر</Label>
                <Input id="itemPrice" type="number" step="0.01" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} placeholder="0.00" />
              </div>
              <div>
                <Label htmlFor="itemCategory">الفئة</Label>
                <Select value={form.category_id} onValueChange={v => setForm(p => ({ ...p, category_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="اختر فئة" /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {(editing || tempItemId) && (
              <ImageUploader
                label="صورة الصنف"
                currentImageUrl={form.image_url}
                currentPublicId={form.image_public_id}
                publicId={getMenuItemPublicId(restaurantUsername, editing?.id || tempItemId!)}
                aspectRatio="square"
                imageType="product"
                onUploadComplete={(url, publicId) => setForm(p => ({ ...p, image_url: url, image_public_id: publicId }))}
                onDelete={() => setForm(p => ({ ...p, image_url: '', image_public_id: '' }))}
              />
            )}
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving}>
                <Save className="w-4 h-4 ml-2" />
                {editing ? 'تحديث' : 'حفظ'}
              </Button>
              <Button variant="outline" onClick={resetForm}>إلغاء</Button>
            </div>
          </div>
        )}

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={filteredItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredItems.map(item => {
                const isFrozen = frozenItemIds.has(item.id);
                return (
                  <SortableItem key={item.id} id={item.id}>
                    <div className={`flex items-center justify-between ${isFrozen ? 'opacity-50' : ''}`}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{item.name}</p>
                          {isFrozen && <Badge variant="secondary" className="text-xs">🔒 مجمّد</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                        <p className="text-sm font-bold text-green-600">{item.price} ج.م</p>
                        <p className="text-xs text-muted-foreground">
                          {item.category_id ? categories.find(c => c.id === item.category_id)?.name : 'بدون فئة'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => onOpenSizes(item.id)} title="إدارة الأحجام" disabled={isFrozen}>
                          <Ruler className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" disabled={isFrozen} onClick={() => {
                          setEditing(item);
                          setTempItemId(null);
                          setForm({
                            name: item.name, description: item.description || '', price: item.price.toString(),
                            category_id: item.category_id || '', image_url: item.image_url || '',
                            image_public_id: item.image_public_id || '', is_available: item.is_available,
                            display_order: item.display_order,
                          });
                          setShowForm(true);
                        }}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" disabled={isFrozen} onClick={() => onDelete(item.id, item.name)}>
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

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SortableItem } from '@/components/SortableItem';
import ImageUploader from '@/components/ImageUploader';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, Edit, Trash2, Save, Sparkles } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';
import type { SaveOfferData } from '@/hooks/admin-mutations/useOfferMutations';

type Offer = Tables<'offers'>;
type MenuItem = Tables<'menu_items'>;

interface OffersSectionProps {
  offers: Offer[];
  menuItems: MenuItem[];
  sensors: any;
  saving: boolean;
  restaurantId: string;
  restaurantUsername: string;
  onSave: (data: SaveOfferData) => void;
  onDelete: (id: string, title: string, imagePublicId?: string | null) => void;
  onDragEnd: (event: DragEndEvent) => void;
}

interface OfferForm {
  title: string;
  description: string;
  price: string;
  original_price: string;
  menu_item_id: string;
  image_url: string;
  image_public_id: string;
  is_active: boolean;
  display_order: number;
}

const EMPTY_FORM: OfferForm = {
  title: '', description: '', price: '', original_price: '',
  menu_item_id: '', image_url: '', image_public_id: '',
  is_active: true, display_order: 0,
};

const NO_LINK_VALUE = '__none__';

export default function OffersSection({
  offers, menuItems, sensors, saving, restaurantId, restaurantUsername,
  onSave, onDelete, onDragEnd,
}: OffersSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Offer | null>(null);
  const [tempOfferId, setTempOfferId] = useState<string | null>(null);
  const [form, setForm] = useState<OfferForm>(EMPTY_FORM);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditing(null);
    setTempOfferId(null);
    setShowForm(false);
  };

  const handleSave = () => {
    if (!form.title.trim() || !form.price) return;
    onSave({
      id: editing?.id,
      restaurant_id: restaurantId,
      title: form.title,
      description: form.description || null,
      image_url: form.image_url || null,
      image_public_id: form.image_public_id || null,
      price: parseFloat(form.price),
      original_price: form.original_price ? parseFloat(form.original_price) : null,
      menu_item_id: form.menu_item_id || null,
      is_active: form.is_active,
      display_order: form.display_order,
    });
    resetForm();
  };

  const startEdit = (offer: Offer) => {
    setEditing(offer);
    setTempOfferId(null);
    setForm({
      title: offer.title,
      description: offer.description || '',
      price: offer.price.toString(),
      original_price: offer.original_price?.toString() || '',
      menu_item_id: offer.menu_item_id || '',
      image_url: offer.image_url || '',
      image_public_id: offer.image_public_id || '',
      is_active: offer.is_active,
      display_order: offer.display_order,
    });
    setShowForm(true);
  };

  const offerImagePublicId = `restaurants/${restaurantUsername}/offers/${editing?.id || tempOfferId || 'new'}`;

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              إدارة العروض
            </CardTitle>
            <CardDescription>أضف عروضاً مميزة</CardDescription>
          </div>
          <Button onClick={() => {
            if (showForm) { resetForm(); return; }
            setShowForm(true);
            setTempOfferId(crypto.randomUUID());
          }}>
            <Plus className="w-4 h-4 ml-2" />
            {showForm ? 'إلغاء' : 'إضافة عرض'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {showForm && (
          <div className="bg-muted/40 p-4 rounded-lg space-y-4 border">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="offerTitle">عنوان العرض</Label>
                <Input id="offerTitle" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="مثال: عرض العائلة، خصم الجمعة" />
              </div>
              <div>
                <Label htmlFor="offerLink">ربط بصنف موجود (اختياري)</Label>
                <Select
                  value={form.menu_item_id || NO_LINK_VALUE}
                  onValueChange={v => setForm(p => ({ ...p, menu_item_id: v === NO_LINK_VALUE ? '' : v }))}
                >
                  <SelectTrigger><SelectValue placeholder="عرض مستقل" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_LINK_VALUE}>عرض مستقل (بدون ربط)</SelectItem>
                    {menuItems.map(mi => (
                      <SelectItem key={mi.id} value={mi.id}>{mi.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="offerDescription">الوصف</Label>
              <Textarea id="offerDescription" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="وصف مختصر للعرض..." rows={2} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="offerPrice">سعر العرض</Label>
                <Input id="offerPrice" type="number" step="0.01" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} placeholder="0.00" />
              </div>
              <div>
                <Label htmlFor="offerOriginalPrice">السعر قبل الخصم (اختياري)</Label>
                <Input id="offerOriginalPrice" type="number" step="0.01" value={form.original_price} onChange={e => setForm(p => ({ ...p, original_price: e.target.value }))} placeholder="للشطب فقط" />
              </div>
              <div>
                <Label htmlFor="offerOrder">ترتيب العرض</Label>
                <Input id="offerOrder" type="number" value={form.display_order} onChange={e => setForm(p => ({ ...p, display_order: parseInt(e.target.value) || 0 }))} />
              </div>
            </div>

            <ImageUploader
              label="صورة العرض"
              currentImageUrl={form.image_url}
              currentPublicId={form.image_public_id}
              publicId={offerImagePublicId}
              aspectRatio="square"
              imageType="product"
              onUploadComplete={(url, publicId) => setForm(p => ({ ...p, image_url: url, image_public_id: publicId }))}
              onDelete={() => setForm(p => ({ ...p, image_url: '', image_public_id: '' }))}
            />

            <div className="flex items-center gap-3">
              <Switch id="offerActive" checked={form.is_active} onCheckedChange={v => setForm(p => ({ ...p, is_active: v }))} />
              <Label htmlFor="offerActive">العرض مفعل</Label>
            </div>

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
          <SortableContext items={offers.map(o => o.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {offers.map(offer => (
                <SortableItem key={offer.id} id={offer.id}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {offer.image_url && (
                        <img src={offer.image_url} alt={offer.title} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" loading="lazy" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium truncate">{offer.title}</p>
                          {!offer.is_active && <Badge variant="secondary" className="text-xs">معطّل</Badge>}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-sm">
                          {offer.original_price && (
                            <span className="text-muted-foreground line-through">{offer.original_price}</span>
                          )}
                          <span className="font-bold text-primary">{offer.price} ج.م</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button size="sm" variant="outline" onClick={() => startEdit(offer)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => onDelete(offer.id, offer.title, offer.image_public_id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </SortableItem>
              ))}
              {offers.length === 0 && <p className="text-muted-foreground text-center py-6">لا توجد عروض بعد. أضف أول عرض ليظهر للزبائن.</p>}
            </div>
          </SortableContext>
        </DndContext>
      </CardContent>
    </Card>
  );
}

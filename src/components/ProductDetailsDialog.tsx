import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Plus, Minus, Tag } from 'lucide-react';
import { getMenuItemUrl } from '@/lib/bunny';

import type { Tables } from '@/integrations/supabase/types';

type MenuItem = Tables<'menu_items'>;
type Size = Tables<'sizes'>;
type Variant = Tables<'item_variants'>;
type Extra = Tables<'extras'>;

interface ProductDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: MenuItem | null;
  sizes: Size[];
  variants: Variant[];
  extras: Extra[];
  onAddToCart: (item: MenuItem, selectedSize?: Size, selectedExtras?: Extra[], selectedVariant?: Variant) => void;
}

export default function ProductDetailsDialog({
  open,
  onOpenChange,
  item,
  sizes,
  variants,
  extras,
  onAddToCart,
}: ProductDetailsDialogProps) {
  const [selectedSize, setSelectedSize] = useState<Size | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [selectedExtras, setSelectedExtras] = useState<Extra[]>([]);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (open) {
      setSelectedSize(null);
      setSelectedVariant(null);
      setSelectedExtras([]);
      setQuantity(1);
    }
  }, [open, item?.id]);

  if (!item) return null;

  const itemSizes = sizes.filter(size => size.menu_item_id === item.id);
  const itemVariants = variants.filter(v => v.menu_item_id === item.id);
  const hasMultipleSizes = itemSizes.length > 0;
  const hasVariants = itemVariants.length > 0;
  const hasExtras = extras.length > 0;

  const handleExtraToggle = (extra: Extra, checked: boolean) => {
    setSelectedExtras(prev => checked ? [...prev, extra] : prev.filter(e => e.id !== extra.id));
  };

  const handleAddToCart = () => {
    if (hasMultipleSizes && !selectedSize) return;
    if (hasVariants && !selectedVariant) return;

    for (let i = 0; i < quantity; i++) {
      onAddToCart(
        item,
        selectedSize || undefined,
        selectedExtras.length > 0 ? selectedExtras : undefined,
        selectedVariant || undefined,
      );
    }
    onOpenChange(false);
  };

  const getBasePrice = () => (selectedSize ? selectedSize.price : item.price);
  const getVariantPrice = () => selectedVariant?.price ?? 0;
  const getExtrasTotal = () => selectedExtras.reduce((total, extra) => total + extra.price, 0);
  const getCurrentPrice = () => getBasePrice() + getVariantPrice() + getExtrasTotal();

  const increaseQuantity = () => setQuantity(prev => prev + 1);
  const decreaseQuantity = () => setQuantity(prev => Math.max(1, prev - 1));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>تفاصيل المنتج</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {item.image_url && (
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
              <img src={getMenuItemUrl(item.image_url, 'large')} alt={item.name} className="w-full h-full object-contain" />
            </div>
          )}

          <h3 className="text-xl font-bold text-gray-800">{item.name}</h3>
          {item.description && <p className="text-gray-600 text-sm">{item.description}</p>}

          {/* الأحجام */}
          {hasMultipleSizes && (
            <div className="space-y-3">
              <p className="text-sm font-medium">اختر الحجم :</p>
              <RadioGroup
                value={selectedSize?.id || ""}
                onValueChange={sizeId => setSelectedSize(itemSizes.find(s => s.id === sizeId) || null)}
                className="grid grid-cols-3 gap-3"
              >
                {itemSizes.map(size => (
                  <Label
                    key={size.id}
                    htmlFor={size.id}
                    className={`relative p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 text-center ${
                      selectedSize?.id === size.id
                        ? 'border-primary bg-primary/5 shadow-md'
                        : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
                    }`}
                  >
                    <RadioGroupItem value={size.id} id={size.id} className="absolute top-2 right-2 w-5 h-5" />
                    <div className="space-y-2">
                      <div className="font-semibold text-gray-800">{size.name}</div>
                      <div className="text-primary font-bold text-lg">{size.price} جنيه</div>
                    </div>
                  </Label>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* الأنواع */}
          {hasVariants && (
            <div className="space-y-3">
              <p className="text-sm font-medium flex items-center gap-2">
                <Tag className="w-4 h-4 text-accent-foreground" />
                اختر النوع :
              </p>
              <RadioGroup
                value={selectedVariant?.id || ""}
                onValueChange={vid => setSelectedVariant(itemVariants.find(v => v.id === vid) || null)}
                className="grid grid-cols-2 gap-2"
              >
                {itemVariants.map(variant => {
                  const active = selectedVariant?.id === variant.id;
                  return (
                    <Label
                      key={variant.id}
                      htmlFor={`variant-${variant.id}`}
                      className={`relative flex items-center gap-2 p-3 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                        active
                          ? 'border-accent-foreground bg-accent/40 shadow-sm'
                          : 'border-gray-200 hover:border-accent-foreground/40 hover:bg-accent/20'
                      }`}
                    >
                      <RadioGroupItem value={variant.id} id={`variant-${variant.id}`} className="w-4 h-4" />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{variant.name}</div>
                        {variant.price != null && variant.price > 0 && (
                          <div className="text-green-600 text-xs">+{variant.price} جنيه</div>
                        )}
                      </div>
                    </Label>
                  );
                })}
              </RadioGroup>
            </div>
          )}

          {/* الإضافات */}
          {hasExtras && (
            <div className="space-y-3">
              <p className="text-sm font-medium">إضافات اختيارية :</p>
              <div className="grid grid-cols-2 gap-2">
                {extras.map(extra => (
                  <Label
                    key={extra.id}
                    htmlFor={`extra-${extra.id}`}
                    className={`flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                      selectedExtras.some(e => e.id === extra.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
                    }`}
                  >
                    <Checkbox
                      id={`extra-${extra.id}`}
                      checked={selectedExtras.some(e => e.id === extra.id)}
                      onCheckedChange={(checked) => handleExtraToggle(extra, checked as boolean)}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{extra.name}</div>
                      <div className="text-green-600 text-sm">+{extra.price} جنيه</div>
                    </div>
                  </Label>
                ))}
              </div>
            </div>
          )}

          {/* الكمية */}
          <div className="flex items-center justify-center">
            <p className="text-sm font-medium ml-2">الكمية :</p>
            <div className="flex items-center justify-center space-x-4 space-x-reverse">
              <Button variant="outline" size="icon" onClick={decreaseQuantity} disabled={quantity <= 1}>
                <Minus className="w-4 h-4" />
              </Button>
              <span className="text-lg font-bold min-w-[40px] text-center">{quantity}</span>
              <Button variant="outline" size="icon" onClick={increaseQuantity}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* السعر الإجمالي */}
          <div className="text-center">
            <div className="text-sm text-gray-600">السعر الإجمالي :</div>
            <div className="text-2xl font-bold text-primary">
              {getCurrentPrice() * quantity} جنيه
            </div>
          </div>

          <Button
            onClick={handleAddToCart}
            className="w-full"
            disabled={(hasMultipleSizes && !selectedSize) || (hasVariants && !selectedVariant)}
          >
            <Plus className="w-4 h-4 ml-2" />
            إضافة إلى السلة ({quantity})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

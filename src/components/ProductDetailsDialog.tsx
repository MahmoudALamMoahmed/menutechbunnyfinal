import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Plus, Minus } from 'lucide-react';
import { getMenuItemUrl } from '@/lib/bunny';

import type { Tables } from '@/integrations/supabase/types';

type MenuItem = Tables<'menu_items'>;
type Size = Tables<'sizes'>;
type Extra = Tables<'extras'>;

interface ProductDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: MenuItem | null;
  sizes: Size[];
  extras: Extra[];
  onAddToCart: (item: MenuItem, selectedSize?: Size, selectedExtras?: Extra[]) => void;
}

export default function ProductDetailsDialog({
  open,
  onOpenChange,
  item,
  sizes,
  extras,
  onAddToCart
}: ProductDetailsDialogProps) {
  // UI State - الحجم المختار، الإضافات المختارة، الكمية
  const [selectedSize, setSelectedSize] = useState<Size | null>(null);
  const [selectedExtras, setSelectedExtras] = useState<Extra[]>([]);
  const [quantity, setQuantity] = useState(1);

  // Side Effect - إعادة تعيين الاختيارات عند فتح الحوار بمنتج جديد
  useEffect(() => {
    if (open) {
      setSelectedSize(null);
      setSelectedExtras([]);
      setQuantity(1);
    }
  }, [open, item?.id]);

  if (!item) return null;

  const itemSizes = sizes.filter(size => size.menu_item_id === item.id);
  const hasMultipleSizes = itemSizes.length > 0;
  const hasExtras = extras.length > 0;

  const handleExtraToggle = (extra: Extra, checked: boolean) => {
    if (checked) {
      setSelectedExtras(prev => [...prev, extra]);
    } else {
      setSelectedExtras(prev => prev.filter(e => e.id !== extra.id));
    }
  };

  const handleAddToCart = () => {
    if (hasMultipleSizes && !selectedSize) {
      return;
    }

    for (let i = 0; i < quantity; i++) {
      onAddToCart(item, selectedSize || undefined, selectedExtras.length > 0 ? selectedExtras : undefined);
    }
    onOpenChange(false);
    setSelectedSize(null);
    setSelectedExtras([]);
    setQuantity(1);
  };

  const getBasePrice = () => {
    return selectedSize ? selectedSize.price : item.price;
  };

  const getExtrasTotal = () => {
    return selectedExtras.reduce((total, extra) => total + extra.price, 0);
  };

  const getCurrentPrice = () => {
    return getBasePrice() + getExtrasTotal();
  };

  const increaseQuantity = () => {
    setQuantity(prev => prev + 1);
  };

  const decreaseQuantity = () => {
    setQuantity(prev => Math.max(1, prev - 1));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>تفاصيل المنتج</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* صورة المنتج */}
          {item.image_url && (
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
              <img src={getMenuItemUrl(item.image_url, 'large')} alt={item.name} className="w-full h-full object-contain" />
            </div>
          )}
          
          {/* اسم المنتج */}
          <h3 className="text-xl font-bold text-gray-800">{item.name}</h3>
          
          {/* وصف المنتج */}
          {item.description && <p className="text-gray-600 text-sm">{item.description}</p>}
          
          {/* الأحجام المتاحة */}
          {hasMultipleSizes && (
            <div className="space-y-3">
              <p className="text-sm font-medium">اختر الحجم :</p>
              <RadioGroup 
                value={selectedSize?.id || ""} 
                onValueChange={sizeId => {
                  const size = itemSizes.find(s => s.id === sizeId);
                  setSelectedSize(size || null);
                }} 
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
            {selectedExtras.length > 0 && (
              <div className="text-xs text-gray-500">
                ({getBasePrice()} + {getExtrasTotal()} إضافات)
              </div>
            )}
            <div className="text-2xl font-bold text-primary">
              {getCurrentPrice() * quantity} جنيه
            </div>
          </div>
          
          {/* زر الإضافة */}
          <Button onClick={handleAddToCart} className="w-full" disabled={hasMultipleSizes && !selectedSize}>
            <Plus className="w-4 h-4 ml-2" />
            إضافة إلى السلة ({quantity})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
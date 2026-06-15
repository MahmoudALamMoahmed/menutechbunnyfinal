import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

// تعريف الأنواع من Supabase + واجهة السلة
type MenuItem = Tables<'menu_items'>;
type Size = Tables<'sizes'>;
type Variant = Tables<'item_variants'>;
type Extra = Tables<'extras'>;

export interface CartItem extends MenuItem {
  quantity: number;
  selectedSize?: Size;
  selectedVariant?: Variant;
  selectedExtras?: Extra[];
  is_offer?: boolean;
}

// مفتاح فريد لتمييز عناصر السلة (يشمل النوع والحجم والإضافات)
const getCartKey = (itemId: string, sizeId?: string, variantId?: string, extras?: Extra[]) => {
  const extrasKey = extras?.map(e => e.id).sort().join(',') || '';
  return `${itemId}-${sizeId || 'no-size'}-${variantId || 'no-variant'}-${extrasKey}`;
};

// مطابقة آمنة بين عناصر السلة بالاعتماد على نفس مفتاح الفرادة
const sameLine = (
  ci: CartItem,
  itemId: string,
  sizeId?: string,
  variantId?: string,
  extrasKey?: string,
) =>
  ci.id === itemId &&
  (ci.selectedSize?.id || undefined) === sizeId &&
  (ci.selectedVariant?.id || undefined) === variantId &&
  (ci.selectedExtras?.map(e => e.id).sort().join(',') || '') === (extrasKey || '');

export function useCart() {
  const { toast } = useToast();
  const [cart, setCart] = useState<CartItem[]>([]);

  // إضافة صنف للسلة مع دعم الأحجام والأنواع والإضافات
  const addToCart = useCallback((item: MenuItem, selectedSize?: Size, selectedExtras?: Extra[], selectedVariant?: Variant) => {
    const extrasTotal = selectedExtras?.reduce((sum, e) => sum + e.price, 0) || 0;
    const basePrice = selectedSize ? selectedSize.price : item.price;
    const variantPrice = selectedVariant?.price ?? 0;
    const cartItem: CartItem = {
      ...item,
      selectedSize,
      selectedVariant,
      selectedExtras,
      price: basePrice + variantPrice + extrasTotal,
      quantity: 1,
    };

    setCart(prev => {
      const extrasKey = selectedExtras?.map(e => e.id).sort().join(',') || '';
      const existing = prev.find(ci => sameLine(ci, item.id, selectedSize?.id, selectedVariant?.id, extrasKey));
      if (existing) {
        return prev.map(ci => sameLine(ci, item.id, selectedSize?.id, selectedVariant?.id, extrasKey)
          ? { ...ci, quantity: ci.quantity + 1 } : ci);
      }
      return [...prev, cartItem];
    });

    const sizeText = selectedSize ? ` - ${selectedSize.name}` : '';
    const variantText = selectedVariant ? ` (${selectedVariant.name})` : '';
    const extrasText = selectedExtras?.length ? ` + ${selectedExtras.map(e => e.name).join(', ')}` : '';
    toast({
      title: 'تم إضافة العنصر',
      description: `تم إضافة ${item.name}${sizeText}${variantText}${extrasText} إلى السلة`,
    });
  }, [toast]);

  // حذف/تقليل كمية صنف من السلة
  const removeFromCart = useCallback((itemId: string, sizeId?: string, variantId?: string, extrasKey?: string) => {
    setCart(prev => {
      const existing = prev.find(ci => sameLine(ci, itemId, sizeId, variantId, extrasKey));
      if (existing && existing.quantity > 1) {
        return prev.map(ci => sameLine(ci, itemId, sizeId, variantId, extrasKey)
          ? { ...ci, quantity: ci.quantity - 1 } : ci);
      }
      return prev.filter(ci => !sameLine(ci, itemId, sizeId, variantId, extrasKey));
    });
  }, []);

  const getTotalPrice = useCallback(
    () => cart.reduce((total, item) => total + item.price * item.quantity, 0),
    [cart],
  );

  const clearCart = useCallback(() => setCart([]), []);

  return { cart, addToCart, removeFromCart, getTotalPrice, clearCart, getCartKey };
}

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

// تعريف الأنواع من Supabase + واجهة السلة
type MenuItem = Tables<'menu_items'>;
type Size = Tables<'sizes'>;
type Extra = Tables<'extras'>;

export interface CartItem extends MenuItem {
  quantity: number;
  selectedSize?: Size;
  selectedExtras?: Extra[];
}

// مفتاح فريد لتمييز عناصر السلة
const getCartKey = (itemId: string, sizeId?: string, extras?: Extra[]) => {
  const extrasKey = extras?.map(e => e.id).sort().join(',') || '';
  return `${itemId}-${sizeId || 'no-size'}-${extrasKey}`;
};

export function useCart() {
  const { toast } = useToast();
  const [cart, setCart] = useState<CartItem[]>([]);

  // دالة إضافة صنف للسلة مع دعم الأحجام والإضافات
  const addToCart = useCallback((item: MenuItem, selectedSize?: Size, selectedExtras?: Extra[]) => {
    const extrasTotal = selectedExtras?.reduce((sum, e) => sum + e.price, 0) || 0;
    const basePrice = selectedSize ? selectedSize.price : item.price;
    const cartItem = {
      ...item,
      selectedSize,
      selectedExtras,
      price: basePrice + extrasTotal,
    };

    setCart(prev => {
      const extrasKey = selectedExtras?.map(e => e.id).sort().join(',') || '';
      const match = (ci: CartItem) =>
        ci.id === item.id &&
        ci.selectedSize?.id === selectedSize?.id &&
        (ci.selectedExtras?.map(e => e.id).sort().join(',') || '') === extrasKey;

      const existing = prev.find(match);
      if (existing) {
        return prev.map(ci => match(ci) ? { ...ci, quantity: ci.quantity + 1 } : ci);
      }
      return [...prev, { ...cartItem, quantity: 1 }];
    });

    const sizeText = selectedSize ? ` - ${selectedSize.name}` : '';
    const extrasText = selectedExtras?.length ? ` + ${selectedExtras.map(e => e.name).join(', ')}` : '';
    toast({
      title: 'تم إضافة العنصر',
      description: `تم إضافة ${item.name}${sizeText}${extrasText} إلى السلة`,
    });
  }, [toast]);

  // دالة حذف/تقليل كمية صنف من السلة
  const removeFromCart = useCallback((itemId: string, sizeId?: string, extrasKey?: string) => {
    setCart(prev => {
      const match = (ci: CartItem) =>
        ci.id === itemId &&
        ci.selectedSize?.id === sizeId &&
        (ci.selectedExtras?.map(e => e.id).sort().join(',') || '') === (extrasKey || '');

      const existing = prev.find(match);
      if (existing && existing.quantity > 1) {
        return prev.map(ci => match(ci) ? { ...ci, quantity: ci.quantity - 1 } : ci);
      }
      return prev.filter(ci => !match(ci));
    });
  }, []);

  // حساب إجمالي سعر السلة
  const getTotalPrice = useCallback(() => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [cart]);

  // تفريغ السلة
  const clearCart = useCallback(() => setCart([]), []);

  return { cart, addToCart, removeFromCart, getTotalPrice, clearCart, getCartKey };
}

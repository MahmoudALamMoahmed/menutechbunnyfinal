import { useRestaurantLimits } from './useSubscription';

type LimitType = 'categories' | 'menu_items' | 'branches' | 'extras';

interface LimitsCheckResult {
  canAdd: boolean;
  currentCount: number;
  maxAllowed: number | null; // null = غير محدود
  isUnlimited: boolean;
  isLoading: boolean;
  usageText: string; // e.g. "3 / 10" or "5 / ∞"
  usagePercent: number; // 0-100
}

// Hook - فحص إمكانية إضافة عنصر جديد بناءً على حدود الباقة
export function useLimitsCheck(
  restaurantId: string | undefined,
  type: LimitType,
  currentCount: number
): LimitsCheckResult {
  const { data: limits, isLoading } = useRestaurantLimits(restaurantId);

  // إذا لم تتوفر البيانات بعد، نسمح بالإضافة مبدئياً
  if (isLoading || !limits) {
    return { 
      canAdd: true, 
      currentCount, 
      maxAllowed: null, 
      isUnlimited: true, 
      isLoading, 
      usageText: `${currentCount}`,
      usagePercent: 0,
    };
  }

  // تحديد الحد الأقصى بناءً على نوع العنصر
  let maxAllowed: number | null = null;
  switch (type) {
    case 'categories': maxAllowed = limits.max_categories; break;
    case 'menu_items': maxAllowed = limits.max_items; break;
    case 'branches': maxAllowed = limits.max_branches; break;
    case 'extras': maxAllowed = limits.max_extras; break;
  }

  const isUnlimited = maxAllowed === null;
  const canAdd = isUnlimited || currentCount < maxAllowed!;
  
  const usageText = isUnlimited 
    ? `${currentCount} / ∞` 
    : `${currentCount} / ${maxAllowed}`;
  
  const usagePercent = isUnlimited 
    ? 0 
    : Math.min(100, (currentCount / maxAllowed!) * 100);

  return { 
    canAdd, 
    currentCount, 
    maxAllowed, 
    isUnlimited, 
    isLoading: false,
    usageText,
    usagePercent,
  };
}

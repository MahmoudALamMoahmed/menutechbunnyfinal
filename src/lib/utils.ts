import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// دالة تحسين رسائل الخطأ
export const getErrorMessage = (error: any): string => {
  const message = error?.message || '';
  
  if (message.includes('Invalid login credentials')) {
    return 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
  }
  if (message.includes('Email not confirmed')) {
    return 'يرجى تأكيد بريدك الإلكتروني أولاً. تحقق من صندوق الوارد';
  }
  if (message.includes('already registered') || message.includes('User already registered')) {
    return 'هذا البريد مسجل بالفعل. جرب تسجيل الدخول أو استعادة كلمة المرور';
  }
  if (message.includes('rate limit') || message.includes('Rate limit exceeded')) {
    return 'تم تجاوز الحد المسموح. انتظر قليلاً ثم حاول مرة أخرى';
  }
  if (message.includes('weak password') || message.includes('Password')) {
    return 'كلمة المرور ضعيفة جداً. استخدم كلمة مرور أقوى';
  }
  if (message.includes('Invalid email')) {
    return 'صيغة البريد الإلكتروني غير صحيحة';
  }
  
  return 'حدث خطأ غير متوقع. حاول مرة أخرى';
};

export const getPasswordStrength = (password: string) => {
  let strength = 0;
  if (password.length >= 6) strength++;
  if (password.length >= 8) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;
  
  if (strength <= 1) return { level: 'weak', label: 'ضعيفة', color: 'bg-red-500', width: '33%' };
  if (strength <= 2) return { level: 'medium', label: 'متوسطة', color: 'bg-yellow-500', width: '66%' };
  return { level: 'strong', label: 'قوية', color: 'bg-green-500', width: '100%' };
};

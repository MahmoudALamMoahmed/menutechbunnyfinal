import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

type AvailabilityStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

interface UseAvailabilityCheckResult {
  status: AvailabilityStatus;
  message: string;
}

// Custom Hook - التحقق من توفر اسم المستخدم (useState + useEffect + debounce يدوي)
export function useUsernameAvailability(username: string): UseAvailabilityCheckResult {
  // UI State - حالة التحقق والرسالة
  const [status, setStatus] = useState<AvailabilityStatus>('idle');
  const [message, setMessage] = useState('');

  // Side Effect - فحص التوفر مع debounce 500ms عند تغيير اسم المستخدم
  useEffect(() => {
    // إعادة تعيين الحالة إذا كان الحقل فارغاً
    if (!username.trim()) {
      setStatus('idle');
      setMessage('');
      return;
    }

    // التحقق من صحة الصيغة أولاً
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      setStatus('invalid');
      setMessage('يجب أن يحتوي على حروف إنجليزية وأرقام فقط');
      return;
    }

    if (username.length < 3) {
      setStatus('invalid');
      setMessage('يجب أن يكون 3 أحرف على الأقل');
      return;
    }

    // بدء التحقق
    setStatus('checking');
    setMessage('جاري التحقق...');

    const timeoutId = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from('public_restaurants')
          .select('id')
          .eq('username', username.toLowerCase())
          .maybeSingle();

        if (error) {
          setStatus('idle');
          setMessage('');
          return;
        }

        if (data) {
          setStatus('taken');
          setMessage('اسم المستخدم مستخدم بالفعل');
        } else {
          setStatus('available');
          setMessage('اسم المستخدم متاح');
        }
      } catch {
        setStatus('idle');
        setMessage('');
      }
    }, 500); // debounce 500ms

    return () => clearTimeout(timeoutId);
  }, [username]);

  return { status, message };
}

// ملاحظة: التحقق من توفر البريد الإلكتروني غير ممكن من الـ client
// لأن الإيميلات محفوظة في auth.users وهو جدول محمي
// التحقق يتم تلقائياً عند محاولة التسجيل ويظهر خطأ "already registered"

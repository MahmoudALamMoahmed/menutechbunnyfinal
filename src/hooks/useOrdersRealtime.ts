import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.value = 880;
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc1.connect(gain1).connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.15);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.value = 1100;
    gain2.gain.setValueAtTime(0.3, now + 0.2);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    osc2.connect(gain2).connect(ctx.destination);
    osc2.start(now + 0.2);
    osc2.stop(now + 0.4);

    setTimeout(() => ctx.close(), 1000);
  } catch (e) {
    console.warn('Could not play notification sound:', e);
  }
}

interface UseOrdersRealtimeOptions {
  filterColumn: 'restaurant_id' | 'branch_id';
  filterValue: string | undefined;
  queryKey: (string | undefined)[];
}

export function useOrdersRealtime({ filterColumn, filterValue, queryKey }: UseOrdersRealtimeOptions) {
  const queryClient = useQueryClient();
  const processedIds = useRef<Set<string>>(new Set());
  // حفظ queryKey كـ string مستقر لتجنب JSON.stringify في dependency array
  const queryKeyRef = useRef(queryKey);
  queryKeyRef.current = queryKey;

  useEffect(() => {
    if (!filterValue) return;

    // تنظيف processedIds عند تغيير القناة
    processedIds.current.clear();

    const channelName = `orders-${filterColumn}-${filterValue}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `${filterColumn}=eq.${filterValue}`,
        },
        (payload) => {
          const newOrder = payload.new as { id: string; customer_name: string };

          if (processedIds.current.has(newOrder.id)) return;
          processedIds.current.add(newOrder.id);

          // تنظيف تلقائي: إبقاء آخر 500 معرف فقط
          if (processedIds.current.size > 500) {
            const ids = Array.from(processedIds.current);
            processedIds.current = new Set(ids.slice(-250));
          }

          queryClient.invalidateQueries({ queryKey: queryKeyRef.current });
          queryClient.invalidateQueries({ queryKey: ['pending_orders_count', filterColumn, filterValue] });

          if (localStorage.getItem('notification_sound_enabled') !== 'false') {
            playNotificationSound();
          }

          toast({
            title: '🔔 طلب جديد!',
            description: newOrder.customer_name,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `${filterColumn}=eq.${filterValue}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeyRef.current });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filterColumn, filterValue]);
}

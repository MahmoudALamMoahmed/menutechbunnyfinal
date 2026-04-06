import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type ContactLead = Tables<'contact_leads'>;

export function useStaffLeads() {
  return useQuery({
    queryKey: ['contact-leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_leads')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as ContactLead[];
    },
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status?: string; notes?: string }) => {
      const updates: Record<string, string> = {};
      if (status !== undefined) updates.status = status;
      if (notes !== undefined) updates.notes = notes;
      const { error } = await supabase
        .from('contact_leads')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-leads'] });
    },
  });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface WaitlistEntry {
  id: string;
  class_id: string;
  user_name: string;
  user_email: string;
  user_phone?: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export const useWaitlist = (classId: string) => {
  return useQuery({
    queryKey: ['waitlist', classId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('waitlist')
        .select('*')
        .eq('class_id', classId)
        .order('position', { ascending: true });
      
      if (error) throw error;
      return data as WaitlistEntry[];
    },
    enabled: !!classId,
  });
};

export const useJoinWaitlist = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (waitlistData: {
      class_id: string;
      user_name: string;
      user_email: string;
      user_phone?: string;
    }) => {
      // Get next position
      const { count } = await supabase
        .from('waitlist')
        .select('*', { count: 'exact', head: true })
        .eq('class_id', waitlistData.class_id);
      
      const position = (count || 0) + 1;
      
      const { data, error } = await supabase
        .from('waitlist')
        .insert({
          ...waitlistData,
          position,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as WaitlistEntry;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['waitlist', data.class_id] });
    },
  });
};

export const usePromoteFromWaitlist = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ classId, waitlistId }: { classId: string; waitlistId: string }) => {
      // Remove from waitlist
      const { error } = await supabase
        .from('waitlist')
        .delete()
        .eq('id', waitlistId);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['waitlist', variables.classId] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
};
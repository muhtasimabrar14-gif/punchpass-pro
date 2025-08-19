import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface CheckIn {
  id: string;
  booking_id: string;
  checked_in_at: string;
  checked_in_by?: string;
  qr_code?: string;
}

export const useClassCheckIns = (classId: string) => {
  return useQuery({
    queryKey: ['check_ins', classId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('check_ins')
        .select(`
          *,
          booking:bookings(
            id,
            user_name,
            user_email,
            qr_code,
            class:classes(id, name, start_time)
          )
        `)
        .eq('booking.class_id', classId)
        .order('checked_in_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!classId,
  });
};

export const useCreateCheckIn = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ bookingId, qrCode }: { bookingId: string; qrCode?: string }) => {
      const { data, error } = await supabase
        .from('check_ins')
        .insert({
          booking_id: bookingId,
          checked_in_by: user?.id,
          qr_code: qrCode,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as CheckIn;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['check_ins'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
};

export const useCheckInByQR = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (qrCode: string) => {
      // Find booking by QR code
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('id, class_id')
        .eq('qr_code', qrCode)
        .single();
      
      if (bookingError) throw new Error('Invalid QR code or booking not found');
      
      // Check if already checked in
      const { data: existingCheckIn } = await supabase
        .from('check_ins')
        .select('id')
        .eq('booking_id', booking.id)
        .single();
      
      if (existingCheckIn) {
        throw new Error('Already checked in');
      }
      
      // Create check-in
      const { data, error } = await supabase
        .from('check_ins')
        .insert({
          booking_id: booking.id,
          checked_in_by: user?.id,
          qr_code: qrCode,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as CheckIn;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['check_ins'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
};
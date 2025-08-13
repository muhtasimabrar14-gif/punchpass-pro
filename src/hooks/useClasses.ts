import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Class {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  start_time: string;
  end_time: string;
  capacity: number;
  instructor?: string;
  price: number;
  currency: string;
  created_at: string;
  updated_at: string;
  booking_count?: number;
}

export interface Booking {
  id: string;
  class_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  pass_type: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export const useClasses = (organizationId?: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['classes', organizationId, user?.id],
    queryFn: async () => {
      if (!user || !organizationId) return [];
      
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          bookings (count)
        `)
        .eq('organization_id', organizationId)
        .order('start_time', { ascending: true });
      
      if (error) throw error;
      
      return data.map(cls => ({
        ...cls,
        booking_count: cls.bookings?.[0]?.count || 0
      })) as Class[];
    },
    enabled: !!user && !!organizationId,
  });
};

export const useClassBookings = (classId: string) => {
  return useQuery({
    queryKey: ['bookings', classId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('class_id', classId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Booking[];
    },
    enabled: !!classId,
  });
};

export const useCreateClass = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (classData: Omit<Class, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('classes')
        .insert(classData)
        .select()
        .single();
      
      if (error) throw error;
      return data as Class;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['classes', data.organization_id] });
    },
  });
};

export const useCreateBooking = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (bookingData: {
      class_id: string;
      user_name: string;
      user_email: string;
      pass_type: string;
    }) => {
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          ...bookingData,
          status: 'confirmed'
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as Booking;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['bookings', data.class_id] });
    },
  });
};
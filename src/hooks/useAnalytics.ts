import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AnalyticsEvent {
  id: string;
  organization_id: string;
  event_type: string;
  event_data: any;
  user_id?: string;
  created_at: string;
}

export interface AnalyticsSummary {
  totalBookings: number;
  totalRevenue: number;
  noShowRate: number;
  averageClassCapacity: number;
  popularClasses: Array<{ name: string; bookings: number }>;
  revenueByMonth: Array<{ month: string; revenue: number }>;
  bookingsByDay: Array<{ date: string; bookings: number }>;
}

export const useAnalytics = (organizationId: string, dateRange?: { start: string; end: string }) => {
  return useQuery({
    queryKey: ['analytics', organizationId, dateRange],
    queryFn: async () => {
      if (!organizationId) return null;
      
      // Get basic stats
      const { data: classes, error: classesError } = await supabase
        .from('classes')
        .select(`
          id, name, capacity, price, start_time,
          bookings:bookings(count)
        `)
        .eq('organization_id', organizationId)
        .gte('start_time', dateRange?.start || '2000-01-01')
        .lte('start_time', dateRange?.end || '2099-12-31');
      
      if (classesError) throw classesError;
      
      // Get check-ins for no-show calculation
      const { data: checkIns, error: checkInsError } = await supabase
        .from('check_ins')
        .select(`
          id,
          booking:bookings(
            id,
            class:classes(organization_id)
          )
        `)
        .eq('booking.class.organization_id', organizationId);
      
      if (checkInsError) throw checkInsError;
      
      const totalBookings = classes?.reduce((sum, cls) => 
        sum + (cls.bookings?.[0]?.count || 0), 0) || 0;
      
      const totalRevenue = classes?.reduce((sum, cls) => 
        sum + (cls.price * (cls.bookings?.[0]?.count || 0)), 0) || 0;
      
      const totalCheckIns = checkIns?.length || 0;
      const noShowRate = totalBookings > 0 ? ((totalBookings - totalCheckIns) / totalBookings) * 100 : 0;
      
      const totalCapacity = classes?.reduce((sum, cls) => sum + cls.capacity, 0) || 0;
      const averageClassCapacity = totalCapacity > 0 ? (totalBookings / classes.length) * 100 / (totalCapacity / classes.length) : 0;
      
      const popularClasses = classes
        ?.map(cls => ({
          name: cls.name,
          bookings: cls.bookings?.[0]?.count || 0,
        }))
        .sort((a, b) => b.bookings - a.bookings)
        .slice(0, 5) || [];
      
      // Group revenue by month
      const revenueByMonth = classes?.reduce((acc, cls) => {
        const month = new Date(cls.start_time).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        const revenue = cls.price * (cls.bookings?.[0]?.count || 0);
        
        const existing = acc.find(item => item.month === month);
        if (existing) {
          existing.revenue += revenue;
        } else {
          acc.push({ month, revenue });
        }
        return acc;
      }, [] as Array<{ month: string; revenue: number }>) || [];
      
      // Group bookings by day for the last 30 days
      const bookingsByDay = classes?.reduce((acc, cls) => {
        const date = new Date(cls.start_time).toLocaleDateString();
        const bookings = cls.bookings?.[0]?.count || 0;
        
        const existing = acc.find(item => item.date === date);
        if (existing) {
          existing.bookings += bookings;
        } else {
          acc.push({ date, bookings });
        }
        return acc;
      }, [] as Array<{ date: string; bookings: number }>) || [];
      
      return {
        totalBookings,
        totalRevenue,
        noShowRate,
        averageClassCapacity,
        popularClasses,
        revenueByMonth: revenueByMonth.sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime()),
        bookingsByDay: bookingsByDay.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(-30),
      } as AnalyticsSummary;
    },
    enabled: !!organizationId,
  });
};

export const useTrackEvent = () => {
  return useMutation({
    mutationFn: async (eventData: {
      organization_id: string;
      event_type: string;
      event_data?: any;
      user_id?: string;
    }) => {
      const { data, error } = await supabase
        .from('analytics_events')
        .insert(eventData)
        .select()
        .single();
      
      if (error) throw error;
      return data as AnalyticsEvent;
    },
  });
};
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface NoShowStats {
  no_show_rate: number;
  total_no_shows: number;
  revenue_lost: number;
  repeat_offenders: number;
  recent_no_shows: Array<{
    user_name: string;
    user_email: string;
    class_name: string;
    class_date: string;
    penalty_applied: boolean;
  }>;
}

export const useNoShowAnalytics = (organizationId: string) => {
  return useQuery({
    queryKey: ['no_show_analytics', organizationId],
    queryFn: async () => {
      if (!organizationId) return null;
      
      // Get classes from the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: classes, error: classesError } = await supabase
        .from('classes')
        .select(`
          id, name, start_time, price,
          bookings:bookings!inner(
            id, user_name, user_email, status,
            check_ins:check_ins(id)
          )
        `)
        .eq('organization_id', organizationId)
        .gte('start_time', thirtyDaysAgo.toISOString())
        .lt('start_time', new Date().toISOString());
      
      if (classesError) throw classesError;
      
      let totalBookings = 0;
      let totalNoShows = 0;
      let revenueLost = 0;
      const noShowUsers: Record<string, number> = {};
      const recentNoShows: any[] = [];
      
      classes?.forEach(cls => {
        cls.bookings?.forEach((booking: any) => {
          if (booking.status === 'confirmed') {
            totalBookings++;
            
            // Check if user checked in
            const hasCheckedIn = booking.check_ins && booking.check_ins.length > 0;
            
            if (!hasCheckedIn) {
              totalNoShows++;
              revenueLost += cls.price;
              
              // Track repeat offenders
              noShowUsers[booking.user_email] = (noShowUsers[booking.user_email] || 0) + 1;
              
              // Add to recent no-shows
              recentNoShows.push({
                user_name: booking.user_name,
                user_email: booking.user_email,
                class_name: cls.name,
                class_date: cls.start_time,
                penalty_applied: false, // This would come from a penalties table
              });
            }
          }
        });
      });
      
      const noShowRate = totalBookings > 0 ? (totalNoShows / totalBookings) * 100 : 0;
      const repeatOffenders = Object.values(noShowUsers).filter(count => count >= 3).length;
      
      return {
        no_show_rate: noShowRate,
        total_no_shows: totalNoShows,
        revenue_lost: revenueLost,
        repeat_offenders: repeatOffenders,
        recent_no_shows: recentNoShows.slice(0, 10),
      } as NoShowStats;
    },
    enabled: !!organizationId,
  });
};

export const useProcessNoShows = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (organizationId: string) => {
      const { data, error } = await supabase.functions.invoke('process-no-shows', {
        body: { organization_id: organizationId }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, organizationId) => {
      queryClient.invalidateQueries({ queryKey: ['no_show_analytics', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['analytics', organizationId] });
    },
  });
};
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface OrganizationSettings {
  id: string;
  organization_id: string;
  stripe_connected: boolean;
  stripe_account_id?: string;
  google_calendar_connected: boolean;
  outlook_calendar_connected: boolean;
  auto_confirm_bookings: boolean;
  allow_waitlist: boolean;
  require_payment: boolean;
  cancellation_hours: number;
  settings: any;
  created_at: string;
  updated_at: string;
}

export const useOrganizationSettings = (organizationId: string) => {
  return useQuery({
    queryKey: ['organization_settings', organizationId],
    queryFn: async () => {
      if (!organizationId) return null;
      
      const { data, error } = await supabase
        .from('organization_settings')
        .select('*')
        .eq('organization_id', organizationId)
        .single();
      
      if (error) {
        // If no settings exist, return default settings
        if (error.code === 'PGRST116') {
          return {
            organization_id: organizationId,
            stripe_connected: false,
            google_calendar_connected: false,
            outlook_calendar_connected: false,
            auto_confirm_bookings: true,
            allow_waitlist: true,
            require_payment: false,
            cancellation_hours: 2,
            settings: {},
          } as Partial<OrganizationSettings>;
        }
        throw error;
      }
      
      return data as OrganizationSettings;
    },
    enabled: !!organizationId,
  });
};

export const useUpdateOrganizationSettings = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (settingsData: Partial<OrganizationSettings> & { organization_id: string }) => {
      const { data, error } = await supabase
        .from('organization_settings')
        .upsert(settingsData, { onConflict: 'organization_id' })
        .select()
        .single();
      
      if (error) throw error;
      return data as OrganizationSettings;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['organization_settings', data.organization_id] });
    },
  });
};
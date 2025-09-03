import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface CalendarIntegration {
  id: string;
  organization_id: string;
  provider: 'google' | 'outlook' | 'calendly';
  access_token?: string;
  refresh_token?: string;
  expires_at?: string;
  settings: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CalendarEvent {
  id: string;
  organization_id: string;
  integration_id: string;
  external_event_id: string;
  title: string;
  start_time: string;
  end_time: string;
  is_busy: boolean;
  sync_status: 'synced' | 'pending' | 'failed';
  created_at: string;
  updated_at: string;
}

export const useCalendarIntegrations = (organizationId?: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['calendar_integrations', organizationId, user?.id],
    queryFn: async () => {
      if (!user || !organizationId) return [];
      
      const { data, error } = await supabase
        .from('calendar_integrations')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as CalendarIntegration[];
    },
    enabled: !!user && !!organizationId,
  });
};

export const useCalendarEvents = (organizationId?: string) => {
  return useQuery({
    queryKey: ['calendar_events', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_busy', true)
        .eq('sync_status', 'synced')
        .gte('end_time', new Date().toISOString())
        .order('start_time', { ascending: true });
      
      if (error) throw error;
      return data as CalendarEvent[];
    },
    enabled: !!organizationId,
  });
};

export const useCreateCalendarIntegration = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (integrationData: {
      organization_id: string;
      provider: 'google' | 'outlook' | 'calendly';
      access_token?: string;
      refresh_token?: string;
      expires_at?: string;
      settings?: any;
    }) => {
      const { data, error } = await supabase
        .from('calendar_integrations')
        .upsert(integrationData, { onConflict: 'organization_id,provider' })
        .select()
        .single();
      
      if (error) throw error;
      return data as CalendarIntegration;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['calendar_integrations', data.organization_id] });
    },
  });
};

export const useDeleteCalendarIntegration = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (integrationId: string) => {
      const { error } = await supabase
        .from('calendar_integrations')
        .delete()
        .eq('id', integrationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar_integrations'] });
      queryClient.invalidateQueries({ queryKey: ['calendar_events'] });
    },
  });
};

export const useCheckCalendarConflicts = () => {
  return useMutation({
    mutationFn: async ({
      organizationId,
      startTime,
      endTime,
    }: {
      organizationId: string;
      startTime: string;
      endTime: string;
    }) => {
      const { data, error } = await supabase.rpc('check_calendar_conflicts', {
        org_id: organizationId,
        start_time: startTime,
        end_time: endTime,
      });
      
      if (error) throw error;
      return data;
    },
  });
};

export const useSyncCalendarEvents = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (organizationId: string) => {
      // Call Edge Function to sync calendar events
      const { data, error } = await supabase.functions.invoke('sync-calendar-events', {
        body: { organization_id: organizationId }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, organizationId) => {
      queryClient.invalidateQueries({ queryKey: ['calendar_events', organizationId] });
    },
  });
};
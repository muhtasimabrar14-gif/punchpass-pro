import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Membership {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  type: 'unlimited' | 'class_pack' | 'trial';
  price: number;
  currency: string;
  class_credits?: number;
  duration_days?: number;
  is_recurring: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserPass {
  id: string;
  user_id: string;
  membership_id: string;
  organization_id: string;
  status: 'active' | 'expired' | 'suspended';
  remaining_credits?: number;
  expires_at?: string;
  created_at: string;
  updated_at: string;
  membership?: Membership;
}

export const useMemberships = (organizationId?: string) => {
  return useQuery({
    queryKey: ['memberships', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      const { data, error } = await supabase
        .from('memberships')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Membership[];
    },
    enabled: !!organizationId,
  });
};

export const useUserPasses = (userId?: string, organizationId?: string) => {
  return useQuery({
    queryKey: ['user_passes', userId, organizationId],
    queryFn: async () => {
      if (!userId || !organizationId) return [];
      
      const { data, error } = await supabase
        .from('user_passes')
        .select(`
          *,
          membership:memberships(*)
        `)
        .eq('user_id', userId)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as UserPass[];
    },
    enabled: !!userId && !!organizationId,
  });
};

export const useCreateMembership = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (membershipData: Omit<Membership, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('memberships')
        .insert(membershipData)
        .select()
        .single();
      
      if (error) throw error;
      return data as Membership;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['memberships', data.organization_id] });
    },
  });
};

export const useCreateUserPass = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (passData: {
      user_id: string;
      membership_id: string;
      organization_id: string;
      remaining_credits?: number;
      expires_at?: string;
    }) => {
      const { data, error } = await supabase
        .from('user_passes')
        .insert(passData)
        .select()
        .single();
      
      if (error) throw error;
      return data as UserPass;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user_passes', data.user_id, data.organization_id] });
    },
  });
};
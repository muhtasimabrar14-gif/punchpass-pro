import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  created_at: string;
  updated_at: string;
  profiles?: {
    display_name: string;
    email: string;
  };
}

export const useOrganizationMembers = (organizationId: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['organization_members', organizationId, user?.id],
    queryFn: async () => {
      if (!user || !organizationId) return [];
      
      const { data, error } = await supabase
        .from('org_members')
        .select(`
          *,
          profiles (
            display_name,
            email
          )
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as OrganizationMember[];
    },
    enabled: !!user && !!organizationId,
  });
};

export const useInviteUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (inviteData: {
      organization_id: string;
      email: string;
      role: 'owner' | 'admin' | 'member';
    }) => {
      // Call Edge Function to handle user invitation
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: inviteData
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['organization_members', variables.organization_id] });
    },
  });
};

export const useUpdateMemberRole = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (updateData: {
      member_id: string;
      role: 'owner' | 'admin' | 'member';
    }) => {
      const { data, error } = await supabase
        .from('org_members')
        .update({ role: updateData.role })
        .eq('id', updateData.member_id)
        .select()
        .single();
      
      if (error) throw error;
      return data as OrganizationMember;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['organization_members', data.organization_id] });
    },
  });
};

export const useRemoveMember = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (memberId: string) => {
      const { data, error } = await supabase
        .from('org_members')
        .delete()
        .eq('id', memberId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['organization_members', data.organization_id] });
    },
  });
};

export const useCurrentUserRole = (organizationId: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['current_user_role', organizationId, user?.id],
    queryFn: async () => {
      if (!user || !organizationId) return null;
      
      const { data, error } = await supabase
        .from('org_members')
        .select('role')
        .eq('organization_id', organizationId)
        .eq('user_id', user.id)
        .single();
      
      if (error) return null;
      return data.role;
    },
    enabled: !!user && !!organizationId,
  });
};
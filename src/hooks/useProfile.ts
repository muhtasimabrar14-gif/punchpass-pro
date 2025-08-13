import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Profile {
  id: string;
  display_name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  description?: string;
  website?: string;
  created_at: string;
  updated_at: string;
}

export const useProfile = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data as Profile;
    },
    enabled: !!user,
  });
};

export const useOrganizations = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['organizations', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('org_members')
        .select(`
          role,
          organizations (
            id,
            name,
            description,
            website,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data.map(item => ({
        ...item.organizations,
        role: item.role
      }));
    },
    enabled: !!user,
  });
};

export const useCreateOrganization = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (orgData: { name: string; description?: string; website?: string }) => {
      if (!user) throw new Error('User not authenticated');
      
      // First create the organization
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert(orgData)
        .select()
        .single();
      
      if (orgError) throw orgError;
      
      // Then add the user as an owner
      const { error: memberError } = await supabase
        .from('org_members')
        .insert({
          organization_id: org.id,
          user_id: user.id,
          role: 'owner'
        });
      
      if (memberError) throw memberError;
      
      return org;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
  });
};
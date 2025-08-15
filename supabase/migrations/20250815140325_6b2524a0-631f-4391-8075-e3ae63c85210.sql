-- Fix security definer function search path issues
CREATE OR REPLACE FUNCTION public.get_user_org_role(org_id UUID, user_id UUID)
RETURNS public.org_role
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.org_members 
  WHERE organization_id = org_id AND user_id = get_user_org_role.user_id;
$$;

-- Fix handle_new_user function (already has search_path set, just recreating for consistency)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$;
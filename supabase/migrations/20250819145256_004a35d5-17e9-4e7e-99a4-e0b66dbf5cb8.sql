-- Add memberships and pass management
CREATE TYPE public.membership_type AS ENUM ('unlimited', 'class_pack', 'trial');
CREATE TYPE public.pass_status AS ENUM ('active', 'expired', 'suspended');
CREATE TYPE public.payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- Memberships table
CREATE TABLE public.memberships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type membership_type NOT NULL DEFAULT 'class_pack',
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  class_credits INTEGER, -- null for unlimited
  duration_days INTEGER, -- null for no expiry
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User passes table
CREATE TABLE public.user_passes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  membership_id UUID NOT NULL REFERENCES public.memberships(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  status pass_status NOT NULL DEFAULT 'active',
  remaining_credits INTEGER, -- null for unlimited
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Waitlist table
CREATE TABLE public.waitlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_phone TEXT,
  position INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- QR check-ins table
CREATE TABLE public.check_ins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  checked_in_by UUID, -- staff member who checked them in
  qr_code TEXT UNIQUE
);

-- Payments table
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  stripe_session_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status payment_status NOT NULL DEFAULT 'pending',
  payment_type TEXT NOT NULL, -- 'class_booking', 'membership', 'pass'
  related_id UUID, -- booking_id, membership_id, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Analytics/tracking table
CREATE TABLE public.analytics_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Organization settings
CREATE TABLE public.organization_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE UNIQUE,
  stripe_connected BOOLEAN NOT NULL DEFAULT false,
  stripe_account_id TEXT,
  google_calendar_connected BOOLEAN NOT NULL DEFAULT false,
  outlook_calendar_connected BOOLEAN NOT NULL DEFAULT false,
  auto_confirm_bookings BOOLEAN NOT NULL DEFAULT true,
  allow_waitlist BOOLEAN NOT NULL DEFAULT true,
  require_payment BOOLEAN NOT NULL DEFAULT false,
  cancellation_hours INTEGER NOT NULL DEFAULT 2,
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for memberships
CREATE POLICY "Anyone can view memberships" ON public.memberships
FOR SELECT USING (true);

CREATE POLICY "Organization members can manage memberships" ON public.memberships
FOR ALL USING (get_user_org_role(organization_id, auth.uid()) = ANY (ARRAY['owner'::org_role, 'admin'::org_role, 'member'::org_role]));

-- RLS policies for user_passes
CREATE POLICY "Users can view their own passes" ON public.user_passes
FOR SELECT USING (auth.uid()::text = user_id::text OR get_user_org_role(organization_id, auth.uid()) = ANY (ARRAY['owner'::org_role, 'admin'::org_role]));

CREATE POLICY "Organization members can manage passes" ON public.user_passes
FOR ALL USING (get_user_org_role(organization_id, auth.uid()) = ANY (ARRAY['owner'::org_role, 'admin'::org_role]));

-- RLS policies for waitlist
CREATE POLICY "Anyone can view waitlist" ON public.waitlist
FOR SELECT USING (true);

CREATE POLICY "Anyone can join waitlist" ON public.waitlist
FOR INSERT WITH CHECK (true);

CREATE POLICY "Organization members can manage waitlist" ON public.waitlist
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.classes c 
    WHERE c.id = waitlist.class_id 
    AND get_user_org_role(c.organization_id, auth.uid()) = ANY (ARRAY['owner'::org_role, 'admin'::org_role, 'member'::org_role])
  )
);

-- RLS policies for check_ins
CREATE POLICY "Organization members can view check-ins" ON public.check_ins
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.bookings b 
    JOIN public.classes c ON b.class_id = c.id 
    WHERE b.id = check_ins.booking_id 
    AND get_user_org_role(c.organization_id, auth.uid()) = ANY (ARRAY['owner'::org_role, 'admin'::org_role, 'member'::org_role])
  )
);

CREATE POLICY "Organization members can manage check-ins" ON public.check_ins
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.bookings b 
    JOIN public.classes c ON b.class_id = c.id 
    WHERE b.id = check_ins.booking_id 
    AND get_user_org_role(c.organization_id, auth.uid()) = ANY (ARRAY['owner'::org_role, 'admin'::org_role, 'member'::org_role])
  )
);

-- RLS policies for payments
CREATE POLICY "Users can view their own payments" ON public.payments
FOR SELECT USING (auth.uid()::text = user_id::text OR get_user_org_role(organization_id, auth.uid()) = ANY (ARRAY['owner'::org_role, 'admin'::org_role]));

CREATE POLICY "Organization members can manage payments" ON public.payments
FOR ALL USING (get_user_org_role(organization_id, auth.uid()) = ANY (ARRAY['owner'::org_role, 'admin'::org_role]));

-- RLS policies for analytics_events
CREATE POLICY "Organization members can view analytics" ON public.analytics_events
FOR SELECT USING (get_user_org_role(organization_id, auth.uid()) = ANY (ARRAY['owner'::org_role, 'admin'::org_role]));

CREATE POLICY "Anyone can insert analytics events" ON public.analytics_events
FOR INSERT WITH CHECK (true);

-- RLS policies for organization_settings
CREATE POLICY "Organization members can view settings" ON public.organization_settings
FOR SELECT USING (get_user_org_role(organization_id, auth.uid()) = ANY (ARRAY['owner'::org_role, 'admin'::org_role, 'member'::org_role]));

CREATE POLICY "Organization owners can manage settings" ON public.organization_settings
FOR ALL USING (get_user_org_role(organization_id, auth.uid()) = 'owner'::org_role);

-- Update triggers for new tables
CREATE TRIGGER update_memberships_updated_at
BEFORE UPDATE ON public.memberships
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_passes_updated_at
BEFORE UPDATE ON public.user_passes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_waitlist_updated_at
BEFORE UPDATE ON public.waitlist
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organization_settings_updated_at
BEFORE UPDATE ON public.organization_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add QR code column to bookings
ALTER TABLE public.bookings ADD COLUMN qr_code TEXT UNIQUE;

-- Function to generate QR code for booking
CREATE OR REPLACE FUNCTION generate_booking_qr_code()
RETURNS TRIGGER AS $$
BEGIN
  NEW.qr_code = 'QR_' || NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_qr_code_trigger
BEFORE INSERT ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION generate_booking_qr_code();

-- Function to auto-decrement pass credits on booking
CREATE OR REPLACE FUNCTION handle_booking_credit_usage()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.pass_type != 'drop-in' THEN
    -- Find and update user pass
    UPDATE public.user_passes 
    SET remaining_credits = remaining_credits - 1,
        updated_at = now()
    WHERE user_id::text = NEW.user_id::text 
    AND organization_id = (SELECT organization_id FROM public.classes WHERE id = NEW.class_id)
    AND status = 'active'
    AND (remaining_credits > 0 OR remaining_credits IS NULL)
    AND (expires_at > now() OR expires_at IS NULL);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER booking_credit_usage_trigger
AFTER INSERT ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION handle_booking_credit_usage();
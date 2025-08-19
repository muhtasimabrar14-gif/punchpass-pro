-- Fix function search path issues
CREATE OR REPLACE FUNCTION generate_booking_qr_code()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.qr_code = 'QR_' || NEW.id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION handle_booking_credit_usage()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;
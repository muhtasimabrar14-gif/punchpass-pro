/*
  # Calendar Integration Schema

  1. New Tables
    - `calendar_integrations`
      - `id` (uuid, primary key)
      - `organization_id` (uuid, foreign key)
      - `provider` (text) - 'google', 'outlook', 'calendly'
      - `access_token` (text, encrypted)
      - `refresh_token` (text, encrypted)
      - `expires_at` (timestamp)
      - `settings` (jsonb) - provider-specific settings
      - `is_active` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `calendar_events`
      - `id` (uuid, primary key)
      - `organization_id` (uuid, foreign key)
      - `integration_id` (uuid, foreign key)
      - `external_event_id` (text) - ID from external calendar
      - `title` (text)
      - `start_time` (timestamp)
      - `end_time` (timestamp)
      - `is_busy` (boolean) - blocks availability
      - `sync_status` (text) - 'synced', 'pending', 'failed'
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for organization members to manage their integrations
    - Add policies for viewing calendar events

  3. Functions
    - Add trigger for updated_at timestamps
    - Add function to check calendar conflicts
*/

-- Create calendar integrations table
CREATE TABLE IF NOT EXISTS public.calendar_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'outlook', 'calendly')),
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  settings JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, provider)
);

-- Create calendar events table
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  integration_id UUID NOT NULL REFERENCES public.calendar_integrations(id) ON DELETE CASCADE,
  external_event_id TEXT NOT NULL,
  title TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  is_busy BOOLEAN NOT NULL DEFAULT true,
  sync_status TEXT NOT NULL DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(integration_id, external_event_id)
);

-- Enable RLS
ALTER TABLE public.calendar_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for calendar_integrations
CREATE POLICY "Organization members can view calendar integrations"
  ON public.calendar_integrations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members m 
      WHERE m.organization_id = calendar_integrations.organization_id 
      AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Organization admins can manage calendar integrations"
  ON public.calendar_integrations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members m 
      WHERE m.organization_id = calendar_integrations.organization_id 
      AND m.user_id = auth.uid() 
      AND m.role IN ('owner', 'admin')
    )
  );

-- RLS Policies for calendar_events
CREATE POLICY "Organization members can view calendar events"
  ON public.calendar_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members m 
      WHERE m.organization_id = calendar_events.organization_id 
      AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage calendar events"
  ON public.calendar_events FOR ALL
  USING (true);

-- Add updated_at triggers
CREATE TRIGGER update_calendar_integrations_updated_at
  BEFORE UPDATE ON public.calendar_integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON public.calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to check for calendar conflicts
CREATE OR REPLACE FUNCTION public.check_calendar_conflicts(
  org_id UUID,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ
)
RETURNS TABLE(conflict_count INTEGER, conflicts JSONB)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COUNT(*)::INTEGER as conflict_count,
    COALESCE(
      JSON_AGG(
        JSON_BUILD_OBJECT(
          'title', title,
          'start_time', start_time,
          'end_time', end_time,
          'provider', ci.provider
        )
      ) FILTER (WHERE ce.id IS NOT NULL),
      '[]'::jsonb
    ) as conflicts
  FROM public.calendar_events ce
  JOIN public.calendar_integrations ci ON ce.integration_id = ci.id
  WHERE ce.organization_id = org_id
    AND ce.is_busy = true
    AND ce.sync_status = 'synced'
    AND (
      (ce.start_time <= start_time AND ce.end_time > start_time) OR
      (ce.start_time < end_time AND ce.end_time >= end_time) OR
      (ce.start_time >= start_time AND ce.end_time <= end_time)
    );
$$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_calendar_integrations_org_id ON public.calendar_integrations(organization_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_org_time ON public.calendar_events(organization_id, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_integration ON public.calendar_events(integration_id);
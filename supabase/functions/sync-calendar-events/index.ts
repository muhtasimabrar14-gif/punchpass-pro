import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { organization_id } = await req.json();

    // Get all active calendar integrations for the organization
    const { data: integrations, error: integrationsError } = await supabase
      .from('calendar_integrations')
      .select('*')
      .eq('organization_id', organization_id)
      .eq('is_active', true);

    if (integrationsError) throw integrationsError;

    let syncedCount = 0;
    const errors: string[] = [];

    for (const integration of integrations) {
      try {
        if (integration.provider === 'google') {
          await syncGoogleCalendar(integration);
        } else if (integration.provider === 'outlook') {
          await syncOutlookCalendar(integration);
        } else if (integration.provider === 'calendly') {
          await syncCalendlyEvents(integration);
        }
        syncedCount++;
      } catch (error) {
        console.error(`Failed to sync ${integration.provider}:`, error);
        errors.push(`${integration.provider}: ${error.message}`);
      }
    }

    return new Response(
      JSON.stringify({ 
        synced_count: syncedCount,
        total_integrations: integrations.length,
        errors 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Calendar sync error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function syncGoogleCalendar(integration: any) {
  // Check if token needs refresh
  if (new Date(integration.expires_at) <= new Date()) {
    await refreshGoogleToken(integration);
  }

  // Fetch events from Google Calendar
  const eventsResponse = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
    `timeMin=${new Date().toISOString()}&` +
    `timeMax=${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()}&` +
    `singleEvents=true&` +
    `orderBy=startTime`,
    {
      headers: {
        'Authorization': `Bearer ${integration.access_token}`,
      },
    }
  );

  const eventsData = await eventsResponse.json();
  
  if (eventsData.error) {
    throw new Error(eventsData.error.message);
  }

  // Store events in database
  for (const event of eventsData.items || []) {
    if (event.start?.dateTime && event.end?.dateTime) {
      await supabase
        .from('calendar_events')
        .upsert({
          organization_id: integration.organization_id,
          integration_id: integration.id,
          external_event_id: event.id,
          title: event.summary || 'Busy',
          start_time: event.start.dateTime,
          end_time: event.end.dateTime,
          is_busy: true,
          sync_status: 'synced',
        }, { onConflict: 'integration_id,external_event_id' });
    }
  }
}

async function syncOutlookCalendar(integration: any) {
  // Check if token needs refresh
  if (new Date(integration.expires_at) <= new Date()) {
    await refreshOutlookToken(integration);
  }

  // Fetch events from Microsoft Graph
  const eventsResponse = await fetch(
    `https://graph.microsoft.com/v1.0/me/events?` +
    `$filter=start/dateTime ge '${new Date().toISOString()}' and start/dateTime le '${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()}'&` +
    `$orderby=start/dateTime`,
    {
      headers: {
        'Authorization': `Bearer ${integration.access_token}`,
      },
    }
  );

  const eventsData = await eventsResponse.json();
  
  if (eventsData.error) {
    throw new Error(eventsData.error.message);
  }

  // Store events in database
  for (const event of eventsData.value || []) {
    await supabase
      .from('calendar_events')
      .upsert({
        organization_id: integration.organization_id,
        integration_id: integration.id,
        external_event_id: event.id,
        title: event.subject || 'Busy',
        start_time: event.start.dateTime,
        end_time: event.end.dateTime,
        is_busy: true,
        sync_status: 'synced',
      }, { onConflict: 'integration_id,external_event_id' });
  }
}

async function syncCalendlyEvents(integration: any) {
  // For Calendly, we would need to use their API
  // This is a simplified implementation
  const calendlyUrl = integration.settings?.calendly_url;
  if (!calendlyUrl) return;

  // Note: Calendly API requires authentication and webhook setup
  // This is a placeholder for the actual implementation
  console.log(`Syncing Calendly events for ${calendlyUrl}`);
}

async function refreshGoogleToken(integration: any) {
  const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: Deno.env.get('GOOGLE_CLIENT_ID')!,
      client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
      refresh_token: integration.refresh_token,
      grant_type: 'refresh_token',
    }),
  });

  const tokens = await refreshResponse.json();
  
  if (tokens.error) {
    throw new Error('Failed to refresh Google token');
  }

  // Update tokens in database
  await supabase
    .from('calendar_integrations')
    .update({
      access_token: tokens.access_token,
      expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    })
    .eq('id', integration.id);
}

async function refreshOutlookToken(integration: any) {
  const refreshResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: Deno.env.get('MICROSOFT_CLIENT_ID')!,
      client_secret: Deno.env.get('MICROSOFT_CLIENT_SECRET')!,
      refresh_token: integration.refresh_token,
      grant_type: 'refresh_token',
    }),
  });

  const tokens = await refreshResponse.json();
  
  if (tokens.error) {
    throw new Error('Failed to refresh Outlook token');
  }

  // Update tokens in database
  await supabase
    .from('calendar_integrations')
    .update({
      access_token: tokens.access_token,
      expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    })
    .eq('id', integration.id);
}
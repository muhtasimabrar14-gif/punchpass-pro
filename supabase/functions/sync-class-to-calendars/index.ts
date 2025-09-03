import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { class_id } = await req.json();

    // Get class details
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('*')
      .eq('id', class_id)
      .single();

    if (classError) throw classError;

    // Get active calendar integrations for the organization
    const { data: integrations, error: integrationsError } = await supabase
      .from('calendar_integrations')
      .select('*')
      .eq('organization_id', classData.organization_id)
      .eq('is_active', true);

    if (integrationsError) throw integrationsError;

    let syncedCount = 0;
    const errors: string[] = [];

    for (const integration of integrations) {
      try {
        if (integration.provider === 'google') {
          await syncClassToGoogle(classData, integration);
        } else if (integration.provider === 'outlook') {
          await syncClassToOutlook(classData, integration);
        }
        // Note: Calendly doesn't support creating events via API in the same way
        syncedCount++;
      } catch (error) {
        console.error(`Failed to sync to ${integration.provider}:`, error);
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
    console.error('Class sync error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function syncClassToGoogle(classData: any, integration: any) {
  const event = {
    summary: classData.name,
    description: classData.description || '',
    start: {
      dateTime: classData.start_time,
      timeZone: 'UTC',
    },
    end: {
      dateTime: classData.end_time,
      timeZone: 'UTC',
    },
    attendees: [],
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 },
        { method: 'popup', minutes: 30 },
      ],
    },
  };

  const response = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${integration.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Failed to create Google Calendar event');
  }

  const createdEvent = await response.json();
  
  // Store the external event ID for future reference
  await supabase
    .from('calendar_events')
    .insert({
      organization_id: classData.organization_id,
      integration_id: integration.id,
      external_event_id: createdEvent.id,
      title: classData.name,
      start_time: classData.start_time,
      end_time: classData.end_time,
      is_busy: true,
      sync_status: 'synced',
    });
}

async function syncClassToOutlook(classData: any, integration: any) {
  const event = {
    subject: classData.name,
    body: {
      contentType: 'HTML',
      content: classData.description || '',
    },
    start: {
      dateTime: classData.start_time,
      timeZone: 'UTC',
    },
    end: {
      dateTime: classData.end_time,
      timeZone: 'UTC',
    },
    attendees: [],
    isReminderOn: true,
    reminderMinutesBeforeStart: 30,
  };

  const response = await fetch(
    'https://graph.microsoft.com/v1.0/me/events',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${integration.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Failed to create Outlook Calendar event');
  }

  const createdEvent = await response.json();
  
  // Store the external event ID for future reference
  await supabase
    .from('calendar_events')
    .insert({
      organization_id: classData.organization_id,
      integration_id: integration.id,
      external_event_id: createdEvent.id,
      title: classData.name,
      start_time: classData.start_time,
      end_time: classData.end_time,
      is_busy: true,
      sync_status: 'synced',
    });
}
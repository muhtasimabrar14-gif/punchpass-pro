import { corsHeaders } from '../_shared/cors.ts';

const MICROSOFT_CLIENT_ID = Deno.env.get('MICROSOFT_CLIENT_ID');
const MICROSOFT_CLIENT_SECRET = Deno.env.get('MICROSOFT_CLIENT_SECRET');
const MICROSOFT_REDIRECT_URI = Deno.env.get('MICROSOFT_REDIRECT_URI');

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { organization_id, action, code } = await req.json();

    if (action === 'initiate') {
      // Generate OAuth URL
      const scopes = [
        'https://graph.microsoft.com/Calendars.ReadWrite',
        'https://graph.microsoft.com/Calendars.Read'
      ].join(' ');

      const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
        `client_id=${MICROSOFT_CLIENT_ID}&` +
        `response_type=code&` +
        `redirect_uri=${encodeURIComponent(MICROSOFT_REDIRECT_URI!)}&` +
        `scope=${encodeURIComponent(scopes)}&` +
        `response_mode=query&` +
        `state=${organization_id}`;

      return new Response(
        JSON.stringify({ auth_url: authUrl }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'callback' && code) {
      // Exchange code for tokens
      const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: MICROSOFT_CLIENT_ID!,
          client_secret: MICROSOFT_CLIENT_SECRET!,
          code,
          grant_type: 'authorization_code',
          redirect_uri: MICROSOFT_REDIRECT_URI!,
        }),
      });

      const tokens = await tokenResponse.json();

      if (tokens.error) {
        throw new Error(tokens.error_description || 'Failed to get tokens');
      }

      // Store tokens in database
      const { error } = await supabase
        .from('calendar_integrations')
        .upsert({
          organization_id,
          provider: 'outlook',
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
          is_active: true,
        }, { onConflict: 'organization_id,provider' });

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('Outlook Calendar OAuth error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
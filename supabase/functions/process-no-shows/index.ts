import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { organization_id } = await req.json();

    // Get organization settings for no-show policy
    const { data: orgSettings, error: settingsError } = await supabase
      .from('organization_settings')
      .select('settings')
      .eq('organization_id', organization_id)
      .single();

    if (settingsError) throw settingsError;

    const noShowSettings = orgSettings.settings?.no_show_management;
    if (!noShowSettings?.no_show_enabled) {
      return new Response(
        JSON.stringify({ message: 'No-show management not enabled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find classes that have ended and check for no-shows
    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - (noShowSettings.no_show_window_minutes || 15));

    const { data: classes, error: classesError } = await supabase
      .from('classes')
      .select(`
        id, name, start_time, price,
        bookings:bookings!inner(
          id, user_name, user_email, user_id, status,
          check_ins:check_ins(id)
        )
      `)
      .eq('organization_id', organization_id)
      .lt('start_time', cutoffTime.toISOString())
      .gte('start_time', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24 hours

    if (classesError) throw classesError;

    let processedCount = 0;
    const errors: string[] = [];

    for (const cls of classes || []) {
      for (const booking of cls.bookings || []) {
        if (booking.status === 'confirmed') {
          const hasCheckedIn = booking.check_ins && booking.check_ins.length > 0;
          
          if (!hasCheckedIn) {
            try {
              // Apply penalty based on settings
              if (noShowSettings.penalty_type === 'credit_loss') {
                // Deduct credit from user's pass
                await supabase
                  .from('user_passes')
                  .update({ 
                    remaining_credits: supabase.sql`remaining_credits - 1`,
                    updated_at: new Date().toISOString()
                  })
                  .eq('user_id', booking.user_id)
                  .eq('organization_id', organization_id)
                  .eq('status', 'active')
                  .gt('remaining_credits', 0);
              } else if (noShowSettings.penalty_type === 'fee') {
                // Create a penalty charge (would integrate with Stripe)
                await supabase
                  .from('payments')
                  .insert({
                    user_id: booking.user_id,
                    organization_id: organization_id,
                    amount: noShowSettings.penalty_amount || 10,
                    currency: 'USD',
                    status: 'pending',
                    payment_type: 'no_show_penalty',
                    related_id: booking.id,
                  });
              }

              // Send notification email
              await supabase.functions.invoke('send-email', {
                body: {
                  to: booking.user_email,
                  subject: 'No-Show Policy Applied',
                  template: 'no_show_notification',
                  data: {
                    user_name: booking.user_name,
                    class_name: cls.name,
                    class_date: new Date(cls.start_time).toLocaleDateString(),
                    penalty_type: noShowSettings.penalty_type,
                    penalty_amount: noShowSettings.penalty_amount,
                  },
                }
              });

              processedCount++;
            } catch (error) {
              console.error(`Failed to process no-show for ${booking.user_email}:`, error);
              errors.push(`${booking.user_email}: ${error.message}`);
            }
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        processed_count: processedCount,
        errors: errors.slice(0, 10)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('No-show processing error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
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

    // Check current booking count
    const { count: currentBookings } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('class_id', class_id)
      .eq('status', 'confirmed');

    // Check if there's space available
    if ((currentBookings || 0) >= classData.capacity) {
      return new Response(
        JSON.stringify({ message: 'Class is still full' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get next person on waitlist
    const { data: waitlistEntry, error: waitlistError } = await supabase
      .from('waitlist')
      .select('*')
      .eq('class_id', class_id)
      .order('position', { ascending: true })
      .limit(1)
      .single();

    if (waitlistError || !waitlistEntry) {
      return new Response(
        JSON.stringify({ message: 'No one on waitlist' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create booking for waitlisted person
    const { data: newBooking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        class_id: class_id,
        user_name: waitlistEntry.user_name,
        user_email: waitlistEntry.user_email,
        pass_type: 'waitlist_promotion',
        status: 'confirmed',
      })
      .select()
      .single();

    if (bookingError) throw bookingError;

    // Remove from waitlist
    const { error: removeError } = await supabase
      .from('waitlist')
      .delete()
      .eq('id', waitlistEntry.id);

    if (removeError) throw removeError;

    // Update positions for remaining waitlist entries
    const { error: updateError } = await supabase
      .from('waitlist')
      .update({ position: supabase.sql`position - 1` })
      .eq('class_id', class_id)
      .gt('position', waitlistEntry.position);

    if (updateError) throw updateError;

    // Send notification
    const bookingUrl = `${Deno.env.get('SITE_URL')}/embed/${classData.organization_id}`;
    
    // Call send-email function
    await supabase.functions.invoke('send-email', {
      body: {
        to: waitlistEntry.user_email,
        subject: `Spot Available: ${classData.name}`,
        template: 'waitlist_notification',
        data: {
          user_name: waitlistEntry.user_name,
          class_name: classData.name,
          class_date: new Date(classData.start_time).toLocaleDateString(),
          class_time: new Date(classData.start_time).toLocaleTimeString(),
          booking_url: bookingUrl,
        },
      }
    });

    // Send SMS if phone number available
    if (waitlistEntry.user_phone) {
      await supabase.functions.invoke('send-sms', {
        body: {
          to: waitlistEntry.user_phone,
          message: `🎉 A spot opened up in ${classData.name}! Book now: ${bookingUrl}`,
        }
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        promoted_user: waitlistEntry.user_name,
        booking_id: newBooking.id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Waitlist promotion error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
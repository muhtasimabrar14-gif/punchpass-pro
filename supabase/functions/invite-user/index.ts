import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { organization_id, email, role } = await req.json();

    // Check if user already exists
    const { data: existingUser } = await supabase.auth.admin.getUserByEmail(email);
    
    let userId: string;
    
    if (existingUser.user) {
      // User exists, add them to organization
      userId = existingUser.user.id;
    } else {
      // Create new user with temporary password
      const tempPassword = Math.random().toString(36).slice(-12);
      
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          display_name: email.split('@')[0],
        }
      });
      
      if (createError) throw createError;
      userId = newUser.user.id;
      
      // Send invitation email with login instructions
      await supabase.functions.invoke('send-email', {
        body: {
          to: email,
          subject: 'You\'ve been invited to join a fitness studio team',
          template: 'team_invitation',
          data: {
            email,
            temp_password: tempPassword,
            organization_id,
            role,
            login_url: `${Deno.env.get('SITE_URL')}/auth`,
          },
        }
      });
    }

    // Add user to organization
    const { data, error } = await supabase
      .from('org_members')
      .insert({
        organization_id,
        user_id: userId,
        role,
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, member: data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('User invitation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
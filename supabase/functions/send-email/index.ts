import { corsHeaders } from '../_shared/cors.ts';

const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY');
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'no-reply@punchpasspro.com';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, template, data } = await req.json();

    const emailContent = generateEmailContent(template, data);

    const emailData = {
      personalizations: [{
        to: [{ email: to }],
        subject: subject,
      }],
      from: { email: FROM_EMAIL },
      content: [
        {
          type: 'text/html',
          value: emailContent.html,
        },
        {
          type: 'text/plain',
          value: emailContent.text,
        }
      ],
    };

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.errors?.[0]?.message || 'Failed to send email');
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Email sending error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function generateEmailContent(template: string, data: any) {
  switch (template) {
    case 'booking_confirmation':
      return {
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Booking Confirmed!</h2>
            <p>Hi ${data.user_name},</p>
            <p>Your booking for <strong>${data.class_name}</strong> has been confirmed.</p>
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0;">Class Details:</h3>
              <p><strong>Class:</strong> ${data.class_name}</p>
              <p><strong>Date:</strong> ${data.class_date}</p>
              <p><strong>Time:</strong> ${data.class_time}</p>
              ${data.instructor ? `<p><strong>Instructor:</strong> ${data.instructor}</p>` : ''}
              <p><strong>Price:</strong> $${data.price}</p>
            </div>
            <p>We look forward to seeing you in class!</p>
            <p>Best regards,<br>PunchPass Pro</p>
          </div>
        `,
        text: `
          Booking Confirmed!
          
          Hi ${data.user_name},
          
          Your booking for ${data.class_name} has been confirmed.
          
          Class Details:
          - Class: ${data.class_name}
          - Date: ${data.class_date}
          - Time: ${data.class_time}
          ${data.instructor ? `- Instructor: ${data.instructor}` : ''}
          - Price: $${data.price}
          
          We look forward to seeing you in class!
          
          Best regards,
          PunchPass Pro
        `,
      };

    case 'booking_reminder':
      return {
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Class Reminder</h2>
            <p>Hi ${data.user_name},</p>
            <p>This is a friendly reminder about your upcoming class:</p>
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0;">${data.class_name}</h3>
              <p><strong>Date:</strong> ${data.class_date}</p>
              <p><strong>Time:</strong> ${data.class_time}</p>
              ${data.instructor ? `<p><strong>Instructor:</strong> ${data.instructor}</p>` : ''}
            </div>
            <p>See you there!</p>
            <p>Best regards,<br>PunchPass Pro</p>
          </div>
        `,
        text: `
          Class Reminder
          
          Hi ${data.user_name},
          
          This is a friendly reminder about your upcoming class:
          
          ${data.class_name}
          - Date: ${data.class_date}
          - Time: ${data.class_time}
          ${data.instructor ? `- Instructor: ${data.instructor}` : ''}
          
          See you there!
          
          Best regards,
          PunchPass Pro
        `,
      };

    case 'waitlist_notification':
      return {
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">🎉 Spot Available!</h2>
            <p>Hi ${data.user_name},</p>
            <p>Great news! A spot has opened up in <strong>${data.class_name}</strong>.</p>
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0;">${data.class_name}</h3>
              <p><strong>Date:</strong> ${data.class_date}</p>
              <p><strong>Time:</strong> ${data.class_time}</p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.booking_url}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Book Your Spot Now
              </a>
            </div>
            <p><em>This spot is available on a first-come, first-served basis.</em></p>
            <p>Best regards,<br>PunchPass Pro</p>
          </div>
        `,
        text: `
          🎉 Spot Available!
          
          Hi ${data.user_name},
          
          Great news! A spot has opened up in ${data.class_name}.
          
          Class Details:
          - Date: ${data.class_date}
          - Time: ${data.class_time}
          
          Book your spot now: ${data.booking_url}
          
          This spot is available on a first-come, first-served basis.
          
          Best regards,
          PunchPass Pro
        `,
      };

    default:
      throw new Error(`Unknown email template: ${template}`);
  }
}
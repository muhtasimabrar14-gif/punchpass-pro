import { supabase } from '@/integrations/supabase/client';

export interface EmailTemplate {
  to: string;
  subject: string;
  template: 'booking_confirmation' | 'booking_reminder' | 'booking_cancellation' | 'waitlist_notification';
  data: Record<string, any>;
}

export interface SMSMessage {
  to: string;
  message: string;
  data?: Record<string, any>;
}

export const sendEmail = async (emailData: EmailTemplate) => {
  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: emailData
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
};

export const sendSMS = async (smsData: SMSMessage) => {
  try {
    const { data, error } = await supabase.functions.invoke('send-sms', {
      body: smsData
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to send SMS:', error);
    throw error;
  }
};

export const sendBookingConfirmation = async (booking: {
  user_name: string;
  user_email: string;
  class_name: string;
  class_date: string;
  class_time: string;
  instructor?: string;
  price: number;
}) => {
  return sendEmail({
    to: booking.user_email,
    subject: `Booking Confirmed: ${booking.class_name}`,
    template: 'booking_confirmation',
    data: booking,
  });
};

export const sendBookingReminder = async (booking: {
  user_name: string;
  user_email: string;
  class_name: string;
  class_date: string;
  class_time: string;
  instructor?: string;
}) => {
  return sendEmail({
    to: booking.user_email,
    subject: `Reminder: ${booking.class_name} tomorrow`,
    template: 'booking_reminder',
    data: booking,
  });
};

export const sendWaitlistNotification = async (waitlist: {
  user_name: string;
  user_email: string;
  user_phone?: string;
  class_name: string;
  class_date: string;
  class_time: string;
  booking_url: string;
}) => {
  // Send email notification
  await sendEmail({
    to: waitlist.user_email,
    subject: `Spot Available: ${waitlist.class_name}`,
    template: 'waitlist_notification',
    data: waitlist,
  });

  // Send SMS if phone number is available
  if (waitlist.user_phone) {
    await sendSMS({
      to: waitlist.user_phone,
      message: `🎉 A spot opened up in ${waitlist.class_name} on ${waitlist.class_date}! Book now: ${waitlist.booking_url}`,
      data: waitlist,
    });
  }
};

export const processWaitlistPromotion = async (classId: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('promote-waitlist', {
      body: { class_id: classId }
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to process waitlist promotion:', error);
    throw error;
  }
};
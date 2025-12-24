import nodemailer from 'nodemailer';
import type { Booking } from '@prisma/client';

const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const clinicInbox = process.env.CLINIC_INBOX;

if (!smtpUser || !smtpPass || !clinicInbox) {
  // In dev this will be visible in console; in prod we expect envs to be set.
  // eslint-disable-next-line no-console
  console.warn('SMTP_USER/SMTP_PASS/CLINIC_INBOX not fully configured');
}

const transport = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

// Verify transport connection on startup (non-blocking)
if (smtpUser && smtpPass) {
  transport.verify().then(() => {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log('Email transport verified successfully');
    }
  }).catch((e: unknown) => {
    // eslint-disable-next-line no-console
    console.error('Email transport verification failed:', e);
  });
}

export async function sendNewBookingEmail(booking: Booking) {
  if (!clinicInbox || !smtpUser) return;

  const subject = `New pediatric appointment request - [${booking.visitType === 'CLINIC' ? 'Clinic' : 'Online'}]`;

  const lines = [
    'New pediatric appointment request',
    '',
    `Parent name: ${booking.parentName}`,
    `Parent phone: ${booking.parentPhone}`,
    booking.parentEmail ? `Parent email: ${booking.parentEmail}` : '',
    `Child name: ${booking.childName}`,
    booking.childAgeYears != null ? `Child age (years): ${booking.childAgeYears}` : '',
    booking.childAgeMonths != null ? `Child age (months): ${booking.childAgeMonths}` : '',
    `Visit type: ${booking.visitType}`,
    `Preferred date: ${booking.preferredDate.toISOString()}`,
    `Preferred slot: ${booking.preferredSlot}`,
    booking.reason ? `Reason: ${booking.reason}` : '',
  ].filter(Boolean);

  try {
    await transport.sendMail({
      from: smtpUser,
      to: clinicInbox,
      subject,
      text: lines.join('\n'),
    });
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log('New booking email sent to clinic');
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Failed to send new booking email:', e);
    throw e; // Re-throw so caller knows it failed
  }
}

export async function sendParentConfirmationEmail(booking: Booking) {
  if (!booking.parentEmail || !smtpUser) return;

  const subject = 'Your pediatric appointment request has been received';
  const clinicPhone = process.env.NEXT_PUBLIC_CLINIC_PHONE ?? '';
  const clinicAddress = process.env.NEXT_PUBLIC_CLINIC_ADDRESS ?? '';

  const text = [
    `Dear ${booking.parentName},`,
    '',
    'Thank you for contacting Tender Touch Pediatric Clinic.',
    'We have received your appointment request. Our clinic team will call you shortly to confirm the exact time.',
    '',
    `Preferred date: ${booking.preferredDate.toISOString().slice(0, 10)}`,
    `Preferred slot: ${booking.preferredSlot}`,
    '',
    clinicPhone ? `Clinic phone: ${clinicPhone}` : '',
    clinicAddress ? `Clinic address: ${clinicAddress}` : '',
    '',
    'Warm regards,',
    'Tender Touch Pediatric Clinic',
  ]
    .filter(Boolean)
    .join('\n');

  try {
    await transport.sendMail({
      from: smtpUser,
      to: booking.parentEmail,
      subject,
      text,
    });
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log('Parent confirmation email sent');
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Failed to send parent confirmation email:', e);
    throw e; // Re-throw so caller knows it failed
  }
}



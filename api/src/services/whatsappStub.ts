import type { Booking } from '@prisma/client';

export async function sendBookingConfirmation(booking: Booking) {
  const enabled = process.env.WHATSAPP_ENABLED === 'true';
  if (!enabled) {
    // eslint-disable-next-line no-console
    console.log('WhatsApp disabled; skipping for booking', booking.id);
    return;
  }

  // Placeholder where a real WhatsApp integration would go.
  // eslint-disable-next-line no-console
  console.log('Would send WhatsApp confirmation for booking', booking.id);
}



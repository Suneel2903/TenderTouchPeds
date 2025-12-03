import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma';
import { bookingRateLimiter } from '../middleware/rateLimit';
import { sendNewBookingEmail, sendParentConfirmationEmail } from '../services/mailer';
import { sendBookingConfirmation } from '../services/whatsappStub';

const router = Router();

// GET available time slots (public endpoint for booking form)
router.get('/api/bookings/slots', async (req: Request, res: Response) => {
  try {
    const dateParam = req.query.date as string | undefined;
    const visitType = (req.query.visitType as string | undefined) || 'CLINIC';

    // Check day-level availability if date is provided
    let dayAvailability = null;
    if (dateParam) {
      const date = new Date(dateParam);
      date.setHours(0, 0, 0, 0);
      dayAvailability = await prisma.dayAvailability.findUnique({
        where: { date },
      });

      // If day is marked as UNAVAILABLE, return empty slots
      if (dayAvailability?.availabilityType === 'UNAVAILABLE') {
        return res.json({ slots: [], dayType: 'UNAVAILABLE' });
      }

      // If day is ONLINE_ONLY and visit type is CLINIC, return empty slots
      if (dayAvailability?.availabilityType === 'ONLINE_ONLY' && visitType === 'CLINIC') {
        return res.json({ slots: [], dayType: 'ONLINE_ONLY' });
      }
    }

    // Get all active slots
    const allSlots = await prisma.timeSlot.findMany({
      where: { isActive: true },
      orderBy: { slot: 'asc' },
      include: {
        dateAvailabilities: dateParam
          ? {
              where: {
                date: (() => {
                  const d = new Date(dateParam);
                  d.setHours(0, 0, 0, 0);
                  return d;
                })(),
              },
            }
          : false,
      },
    });

    // Filter slots based on date-specific availability
    let availableSlots = allSlots
      .filter((slot) => {
        if (!dateParam) {
          return true; // No date filter, return all active slots
        }

        // Check date-specific availability override
        const dateAvail = slot.dateAvailabilities?.[0];
        if (dateAvail) {
          return dateAvail.isAvailable;
        }

        // No override, use global active status
        return slot.isActive;
      })
      .map((slot) => slot.slot);

    // Exclude slots that are already booked (CONFIRMED or PENDING bookings)
    if (dateParam) {
      const dateForQuery = new Date(dateParam);
      dateForQuery.setHours(0, 0, 0, 0);
      
      const existingBookings = await prisma.booking.findMany({
        where: {
          preferredDate: dateForQuery,
          preferredSlot: {
            in: availableSlots,
          },
          status: {
            in: ['CONFIRMED', 'PENDING'], // Only block slots with active bookings
          },
        },
        select: {
          preferredSlot: true,
        },
      });

      const bookedSlots = new Set(existingBookings.map((b) => b.preferredSlot));
      availableSlots = availableSlots.filter((slot) => !bookedSlots.has(slot));
    }

    return res.json({
      slots: availableSlots,
      dayType: dayAvailability?.availabilityType || 'AVAILABLE',
    });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to fetch available slots' });
  }
});

const bookingSchema = z.object({
  parentName: z.string().min(2, 'Parent name must be at least 2 characters'),
  parentPhone: z
    .string()
    .regex(/^\d{10}$/, 'Phone number must be exactly 10 digits (no spaces or special characters)'),
  parentEmail: z.string().email('Please enter a valid email address').optional().or(z.literal('')),
  childName: z.string().min(1, 'Please enter your child\'s name'),
  childAgeYears: z.number().int().min(0, 'Age in years cannot be negative').max(21, 'Age in years cannot exceed 21').optional(),
  childAgeMonths: z.number().int().min(0, 'Age in months cannot be negative').max(11, 'Age in months cannot exceed 11').optional(),
  visitType: z.enum(['CLINIC', 'ONLINE'], { errorMap: () => ({ message: 'Please select either In-clinic visit or Online consultation' }) }),
  preferredDate: z.string().min(1, 'Please select a preferred date'),
  preferredSlot: z.string().min(1, 'Please select a time slot'),
  reason: z.string().max(1000, 'Description cannot exceed 1000 characters').optional(),
});

router.post('/api/bookings', bookingRateLimiter, async (req: Request, res: Response) => {
  const parseResult = bookingSchema.safeParse(req.body);
  if (!parseResult.success) {
    const firstError = parseResult.error.errors[0];
    return res.status(400).json({ 
      error: firstError?.message || 'Invalid booking details',
      details: parseResult.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
    });
  }

  const data = parseResult.data;

  const preferredDate = new Date(data.preferredDate);
  if (Number.isNaN(preferredDate.getTime())) {
    return res.status(400).json({ error: 'Invalid date format. Please select a valid date.' });
  }

  // Validate date is in the future
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const selectedDate = new Date(preferredDate);
  selectedDate.setHours(0, 0, 0, 0);
  
  if (selectedDate < now) {
    return res.status(400).json({ error: 'Please select a future date. Past dates are not allowed.' });
  }

  // Validate date is Mon-Sat (0 = Sunday, 6 = Saturday)
  const dayOfWeek = preferredDate.getDay();
  if (dayOfWeek === 0) {
    return res.status(400).json({ error: 'Clinic is closed on Sundays. Please select a date from Monday to Saturday.' });
  }

  // Validate preferredSlot against available slots for this date and visitType
  // This ensures dynamic slots from DB are respected while maintaining backend as source of truth
  const dateForQuery = new Date(preferredDate);
  dateForQuery.setHours(0, 0, 0, 0);
  let dayAvailability = null;
  try {
    dayAvailability = await prisma.dayAvailability.findUnique({
      where: { date: dateForQuery },
    });

    // If day is UNAVAILABLE, reject booking
    if (dayAvailability?.availabilityType === 'UNAVAILABLE') {
      return res.status(400).json({ error: 'The clinic is unavailable on this date. Please choose another day.' });
    }

    // If day is ONLINE_ONLY and visitType is CLINIC, reject booking
    if (dayAvailability?.availabilityType === 'ONLINE_ONLY' && data.visitType === 'CLINIC') {
      return res.status(400).json({ error: 'This date is available for ONLINE consultations only. Please switch to ONLINE or pick another date.' });
    }
  } catch (e) {
    // If day availability check fails, continue (don't block booking)
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn('Failed to check day availability:', e);
    }
  }

  // Get available slots for this date and visitType to validate preferredSlot
  // Reuse the same logic as /api/bookings/slots endpoint
  try {
    const allSlots = await prisma.timeSlot.findMany({
      where: { isActive: true },
      include: {
        dateAvailabilities: {
          where: {
            date: dateForQuery,
          },
        },
      },
    });

    const availableSlots = allSlots
      .filter((slot) => {
        const dateAvail = slot.dateAvailabilities?.[0];
        if (dateAvail) {
          return dateAvail.isAvailable;
        }
        return slot.isActive;
      })
      .map((slot) => slot.slot);

    if (!availableSlots.includes(data.preferredSlot)) {
      return res.status(400).json({ error: 'Selected time slot is no longer available. Please refresh and choose another slot.' });
    }
  } catch (e) {
    // If slot validation fails, log but don't block (defensive)
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn('Failed to validate slot availability:', e);
    }
  }

  const booking = await prisma.booking.create({
    data: {
      parentName: data.parentName,
      parentPhone: data.parentPhone,
      parentEmail: data.parentEmail,
      childName: data.childName,
      childAgeYears: data.childAgeYears ?? null,
      childAgeMonths: data.childAgeMonths ?? null,
      visitType: data.visitType,
      preferredDate,
      preferredSlot: data.preferredSlot,
      reason: data.reason ?? null,
    },
  });

  // Send notifications asynchronously but await them to catch errors
  // This ensures emails are sent before responding to user
  try {
    await Promise.allSettled([
      sendNewBookingEmail(booking),
      sendParentConfirmationEmail(booking),
      sendBookingConfirmation(booking),
    ]);
  } catch (e) {
    // Log but don't fail the booking if email fails
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error('Notification error for booking', booking.id, e);
    }
  }

  return res.json({ success: true });
});

export default router;



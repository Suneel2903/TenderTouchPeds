import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../db/prisma';
import { adminLoginRateLimiter } from '../middleware/rateLimit';
import { requireAdminAuth, type AuthRequest } from '../middleware/auth';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const statusQuerySchema = z
  .string()
  .optional()
  .refine(
    (value: string | undefined) =>
      !value || ['PENDING', 'CONFIRMED', 'CANCELLED', 'VISITED', 'NO_SHOW'].includes(value),
    {
      message: 'Invalid status filter',
    },
  );

router.post('/api/admin/login', adminLoginRateLimiter, async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid login details' });
  }

  const { email, password } = parsed.data;

  const admin = await prisma.adminUser.findUnique({ where: { email } });
  if (!admin) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const ok = await bcrypt.compare(password, admin.password);
  if (!ok) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ error: 'Server misconfiguration' });
  }

  const token = jwt.sign(
    {
      adminId: admin.id,
      email: admin.email,
    },
    secret,
    { expiresIn: '2h' },
  );

  return res.json({ token });
});

router.get('/api/admin/bookings', requireAdminAuth, async (req: Request, res: Response) => {
  const parsedStatus = statusQuerySchema.safeParse(req.query.status as string | undefined);
  if (!parsedStatus.success) {
    return res.status(400).json({ error: 'Invalid status filter' });
  }

  const dateParam = req.query.date as string | undefined;
  const where: Record<string, unknown> = {};

  if (parsedStatus.data) {
    where.status = parsedStatus.data;
  }

  if (dateParam) {
    const date = new Date(dateParam);
    date.setHours(0, 0, 0, 0);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    where.preferredDate = {
      gte: date,
      lt: nextDay,
    };
  }

  const bookings = await prisma.booking.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  // Avoid sending any sensitive internal fields beyond what admin needs.
  return res.json({ bookings });
});

const updateSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'VISITED', 'NO_SHOW']).optional(),
  adminNotes: z.string().max(2000).optional(),
});

router.patch(
  '/api/admin/bookings/:id',
  requireAdminAuth,
  async (req: Request, res: Response) => {
    const bookingId = req.params.id;

    const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid update data' });
  }

    const { status, adminNotes } = parsed.data;

    const data: Record<string, unknown> = {};
    if (status) data.status = status;
    if (adminNotes !== undefined) data.adminNotes = adminNotes;

    try {
      const booking = await prisma.booking.update({
        where: { id: bookingId },
        data,
      });

      const authReq = req as AuthRequest;
      if (authReq.admin) {
        // eslint-disable-next-line no-console
        console.log('Admin booking update', {
          adminId: authReq.admin.adminId,
          bookingId: booking.id,
          status: booking.status,
        });
      }

      return res.json({ booking });
    } catch {
      return res.status(404).json({ error: 'Booking not found' });
    }
  },
);

// Admin-created booking schema (similar to public booking but admin can set initial status)
const adminBookingSchema = z.object({
  parentName: z.string().min(2, 'Parent name must be at least 2 characters'),
  parentPhone: z
    .string()
    .regex(/^\d{10}$/, 'Phone number must be exactly 10 digits'),
  parentEmail: z.string().email('Please enter a valid email address').optional().or(z.literal('')),
  childName: z.string().min(1, 'Please enter child\'s name'),
  childAgeYears: z.number().int().min(0).max(21).optional(),
  childAgeMonths: z.number().int().min(0).max(11).optional(),
  visitType: z.enum(['CLINIC', 'ONLINE']),
  preferredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  preferredSlot: z.string().min(1, 'Please select a time slot'),
  reason: z.string().max(1000).optional(),
  status: z.enum(['PENDING', 'CONFIRMED']).optional().default('CONFIRMED'), // Admin can set initial status
  adminNotes: z.string().max(2000).optional(),
});

// POST /api/admin/bookings - Admin creates a booking directly
router.post('/api/admin/bookings', requireAdminAuth, async (req: Request, res: Response) => {
  const parsed = adminBookingSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid booking data', details: parsed.error.errors });
  }

  const data = parsed.data;

  // Validate date (not in past, not Sunday)
  const preferredDate = new Date(data.preferredDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  preferredDate.setHours(0, 0, 0, 0);

  if (preferredDate < today) {
    return res.status(400).json({ error: 'Please select a future date. Past dates are not allowed.' });
  }

  if (preferredDate.getDay() === 0) {
    return res.status(400).json({ error: 'Clinic is closed on Sundays. Please select a date from Monday to Saturday.' });
  }

  // Check day availability
  const dateForQuery = new Date(data.preferredDate);
  dateForQuery.setHours(0, 0, 0, 0);
  
  let dayAvailability = null;
  try {
    dayAvailability = await prisma.dayAvailability.findUnique({
      where: { date: dateForQuery },
    });

    if (dayAvailability?.availabilityType === 'UNAVAILABLE') {
      return res.status(400).json({ error: 'The clinic is unavailable on this date. Please choose another day.' });
    }

    if (dayAvailability?.availabilityType === 'ONLINE_ONLY' && data.visitType === 'CLINIC') {
      return res.status(400).json({ error: 'This date is available for ONLINE consultations only. Please switch to ONLINE or pick another date.' });
    }
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn('Failed to check day availability:', e);
    }
  }

  // Validate slot availability
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

    // Check if slot is already booked
    const existingBooking = await prisma.booking.findFirst({
      where: {
        preferredDate: dateForQuery,
        preferredSlot: data.preferredSlot,
        status: {
          in: ['CONFIRMED', 'PENDING'],
        },
      },
    });

    if (existingBooking) {
      return res.status(409).json({ error: 'This time slot is already booked. Please select another slot.' });
    }

    if (!availableSlots.includes(data.preferredSlot)) {
      return res.status(400).json({ error: 'Selected time slot is not available. Please refresh and choose another slot.' });
    }
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error('Failed to validate slot availability:', e);
    }
    return res.status(500).json({ error: 'Failed to validate time slot. Please try again.' });
  }

  // Create booking
  try {
    const booking = await prisma.booking.create({
      data: {
        parentName: data.parentName,
        parentPhone: data.parentPhone,
        parentEmail: data.parentEmail || null,
        childName: data.childName,
        childAgeYears: data.childAgeYears ?? null,
        childAgeMonths: data.childAgeMonths ?? null,
        visitType: data.visitType,
        preferredDate: dateForQuery,
        preferredSlot: data.preferredSlot,
        reason: data.reason ?? null,
        status: data.status || 'CONFIRMED',
        adminNotes: data.adminNotes ?? null,
      },
    });

    const authReq = req as AuthRequest;
    if (authReq.admin) {
      // eslint-disable-next-line no-console
      console.log('Admin created booking', {
        adminId: authReq.admin.adminId,
        bookingId: booking.id,
      });
    }

    return res.json({ booking, success: true });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Failed to create admin booking:', e);
    return res.status(500).json({ error: 'Failed to create booking. Please try again.' });
  }
});

export default router;



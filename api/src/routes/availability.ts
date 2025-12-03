import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma';
import { requireAdminAuth, type AuthRequest } from '../middleware/auth';

const router = Router();

const slotSchema = z.object({
  slot: z.string().min(1, 'Slot time is required'),
  isActive: z.boolean().optional().default(true),
});

// GET all available slots (or date-specific availability)
router.get('/api/admin/availability', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const dateParam = req.query.date as string | undefined;
    
    if (dateParam) {
      // Get date-specific availability
      const date = new Date(dateParam);
      date.setHours(0, 0, 0, 0);
      
      const dateAvailabilities = await prisma.dateAvailability.findMany({
        where: { date },
        include: { slot: true },
        orderBy: { slot: { slot: 'asc' } },
      });
      
      // Also get all slots to show which ones aren't set for this date
      const allSlots = await prisma.timeSlot.findMany({
        where: { isActive: true },
        orderBy: { slot: 'asc' },
      });
      
      return res.json({ 
        date: dateParam,
        slots: allSlots.map(slot => {
          const dateAvail = dateAvailabilities.find(da => da.slotId === slot.id);
          return {
            id: slot.id,
            slot: slot.slot,
            isActive: slot.isActive,
            dateAvailability: dateAvail ? {
              id: dateAvail.id,
              isAvailable: dateAvail.isAvailable,
            } : null,
          };
        }),
      });
    } else {
      // Get all slots (global)
      const slots = await prisma.timeSlot.findMany({
        orderBy: [{ slot: 'asc' }],
      });
      return res.json({ slots });
    }
  } catch (e) {
    return res.status(500).json({ error: 'Failed to fetch availability' });
  }
});

// POST create a new slot
router.post('/api/admin/availability', requireAdminAuth, async (req: Request, res: Response) => {
  const parsed = slotSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid slot data', details: parsed.error.errors });
  }

  try {
    const slot = await prisma.timeSlot.create({
      data: {
        slot: parsed.data.slot,
        isActive: parsed.data.isActive ?? true,
      },
    });
    return res.json({ slot });
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'code' in e && e.code === 'P2002') {
      return res.status(409).json({ error: 'This time slot already exists' });
    }
    return res.status(500).json({ error: 'Failed to create slot' });
  }
});

// PATCH update slot (toggle active/inactive or update time)
router.patch('/api/admin/availability/:id', requireAdminAuth, async (req: Request, res: Response) => {
  const slotId = req.params.id;
  const updateSchema = z.object({
    slot: z.string().min(1).optional(),
    isActive: z.boolean().optional(),
  });

  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid update data' });
  }

  try {
    const slot = await prisma.timeSlot.update({
      where: { id: slotId },
      data: parsed.data,
    });
    return res.json({ slot });
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'code' in e && e.code === 'P2025') {
      return res.status(404).json({ error: 'Slot not found' });
    }
    return res.status(500).json({ error: 'Failed to update slot' });
  }
});

// DELETE a slot
router.delete('/api/admin/availability/:id', requireAdminAuth, async (req: Request, res: Response) => {
  const slotId = req.params.id;

  try {
    // First check if slot exists
    const slot = await prisma.timeSlot.findUnique({
      where: { id: slotId },
    });

    if (!slot) {
      return res.status(404).json({ error: 'Slot not found' });
    }

    // Delete the slot (cascade will handle related DateAvailability records)
    await prisma.timeSlot.delete({
      where: { id: slotId },
    });
    return res.json({ success: true });
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'code' in e) {
      if (e.code === 'P2025') {
        return res.status(404).json({ error: 'Slot not found' });
      }
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.error('Delete slot error:', e);
      }
    }
    return res.status(500).json({ error: 'Failed to delete slot. It may be in use.' });
  }
});

// Date-specific availability endpoints

const dateAvailabilitySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  slotId: z.string().min(1, 'Slot ID is required'),
  isAvailable: z.boolean().optional().default(true),
});

// POST set availability for a specific date
router.post('/api/admin/availability/dates', requireAdminAuth, async (req: Request, res: Response) => {
  const parsed = dateAvailabilitySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid date availability data', details: parsed.error.errors });
  }

  try {
    const date = new Date(parsed.data.date);
    date.setHours(0, 0, 0, 0);

    const dateAvailability = await prisma.dateAvailability.upsert({
      where: {
        date_slotId: {
          date,
          slotId: parsed.data.slotId,
        },
      },
      update: {
        isAvailable: parsed.data.isAvailable ?? true,
      },
      create: {
        date,
        slotId: parsed.data.slotId,
        isAvailable: parsed.data.isAvailable ?? true,
      },
      include: { slot: true },
    });

    return res.json({ dateAvailability });
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'code' in e && e.code === 'P2003') {
      return res.status(404).json({ error: 'Slot not found' });
    }
    return res.status(500).json({ error: 'Failed to set date availability' });
  }
});

// PATCH update date availability
router.patch('/api/admin/availability/dates/:id', requireAdminAuth, async (req: Request, res: Response) => {
  const dateAvailId = req.params.id;
  const updateSchema = z.object({
    isAvailable: z.boolean(),
  });

  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid update data' });
  }

  try {
    const dateAvailability = await prisma.dateAvailability.update({
      where: { id: dateAvailId },
      data: { isAvailable: parsed.data.isAvailable },
      include: { slot: true },
    });
    return res.json({ dateAvailability });
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'code' in e && e.code === 'P2025') {
      return res.status(404).json({ error: 'Date availability not found' });
    }
    return res.status(500).json({ error: 'Failed to update date availability' });
  }
});

// DELETE date availability (removes override, falls back to default)
router.delete('/api/admin/availability/dates/:id', requireAdminAuth, async (req: Request, res: Response) => {
  const dateAvailId = req.params.id;

  try {
    // Check if exists first
    const dateAvail = await prisma.dateAvailability.findUnique({
      where: { id: dateAvailId },
    });

    if (!dateAvail) {
      return res.status(404).json({ error: 'Date availability not found' });
    }

    await prisma.dateAvailability.delete({
      where: { id: dateAvailId },
    });
    return res.json({ success: true });
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'code' in e) {
      if (e.code === 'P2025') {
        return res.status(404).json({ error: 'Date availability not found' });
      }
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.error('Delete date availability error:', e);
      }
    }
    return res.status(500).json({ error: 'Failed to delete date availability' });
  }
});

// Day-level availability endpoints

const dayAvailabilitySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  availabilityType: z.enum(['UNAVAILABLE', 'ONLINE_ONLY', 'AVAILABLE']),
});

const bulkDayAvailabilitySchema = z.object({
  dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  availabilityType: z.enum(['UNAVAILABLE', 'ONLINE_ONLY', 'AVAILABLE']),
});

// GET day availability for a month
router.get('/api/admin/availability/days', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const monthParam = req.query.month as string | undefined; // YYYY-MM
    if (!monthParam) {
      return res.status(400).json({ error: 'Month parameter (YYYY-MM) is required' });
    }

    const startDate = new Date(`${monthParam}-01`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    const days = await prisma.dayAvailability.findMany({
      where: {
        date: {
          gte: startDate,
          lt: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });
    return res.json({ 
      days: days.map(d => {
        const dateStr = d.date instanceof Date 
          ? d.date.toISOString().split('T')[0] 
          : new Date(d.date).toISOString().split('T')[0];
        return { date: dateStr, availabilityType: d.availabilityType };
      })
    });
  } catch (e) {
    console.error('Failed to fetch day availability:', e);
    return res.status(500).json({ error: 'Failed to fetch day availability' });
  }
});

// GET day availability for a date
router.get('/api/admin/availability/day/:date', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const dateStr = req.params.date;
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);

    const dayAvailability = await prisma.dayAvailability.findUnique({
      where: { date },
    });

    return res.json({ dayAvailability: dayAvailability || { availabilityType: 'AVAILABLE' } });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to fetch day availability' });
  }
});

// POST/PATCH set day availability (single or bulk)
router.post('/api/admin/availability/days', requireAdminAuth, async (req: Request, res: Response) => {
  // Check if it's bulk operation
  const bulkParsed = bulkDayAvailabilitySchema.safeParse(req.body);
  if (bulkParsed.success) {
    try {
      const results = [];
      for (const dateStr of bulkParsed.data.dates) {
        const date = new Date(dateStr);
        date.setHours(0, 0, 0, 0);

        const dayAvailability = await prisma.dayAvailability.upsert({
          where: { date },
          update: { availabilityType: bulkParsed.data.availabilityType },
          create: {
            date,
            availabilityType: bulkParsed.data.availabilityType,
          },
        });
        results.push(dayAvailability);
      }
      return res.json({ dayAvailabilities: results });
    } catch (e) {
      return res.status(500).json({ error: 'Failed to set bulk day availability' });
    }
  }

  // Single day operation
  const parsed = dayAvailabilitySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid day availability data', details: parsed.error.errors });
  }

  try {
    const date = new Date(parsed.data.date);
    date.setHours(0, 0, 0, 0);

    const dayAvailability = await prisma.dayAvailability.upsert({
      where: { date },
      update: { availabilityType: parsed.data.availabilityType },
      create: {
        date,
        availabilityType: parsed.data.availabilityType,
      },
    });

    return res.json({ dayAvailability });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to set day availability' });
  }
});

// DELETE day availability (removes override)
router.delete('/api/admin/availability/days/:date', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const date = new Date(req.params.date);
    date.setHours(0, 0, 0, 0);

    await prisma.dayAvailability.delete({
      where: { date },
    });
    return res.json({ success: true });
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'code' in e && e.code === 'P2025') {
      return res.status(404).json({ error: 'Day availability not found' });
    }
    return res.status(500).json({ error: 'Failed to delete day availability' });
  }
});

export default router;


import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma';
import { requireAdminAuth } from '../middleware/auth';

const router = Router();

const holidaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  name: z.string().min(1, 'Holiday name is required'),
  isRecurring: z.boolean().optional().default(false),
});

// GET holidays for a year
router.get('/api/admin/holidays', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const yearParam = req.query.year as string | undefined;
    if (!yearParam) {
      return res.status(400).json({ error: 'Year parameter (YYYY) is required' });
    }

    const year = parseInt(yearParam, 10);
    if (Number.isNaN(year) || year < 2000 || year > 2100) {
      return res.status(400).json({ error: 'Invalid year' });
    }

    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    // Get holidays for this year
    const holidays = await prisma.holiday.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });

    // Also get recurring holidays from previous years (they apply to this year too)
    const recurringHolidays = await prisma.holiday.findMany({
      where: {
        isRecurring: true,
      },
      orderBy: { date: 'asc' },
    });

    // Map recurring holidays to this year
    const recurringForYear = recurringHolidays.map((holiday) => {
      const holidayDate = new Date(holiday.date);
      const thisYearDate = new Date(year, holidayDate.getMonth(), holidayDate.getDate());
      return {
        ...holiday,
        date: thisYearDate.toISOString().split('T')[0],
      };
    });

    // Format regular holidays dates as strings
    const formattedHolidays = holidays.map((h) => ({
      ...h,
      date: h.date instanceof Date ? h.date.toISOString().split('T')[0] : new Date(h.date).toISOString().split('T')[0],
    }));

    // Combine and deduplicate
    // Both formattedHolidays and recurringForYear have date as string
    const allHolidays = [...formattedHolidays, ...recurringForYear].filter((h, idx, arr) => {
      const dateStr = h.date as string;
      return arr.findIndex((h2) => {
        const h2DateStr = h2.date as string;
        return h2DateStr === dateStr;
      }) === idx;
    });

    return res.json({ holidays: allHolidays });
  } catch (e) {
    console.error('Failed to fetch holidays:', e);
    return res.status(500).json({ error: 'Failed to fetch holidays' });
  }
});

// POST create holiday
router.post('/api/admin/holidays', requireAdminAuth, async (req: Request, res: Response) => {
  const parsed = holidaySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid holiday data', details: parsed.error.errors });
  }

  try {
    const date = new Date(parsed.data.date);
    date.setHours(0, 0, 0, 0);

    const holiday = await prisma.holiday.create({
      data: {
        date,
        name: parsed.data.name,
        isRecurring: parsed.data.isRecurring ?? false,
      },
    });

    return res.json({ holiday });
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'code' in e && e.code === 'P2002') {
      return res.status(409).json({ error: 'Holiday already exists for this date' });
    }
    console.error('Failed to create holiday:', e);
    return res.status(500).json({ error: 'Failed to create holiday' });
  }
});

// DELETE holiday
router.delete('/api/admin/holidays/:id', requireAdminAuth, async (req: Request, res: Response) => {
  const holidayId = req.params.id;

  try {
    await prisma.holiday.delete({
      where: { id: holidayId },
    });
    return res.json({ success: true });
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'code' in e && e.code === 'P2025') {
      return res.status(404).json({ error: 'Holiday not found' });
    }
    console.error('Failed to delete holiday:', e);
    return res.status(500).json({ error: 'Failed to delete holiday' });
  }
});

export default router;


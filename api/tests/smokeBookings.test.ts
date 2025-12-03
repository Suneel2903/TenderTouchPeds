/**
 * Smoke test for booking API endpoints
 * Tests AVAILABLE, UNAVAILABLE, ONLINE_ONLY day scenarios and admin status changes
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const API_BASE = process.env.API_BASE_URL || 'http://localhost:6060';

// Helper to get a future date (7 days from now, ensuring it's not Sunday)
function getTestDate(daysOffset: number = 7): string {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  // Skip Sundays
  while (date.getDay() === 0) {
    date.setDate(date.getDate() + 1);
  }
  return date.toISOString().split('T')[0];
}

// Helper to make API requests
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const data = await response.json().catch(() => ({}));
  return { status: response.status, data };
}

async function main() {
  console.log('🧪 Starting smoke test for booking API...\n');

  let passed = 0;
  let failed = 0;

  try {
    // Ensure we have at least one active slot
    const existingSlot = await prisma.timeSlot.findFirst({ where: { isActive: true } });
    if (!existingSlot) {
      await prisma.timeSlot.create({
        data: { slot: '11:00 AM', isActive: true },
      });
      console.log('✓ Created test slot: 11:00 AM');
    }

    const testSlot = existingSlot?.slot || '11:00 AM';
    const availableDate = getTestDate(7);
    const unavailableDate = getTestDate(8);
    const onlineOnlyDate = getTestDate(9);

    // Setup: Ensure test dates have correct availability
    const availableDateObj = new Date(availableDate);
    availableDateObj.setHours(0, 0, 0, 0);
    await prisma.dayAvailability.upsert({
      where: { date: availableDateObj },
      update: { availabilityType: 'AVAILABLE' },
      create: { date: availableDateObj, availabilityType: 'AVAILABLE' },
    });

    const unavailableDateObj = new Date(unavailableDate);
    unavailableDateObj.setHours(0, 0, 0, 0);
    await prisma.dayAvailability.upsert({
      where: { date: unavailableDateObj },
      update: { availabilityType: 'UNAVAILABLE' },
      create: { date: unavailableDateObj, availabilityType: 'UNAVAILABLE' },
    });

    const onlineOnlyDateObj = new Date(onlineOnlyDate);
    onlineOnlyDateObj.setHours(0, 0, 0, 0);
    await prisma.dayAvailability.upsert({
      where: { date: onlineOnlyDateObj },
      update: { availabilityType: 'ONLINE_ONLY' },
      create: { date: onlineOnlyDateObj, availabilityType: 'ONLINE_ONLY' },
    });

    console.log(`✓ Test dates configured:
  - AVAILABLE: ${availableDate}
  - UNAVAILABLE: ${unavailableDate}
  - ONLINE_ONLY: ${onlineOnlyDate}\n`);

    // Test 1: AVAILABLE day - booking succeeds
    console.log('Test 1: AVAILABLE day - booking succeeds');
    try {
      const slotsRes = await apiRequest(`/api/bookings/slots?date=${availableDate}&visitType=CLINIC`);
      if (slotsRes.status !== 200 || !Array.isArray(slotsRes.data.slots) || slotsRes.data.slots.length === 0) {
        throw new Error(`Expected slots for ${availableDate}, got: ${JSON.stringify(slotsRes.data)}`);
      }
      const slot = slotsRes.data.slots[0];

      const bookingRes = await apiRequest('/api/bookings', {
        method: 'POST',
        body: JSON.stringify({
          parentName: 'Test Parent',
          parentPhone: '9876543210',
          parentEmail: 'test@example.com',
          childName: 'Test Child',
          childAgeYears: 5,
          visitType: 'CLINIC',
          preferredDate: new Date(availableDate).toISOString(),
          preferredSlot: slot,
          reason: 'Smoke test booking',
        }),
      });

      if (bookingRes.status !== 200 || !bookingRes.data.success) {
        throw new Error(`Booking failed: ${JSON.stringify(bookingRes.data)}`);
      }
      console.log('  ✓ AVAILABLE day booking succeeded\n');
      passed++;
    } catch (e) {
      console.error('  ✗ FAILED:', e instanceof Error ? e.message : String(e));
      failed++;
    }

    // Test 2: UNAVAILABLE day - booking blocked
    console.log('Test 2: UNAVAILABLE day - booking blocked');
    try {
      const slotsRes = await apiRequest(`/api/bookings/slots?date=${unavailableDate}&visitType=CLINIC`);
      if (slotsRes.data.dayType !== 'UNAVAILABLE' && slotsRes.data.slots.length !== 0) {
        throw new Error(`Expected UNAVAILABLE or empty slots, got: ${JSON.stringify(slotsRes.data)}`);
      }

      const bookingRes = await apiRequest('/api/bookings', {
        method: 'POST',
        body: JSON.stringify({
          parentName: 'Test Parent',
          parentPhone: '9876543211',
          childName: 'Test Child',
          visitType: 'CLINIC',
          preferredDate: new Date(unavailableDate).toISOString(),
          preferredSlot: testSlot,
        }),
      });

      if (bookingRes.status < 400) {
        throw new Error(`Expected booking to be rejected, got success: ${JSON.stringify(bookingRes.data)}`);
      }
      console.log('  ✓ UNAVAILABLE day booking correctly blocked\n');
      passed++;
    } catch (e) {
      console.error('  ✗ FAILED:', e instanceof Error ? e.message : String(e));
      failed++;
    }

    // Test 3: ONLINE_ONLY day - CLINIC blocked, ONLINE allowed
    console.log('Test 3: ONLINE_ONLY day - CLINIC blocked, ONLINE allowed');
    try {
      // Check CLINIC slots are empty
      const clinicSlotsRes = await apiRequest(`/api/bookings/slots?date=${onlineOnlyDate}&visitType=CLINIC`);
      if (clinicSlotsRes.data.dayType !== 'ONLINE_ONLY' && clinicSlotsRes.data.slots.length !== 0) {
        throw new Error(`Expected ONLINE_ONLY or empty slots for CLINIC, got: ${JSON.stringify(clinicSlotsRes.data)}`);
      }

      // Check ONLINE slots are available
      const onlineSlotsRes = await apiRequest(`/api/bookings/slots?date=${onlineOnlyDate}&visitType=ONLINE`);
      if (onlineSlotsRes.status !== 200 || !Array.isArray(onlineSlotsRes.data.slots) || onlineSlotsRes.data.slots.length === 0) {
        throw new Error(`Expected slots for ONLINE on ${onlineOnlyDate}, got: ${JSON.stringify(onlineSlotsRes.data)}`);
      }
      const onlineSlot = onlineSlotsRes.data.slots[0];

      // Try CLINIC booking - should fail
      const clinicBookingRes = await apiRequest('/api/bookings', {
        method: 'POST',
        body: JSON.stringify({
          parentName: 'Test Parent',
          parentPhone: '9876543212',
          childName: 'Test Child',
          visitType: 'CLINIC',
          preferredDate: new Date(onlineOnlyDate).toISOString(),
          preferredSlot: testSlot,
        }),
      });

      if (clinicBookingRes.status < 400) {
        throw new Error(`Expected CLINIC booking to be rejected on ONLINE_ONLY day, got success`);
      }

      // Try ONLINE booking - should succeed
      const onlineBookingRes = await apiRequest('/api/bookings', {
        method: 'POST',
        body: JSON.stringify({
          parentName: 'Test Parent',
          parentPhone: '9876543213',
          childName: 'Test Child',
          visitType: 'ONLINE',
          preferredDate: new Date(onlineOnlyDate).toISOString(),
          preferredSlot: onlineSlot,
        }),
      });

      if (onlineBookingRes.status !== 200 || !onlineBookingRes.data.success) {
        throw new Error(`ONLINE booking failed: ${JSON.stringify(onlineBookingRes.data)}`);
      }
      console.log('  ✓ ONLINE_ONLY day: CLINIC blocked, ONLINE allowed\n');
      passed++;
    } catch (e) {
      console.error('  ✗ FAILED:', e instanceof Error ? e.message : String(e));
      failed++;
    }

    // Test 4: Admin changes booking status
    console.log('Test 4: Admin changes booking status');
    try {
      // Login as admin
      const adminEmail = process.env.ADMIN_DEFAULT_EMAIL || 'admin@tendertouchpediatrics.in';
      const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'SetStrongPasswordHere';

      const loginRes = await apiRequest('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ email: adminEmail, password: adminPassword }),
      });

      if (loginRes.status !== 200 || !loginRes.data.token) {
        throw new Error(`Admin login failed: ${JSON.stringify(loginRes.data)}`);
      }

      const token = loginRes.data.token;

      // Get bookings
      const bookingsRes = await apiRequest('/api/admin/bookings', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (bookingsRes.status !== 200 || !Array.isArray(bookingsRes.data.bookings)) {
        throw new Error(`Failed to fetch bookings: ${JSON.stringify(bookingsRes.data)}`);
      }

      const bookings = bookingsRes.data.bookings;
      if (bookings.length === 0) {
        console.log('  ⚠ No bookings found to update (this is OK if database is fresh)');
        passed++;
      } else {
        const bookingId = bookings[0].id;

        // Update booking status
        const updateRes = await apiRequest(`/api/admin/bookings/${bookingId}`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({ status: 'CONFIRMED' }),
        });

        if (updateRes.status !== 200 || updateRes.data.booking.status !== 'CONFIRMED') {
          throw new Error(`Failed to update booking status: ${JSON.stringify(updateRes.data)}`);
        }
        console.log('  ✓ Admin status update succeeded\n');
        passed++;
      }
    } catch (e) {
      console.error('  ✗ FAILED:', e instanceof Error ? e.message : String(e));
      failed++;
    }

    console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

    if (failed > 0) {
      process.exit(1);
    } else {
      console.log('✅ All smoke tests passed!');
      process.exit(0);
    }
  } catch (e) {
    console.error('❌ Smoke test error:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();



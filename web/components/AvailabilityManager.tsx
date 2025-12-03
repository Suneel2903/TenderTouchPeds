'use client';

import { useEffect, useState } from 'react';
import GlobalSlotsView from './GlobalSlotsView';
import DateSpecificView from './DateSpecificView';
import MonthlyCalendarView from './MonthlyCalendarView';
import HolidayList from './HolidayList';

interface TimeSlot {
  id: string;
  slot: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DateSlot extends TimeSlot {
  dateAvailability: {
    id: string;
    isAvailable: boolean;
  } | null;
}

export default function AvailabilityManager() {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:6060';
  const [viewMode, setViewMode] = useState<'global' | 'date' | 'calendar' | 'holidays'>('global');
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [monthDayAvailabilities, setMonthDayAvailabilities] = useState<Record<string, string>>({});
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Global slots state
  const [slots, setSlots] = useState<TimeSlot[]>([]);

  // Date-specific slots state
  const [dateSlots, setDateSlots] = useState<DateSlot[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newSlot, setNewSlot] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingDateId, setTogglingDateId] = useState<string | null>(null);

  useEffect(() => {
    if (viewMode === 'global') {
      fetchSlots();
    } else if (viewMode === 'date') {
      fetchDateSlots();
    } else if (viewMode === 'calendar') {
      fetchMonthAvailability();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, selectedDate, currentMonth]);

  const fetchSlots = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${apiBase}/api/admin/availability`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401) {
        localStorage.removeItem('adminToken');
        window.location.href = '/admin/login';
        return;
      }

      if (!res.ok) {
        throw new Error('Failed to fetch slots');
      }

      const data = await res.json();
      setSlots(data.slots || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load availability');
    } finally {
      setLoading(false);
    }
  };

  const fetchDateSlots = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${apiBase}/api/admin/availability?date=${selectedDate}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401) {
        localStorage.removeItem('adminToken');
        window.location.href = '/admin/login';
        return;
      }

      if (!res.ok) {
        throw new Error('Failed to fetch date availability');
      }

      const data = await res.json();
      setDateSlots(data.slots || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load date availability');
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthAvailability = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const month = currentMonth.toISOString().substring(0, 7); // YYYY-MM
      const res = await fetch(`${apiBase}/api/admin/availability/days?month=${month}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        localStorage.removeItem('adminToken');
        window.location.href = '/admin/login';
        return;
      }

      if (!res.ok) {
        throw new Error('Failed to fetch month availability');
      }

      const data = await res.json();
      const availabilities: Record<string, string> = {};
      (data.days || []).forEach((day: { date: string; availabilityType: string }) => {
        availabilities[day.date] = day.availabilityType || 'AVAILABLE';
      });
      setMonthDayAvailabilities(availabilities);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load month availability');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDayUpdate = async (dates: string[], availabilityType: 'UNAVAILABLE' | 'ONLINE_ONLY' | 'AVAILABLE') => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${apiBase}/api/admin/availability/days`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ dates, availabilityType }),
      });

      if (res.status === 401) {
        localStorage.removeItem('adminToken');
        window.location.href = '/admin/login';
        return;
      }

      if (!res.ok) {
        throw new Error('Failed to update day availability');
      }

      await fetchMonthAvailability();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update day availability');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSlotSelection = (slotId: string) => {
    const newSelected = new Set(selectedSlots);
    if (newSelected.has(slotId)) {
      newSelected.delete(slotId);
    } else {
      newSelected.add(slotId);
    }
    setSelectedSlots(newSelected);
  };

  const handleBulkSlotToggle = async (isAvailable: boolean) => {
    if (selectedSlots.size === 0) return;

    const token = localStorage.getItem('adminToken');
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const promises = Array.from(selectedSlots).map(async (slotId) => {
        const slot = dateSlots.find((s) => s.id === slotId);
        if (!slot) return;

        if (slot.dateAvailability) {
          const res = await fetch(`${apiBase}/api/admin/availability/dates/${slot.dateAvailability.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ isAvailable }),
          });
          return res.ok;
        } else {
          const res = await fetch(`${apiBase}/api/admin/availability/dates`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              date: selectedDate,
              slotId,
              isAvailable,
            }),
          });
          return res.ok;
        }
      });

      await Promise.all(promises);
      setSelectedSlots(new Set());
      await fetchDateSlots();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update slots');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDateAvailability = async (slotId: string, dateAvailId: string | null, currentAvailable: boolean) => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    setTogglingDateId(slotId);
    setError(null);

    try {
      if (dateAvailId) {
        // Update existing date availability
        const res = await fetch(`${apiBase}/api/admin/availability/dates/${dateAvailId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ isAvailable: !currentAvailable }),
        });

        if (res.status === 401) {
          localStorage.removeItem('adminToken');
          window.location.href = '/admin/login';
          return;
        }

        if (!res.ok) {
          throw new Error('Failed to update date availability');
        }
      } else {
        // Create new date availability
        const res = await fetch(`${apiBase}/api/admin/availability/dates`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            date: selectedDate,
            slotId,
            isAvailable: true,
          }),
        });

        if (res.status === 401) {
          localStorage.removeItem('adminToken');
          window.location.href = '/admin/login';
          return;
        }

        if (!res.ok) {
          throw new Error('Failed to set date availability');
        }
      }

      await fetchDateSlots();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update date availability');
    } finally {
      setTogglingDateId(null);
    }
  };

  const handleRemoveDateAvailability = async (dateAvailId: string) => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    setTogglingDateId(dateAvailId);
    setError(null);

    try {
      const res = await fetch(`${apiBase}/api/admin/availability/dates/${dateAvailId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401) {
        localStorage.removeItem('adminToken');
        window.location.href = '/admin/login';
        return;
      }

      if (!res.ok) {
        throw new Error('Failed to remove date availability');
      }

      await fetchDateSlots();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to remove date availability');
    } finally {
      setTogglingDateId(null);
    }
  };

  const formatTime = (timeStr: string) => {
    return timeStr;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Array<{ date: Date; dateStr: string; day: number; isSunday: boolean }> = [];

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split('T')[0];
      days.push({
        date,
        dateStr,
        day,
        isSunday: date.getDay() === 0,
      });
    }

    // Add empty cells for days before month starts
    const startDay = firstDay.getDay();
    for (let i = 0; i < startDay; i++) {
      days.unshift({ date: new Date(), dateStr: '', day: 0, isSunday: false });
    }

    return days;
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="tt-body text-slate-600">Loading availability...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="tt-h3 text-brand-tealDark mb-2">Manage Availability</h2>
        <p className="tt-body text-slate-600">
          Manage global time slots or set date-specific availability overrides.
        </p>
      </div>

      {/* View Mode Toggle */}
      <div className="bg-white rounded-lg shadow-sm p-3">
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => {
              setViewMode('global');
              setSelectedSlots(new Set());
            }}
            className={`px-6 py-2 text-sm font-semibold rounded-full transition-colors ${
              viewMode === 'global'
                ? 'bg-brand-teal text-white'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
          >
            Global Slots
          </button>
          <button
            onClick={() => {
              setViewMode('date');
              setSelectedSlots(new Set());
            }}
            className={`px-6 py-2 text-sm font-semibold rounded-full transition-colors ${
              viewMode === 'date'
                ? 'bg-brand-teal text-white'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
          >
            Date-Specific
          </button>
          <button
            onClick={() => {
              setViewMode('calendar');
              fetchMonthAvailability();
            }}
            className={`px-6 py-2 text-sm font-semibold rounded-full transition-colors ${
              viewMode === 'calendar'
                ? 'bg-brand-teal text-white'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
          >
            Monthly Calendar
          </button>
          <button
            onClick={() => {
              setViewMode('holidays');
            }}
            className={`px-6 py-2 text-sm font-semibold rounded-full transition-colors ${
              viewMode === 'holidays'
                ? 'bg-brand-teal text-white'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
          >
            Holidays
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="tt-small text-red-700">{error}</p>
        </div>
      )}

      {viewMode === 'global' ? (
        <GlobalSlotsView
          apiBase={apiBase}
          slots={slots}
          loading={loading}
          error={error}
          onRefresh={fetchSlots}
          onError={setError}
        />
      ) : viewMode === 'date' ? (
        <DateSpecificView
          apiBase={apiBase}
          selectedDate={selectedDate}
          dateSlots={dateSlots}
          selectedSlots={selectedSlots}
          loading={loading}
          error={error}
          togglingDateId={togglingDateId}
          onDateChange={setSelectedDate}
          onToggleSlotSelection={handleToggleSlotSelection}
          onBulkSlotToggle={handleBulkSlotToggle}
          onClearSelection={() => setSelectedSlots(new Set())}
          onToggleDateAvailability={handleToggleDateAvailability}
          onRemoveDateAvailability={handleRemoveDateAvailability}
          onError={setError}
          formatTime={formatTime}
          formatDate={formatDate}
        />
      ) : viewMode === 'calendar' ? (
        <MonthlyCalendarView
          currentMonth={currentMonth}
          monthDayAvailabilities={monthDayAvailabilities}
          loading={loading}
          onMonthChange={setCurrentMonth}
          onBulkDayUpdate={handleBulkDayUpdate}
          getDaysInMonth={getDaysInMonth}
        />
      ) : (
        <HolidayList apiBase={apiBase} currentYear={currentMonth.getFullYear()} />
      )}
    </div>
  );
}

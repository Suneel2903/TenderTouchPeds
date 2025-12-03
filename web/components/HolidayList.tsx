'use client';

import { useState, useEffect } from 'react';

interface Holiday {
  id: string;
  date: string;
  name: string;
  isRecurring: boolean;
}

interface HolidayListProps {
  apiBase: string;
  currentYear: number;
}

export default function HolidayList({ apiBase, currentYear }: HolidayListProps) {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newHolidayName, setNewHolidayName] = useState('');
  const [newHolidayDate, setNewHolidayDate] = useState('');
  const [newHolidayRecurring, setNewHolidayRecurring] = useState(false);

  useEffect(() => {
    fetchHolidays();
  }, [currentYear, apiBase]);

  const fetchHolidays = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${apiBase}/api/admin/holidays?year=${currentYear}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        localStorage.removeItem('adminToken');
        window.location.href = '/admin/login';
        return;
      }

      if (!res.ok) {
        throw new Error('Failed to fetch holidays');
      }

      const data = await res.json();
      setHolidays(data.holidays || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load holidays');
    } finally {
      setLoading(false);
    }
  };

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHolidayName || !newHolidayDate) return;

    const token = localStorage.getItem('adminToken');
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${apiBase}/api/admin/holidays`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date: newHolidayDate,
          name: newHolidayName,
          isRecurring: newHolidayRecurring,
        }),
      });

      if (res.status === 401) {
        localStorage.removeItem('adminToken');
        window.location.href = '/admin/login';
        return;
      }

      if (!res.ok) {
        throw new Error('Failed to add holiday');
      }

      setNewHolidayName('');
      setNewHolidayDate('');
      setNewHolidayRecurring(false);
      setShowAddForm(false);
      await fetchHolidays();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add holiday');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    if (!confirm('Are you sure you want to delete this holiday?')) return;

    const token = localStorage.getItem('adminToken');
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${apiBase}/api/admin/holidays/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        localStorage.removeItem('adminToken');
        window.location.href = '/admin/login';
        return;
      }

      if (!res.ok) {
        throw new Error('Failed to delete holiday');
      }

      await fetchHolidays();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete holiday');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="tt-h3 text-brand-tealDark">Holidays ({currentYear})</h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="rounded-full bg-brand-pink px-4 py-2 text-sm font-semibold text-white hover:bg-brand-pink/90"
        >
          {showAddForm ? 'Cancel' : '+ Add Holiday'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddHoliday} className="mb-4 p-3 bg-slate-50 rounded-lg">
          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="tt-small text-slate-700 block mb-1">Holiday Name</label>
              <input
                type="text"
                value={newHolidayName}
                onChange={(e) => setNewHolidayName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                required
              />
            </div>
            <div>
              <label className="tt-small text-slate-700 block mb-1">Date</label>
              <input
                type="date"
                value={newHolidayDate}
                onChange={(e) => setNewHolidayDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                required
              />
            </div>
            <div className="flex items-end">
              <label className="tt-small text-slate-700 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newHolidayRecurring}
                  onChange={(e) => setNewHolidayRecurring(e.target.checked)}
                  className="w-4 h-4"
                />
                Recurring (yearly)
              </label>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-3 rounded-full bg-brand-teal px-4 py-2 text-sm font-semibold text-white hover:bg-brand-tealDark disabled:opacity-60"
          >
            Add Holiday
          </button>
        </form>
      )}

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="tt-small text-red-700">{error}</p>
        </div>
      )}

      {loading && holidays.length === 0 ? (
        <p className="tt-body text-slate-600 text-center py-4">Loading holidays...</p>
      ) : holidays.length === 0 ? (
        <p className="tt-body text-slate-600 text-center py-4">No holidays configured for {currentYear}</p>
      ) : (
        <div className="space-y-2">
          {holidays.map((holiday) => (
            <div
              key={holiday.id}
              className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
            >
              <div>
                <p className="tt-body font-semibold text-slate-900">{holiday.name}</p>
                <p className="tt-small text-slate-600">
                  {new Date(holiday.date).toLocaleDateString('en-IN', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                  {holiday.isRecurring && (
                    <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">
                      Recurring
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={() => handleDeleteHoliday(holiday.id)}
                disabled={loading}
                className="rounded-full bg-red-100 text-red-800 px-3 py-1.5 text-sm font-semibold hover:bg-red-200 disabled:opacity-60"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


'use client';

import { useState } from 'react';

interface TimeSlot {
  id: string;
  slot: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface GlobalSlotsViewProps {
  apiBase: string;
  slots: TimeSlot[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onError: (error: string) => void;
}

export default function GlobalSlotsView({
  apiBase,
  slots,
  loading,
  error,
  onRefresh,
  onError,
}: GlobalSlotsViewProps) {
  const [newSlot, setNewSlot] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlot.trim()) return;

    const token = localStorage.getItem('adminToken');
    if (!token) return;

    setIsAdding(true);
    onError('');

    try {
      const res = await fetch(`${apiBase}/api/admin/availability`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ slot: newSlot.trim(), isActive: true }),
      });

      if (res.status === 401) {
        localStorage.removeItem('adminToken');
        window.location.href = '/admin/login';
        return;
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to add slot');
      }

      setNewSlot('');
      onRefresh();
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Failed to add slot');
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleActive = async (slotId: string, currentActive: boolean) => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    setUpdatingId(slotId);
    onError('');

    try {
      const res = await fetch(`${apiBase}/api/admin/availability/${slotId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !currentActive }),
      });

      if (res.status === 401) {
        localStorage.removeItem('adminToken');
        window.location.href = '/admin/login';
        return;
      }

      if (!res.ok) {
        throw new Error('Failed to update slot');
      }

      onRefresh();
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Failed to update slot');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm('Are you sure you want to delete this time slot? This cannot be undone.')) {
      return;
    }

    const token = localStorage.getItem('adminToken');
    if (!token) return;

    setDeletingId(slotId);
    onError('');

    try {
      const res = await fetch(`${apiBase}/api/admin/availability/${slotId}`, {
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
        throw new Error('Failed to delete slot');
      }

      onRefresh();
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Failed to delete slot');
    } finally {
      setDeletingId(null);
    }
  };

  const formatTime = (timeStr: string) => {
    return timeStr;
  };

  return (
    <>
      {/* Add New Slot Form */}
      <div className="bg-white rounded-lg shadow-sm p-3">
        <h3 className="tt-h3 text-brand-tealDark mb-4">Add New Time Slot</h3>
        <form onSubmit={handleAddSlot} className="flex gap-3">
          <input
            type="text"
            value={newSlot}
            onChange={(e) => setNewSlot(e.target.value)}
            placeholder="e.g., 9:00 AM, 10:30 AM"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-teal"
            required
          />
          <button
            type="submit"
            disabled={isAdding}
            className="rounded-full bg-brand-pink px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-pink/90 disabled:opacity-60"
          >
            {isAdding ? 'Adding...' : 'Add Slot'}
          </button>
        </form>
        <p className="tt-small text-slate-500 mt-2">
          Format: Use 12-hour format with AM/PM (e.g., &quot;11:00 AM&quot;, &quot;2:30 PM&quot;)
        </p>
      </div>

      {/* Global Slots List */}
      <div className="bg-white rounded-lg shadow-sm p-3">
        <h3 className="tt-h3 text-brand-tealDark mb-4">Available Time Slots</h3>
        {loading ? (
          <p className="tt-body text-slate-600 text-center py-8">Loading slots...</p>
        ) : slots.length === 0 ? (
          <p className="tt-body text-slate-600 text-center py-8">
            No time slots configured. Add your first slot above.
          </p>
        ) : (
          <div className="space-y-3">
            {slots.map((slot) => (
              <div
                key={slot.id}
                className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                  slot.isActive
                    ? 'border-brand-tealSoft bg-brand-tealSoft/10'
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="tt-body font-semibold text-slate-900">{formatTime(slot.slot)}</span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      slot.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {slot.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(slot.id, slot.isActive)}
                    disabled={updatingId === slot.id}
                    className={`rounded-full px-4 py-2 text-sm font-semibold ${
                      slot.isActive
                        ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                        : 'bg-green-100 text-green-800 hover:bg-green-200'
                    } disabled:opacity-60`}
                  >
                    {updatingId === slot.id
                      ? 'Updating...'
                      : slot.isActive
                        ? 'Deactivate'
                        : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDeleteSlot(slot.id)}
                    disabled={deletingId === slot.id}
                    className="rounded-full bg-red-100 text-red-800 px-4 py-2 text-sm font-semibold hover:bg-red-200 disabled:opacity-60"
                  >
                    {deletingId === slot.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}


'use client';

import { useState } from 'react';

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

interface DateSpecificViewProps {
  apiBase: string;
  selectedDate: string;
  dateSlots: DateSlot[];
  selectedSlots: Set<string>;
  loading: boolean;
  error: string | null;
  togglingDateId: string | null;
  onDateChange: (date: string) => void;
  onToggleSlotSelection: (slotId: string) => void;
  onBulkSlotToggle: (isAvailable: boolean) => void;
  onClearSelection: () => void;
  onToggleDateAvailability: (slotId: string, dateAvailId: string | null, currentAvailable: boolean) => void;
  onRemoveDateAvailability: (dateAvailId: string) => void;
  onError: (error: string) => void;
  formatTime: (timeStr: string) => string;
  formatDate: (dateStr: string) => string;
}

export default function DateSpecificView({
  apiBase,
  selectedDate,
  dateSlots,
  selectedSlots,
  loading,
  error,
  togglingDateId,
  onDateChange,
  onToggleSlotSelection,
  onBulkSlotToggle,
  onClearSelection,
  onToggleDateAvailability,
  onRemoveDateAvailability,
  onError,
  formatTime,
  formatDate,
}: DateSpecificViewProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-3">
      <div className="mb-4">
        <label className="tt-small text-slate-700 block mb-2">Select Date</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => onDateChange(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-teal"
        />
        {selectedDate && (
          <p className="tt-small text-slate-500 mt-2">
            Managing availability for: <strong>{formatDate(selectedDate)}</strong>
          </p>
        )}
      </div>

      <h3 className="tt-h3 text-brand-tealDark mb-4">
        Availability for {selectedDate && formatDate(selectedDate)}
      </h3>
      <p className="tt-small text-slate-600 mb-4">
        Toggle availability for each slot on this specific date. If no override is set, the slot uses its global active/inactive status.
      </p>
      {dateSlots.length === 0 ? (
        <p className="tt-body text-slate-600 text-center py-8">
          No slots available. Add slots in Global Slots view first.
        </p>
      ) : (
        <>
          {selectedSlots.size > 0 && (
            <div className="mb-4 p-4 bg-brand-tealSoft/10 rounded-lg flex items-center justify-between">
              <span className="tt-body text-slate-700">
                {selectedSlots.size} slot{selectedSlots.size > 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => onBulkSlotToggle(true)}
                  disabled={loading}
                  className="rounded-full bg-green-100 text-green-800 px-4 py-2 text-sm font-semibold hover:bg-green-200 disabled:opacity-60"
                >
                  Mark Available
                </button>
                <button
                  onClick={() => onBulkSlotToggle(false)}
                  disabled={loading}
                  className="rounded-full bg-red-100 text-red-800 px-4 py-2 text-sm font-semibold hover:bg-red-200 disabled:opacity-60"
                >
                  Mark Unavailable
                </button>
                <button
                  onClick={onClearSelection}
                  className="rounded-full bg-slate-100 text-slate-700 px-4 py-2 text-sm font-semibold hover:bg-slate-200"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}
          <div className="space-y-3">
            {dateSlots.map((slot) => {
              const hasDateOverride = slot.dateAvailability !== null;
              const isAvailable = hasDateOverride
                ? slot.dateAvailability!.isAvailable
                : slot.isActive; // Fall back to global status

              return (
                <div
                  key={slot.id}
                  className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                    isAvailable
                      ? 'border-brand-tealSoft bg-brand-tealSoft/10'
                      : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      checked={selectedSlots.has(slot.id)}
                      onChange={() => onToggleSlotSelection(slot.id)}
                      className="w-4 h-4 text-brand-teal rounded focus:ring-brand-teal"
                    />
                    <span className="tt-body font-semibold text-slate-900">{formatTime(slot.slot)}</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        isAvailable
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                    {hasDateOverride && (
                      <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                        Date Override
                      </span>
                    )}
                    {!hasDateOverride && (
                      <span className="px-2 py-1 rounded-full text-xs bg-slate-100 text-slate-600">
                        Using Global
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {hasDateOverride ? (
                      <>
                        <button
                          onClick={() =>
                            onToggleDateAvailability(
                              slot.id,
                              slot.dateAvailability!.id,
                              slot.dateAvailability!.isAvailable,
                            )
                          }
                          disabled={togglingDateId === slot.id}
                          className={`rounded-full px-4 py-2 text-sm font-semibold ${
                            isAvailable
                              ? 'bg-red-100 text-red-800 hover:bg-red-200'
                              : 'bg-green-100 text-green-800 hover:bg-green-200'
                          } disabled:opacity-60`}
                        >
                          {togglingDateId === slot.id
                            ? 'Updating...'
                            : isAvailable
                              ? 'Mark Unavailable'
                              : 'Mark Available'}
                        </button>
                        <button
                          onClick={() => onRemoveDateAvailability(slot.dateAvailability!.id)}
                          disabled={togglingDateId === slot.dateAvailability!.id}
                          className="rounded-full bg-slate-100 text-slate-700 px-4 py-2 text-sm font-semibold hover:bg-slate-200 disabled:opacity-60"
                        >
                          {togglingDateId === slot.dateAvailability!.id ? 'Removing...' : 'Remove Override'}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => onToggleDateAvailability(slot.id, null, slot.isActive)}
                        disabled={togglingDateId === slot.id}
                        className="rounded-full bg-brand-pink px-4 py-2 text-sm font-semibold text-white hover:bg-brand-pink/90 disabled:opacity-60"
                      >
                        {togglingDateId === slot.id ? 'Setting...' : 'Set Override'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}



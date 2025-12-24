'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';

interface Booking {
  id: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string | null;
  childName: string;
  childAgeYears: number | null;
  childAgeMonths: number | null;
  visitType: string;
  preferredDate: string;
  preferredSlot: string;
  reason: string | null;
  status: string;
  adminNotes: string | null;
  createdAt: string;
}

interface BookingsManagerProps {
  selectedDate: string;
  statusFilter: string;
  onDateChange: (date: string) => void;
  onStatusFilterChange: (status: string) => void;
}

type SortField = 'preferredDate' | 'preferredSlot' | 'status' | 'childName' | 'createdAt';
type SortDirection = 'asc' | 'desc';

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'CONFIRMED', label: 'Confirmed', color: 'bg-green-100 text-green-800' },
  { value: 'VISITED', label: 'Visited', color: 'bg-blue-100 text-blue-800' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
  { value: 'NO_SHOW', label: 'No Show', color: 'bg-orange-100 text-orange-800' },
];

const getStatusColor = (status: string) => {
  const statusOption = STATUS_OPTIONS.find((s) => s.value === status);
  return statusOption?.color || 'bg-gray-100 text-gray-800';
};

const getStatusLabel = (status: string) => {
  const statusOption = STATUS_OPTIONS.find((s) => s.value === status);
  return statusOption?.label || status.replace('_', ' ');
};

export default function BookingsManager({
  selectedDate,
  statusFilter,
  onDateChange,
  onStatusFilterChange,
}: BookingsManagerProps) {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:6060';
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('preferredDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [editStatus, setEditStatus] = useState<string>('');
  const [editAdminNotes, setEditAdminNotes] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [reschedulingBooking, setReschedulingBooking] = useState<Booking | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchBookings = useCallback(async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (statusFilter) queryParams.append('status', statusFilter);
      if (selectedDate) queryParams.append('date', selectedDate);

      const url = `${apiBase}/api/admin/bookings?${queryParams.toString()}`;

      const res = await fetch(url, {
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
        throw new Error('Failed to fetch bookings');
      }

      const data = await res.json();
      setBookings(data.bookings || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, [apiBase, statusFilter, selectedDate]);

  useEffect(() => {
    fetchBookings();
    setCurrentPage(1); // Reset to first page when filters change
  }, [fetchBookings]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedBookings = [...bookings].sort((a, b) => {
    let aVal: string | number;
    let bVal: string | number;

    switch (sortField) {
      case 'preferredDate':
        aVal = new Date(a.preferredDate).getTime();
        bVal = new Date(b.preferredDate).getTime();
        break;
      case 'preferredSlot':
        aVal = a.preferredSlot;
        bVal = b.preferredSlot;
        break;
      case 'status':
        aVal = a.status;
        bVal = b.status;
        break;
      case 'childName':
        aVal = a.childName.toLowerCase();
        bVal = b.childName.toLowerCase();
        break;
      case 'createdAt':
        aVal = new Date(a.createdAt).getTime();
        bVal = new Date(b.createdAt).getTime();
        break;
      default:
        return 0;
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleEdit = (booking: Booking) => {
    setEditingBooking(booking);
    setEditStatus(booking.status);
    setEditAdminNotes(booking.adminNotes || '');
  };

  const handleSaveEdit = async () => {
    if (!editingBooking) return;

    const token = localStorage.getItem('adminToken');
    if (!token) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`${apiBase}/api/admin/bookings/${editingBooking.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: editStatus,
          adminNotes: editAdminNotes,
        }),
      });

      if (res.status === 401) {
        localStorage.removeItem('adminToken');
        window.location.href = '/admin/login';
        return;
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update booking');
      }

      await fetchBookings();
      setEditingBooking(null);
      setEditStatus('');
      setEditAdminNotes('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update booking');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="text-slate-400">↕</span>;
    return sortDirection === 'asc' ? <span>↑</span> : <span>↓</span>;
  };

  // Pagination calculations
  const totalPages = Math.ceil(sortedBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedBookings = sortedBookings.slice(startIndex, endIndex);

  // Excel export function
  const exportToExcel = () => {
    // Create workbook
    const data = sortedBookings.map((booking) => ({
      'Date': formatDate(booking.preferredDate),
      'Time': booking.preferredSlot,
      'Child Name': booking.childName,
      'Child Age': `${booking.childAgeYears ?? ''}y ${booking.childAgeMonths ?? ''}m`.trim() || 'N/A',
      'Parent Name': booking.parentName,
      'Parent Phone': booking.parentPhone,
      'Parent Email': booking.parentEmail || 'N/A',
      'Visit Type': booking.visitType === 'CLINIC' ? 'In-Clinic' : 'Online',
      'Status': getStatusLabel(booking.status),
      'Reason': booking.reason || 'N/A',
      'Admin Notes': booking.adminNotes || 'N/A',
      'Created At': formatDateTime(booking.createdAt),
    }));

    // Convert to CSV (simpler than Excel, works without external library)
    const headers = Object.keys(data[0] || {});
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = row[header as keyof typeof row];
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `bookings_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="tt-h2 text-brand-tealDark mb-2">Manage Bookings</h2>
        <p className="tt-body text-slate-600">
          View and manage all appointment bookings made through the portal.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <button
          onClick={exportToExcel}
          disabled={sortedBookings.length === 0}
          className="rounded-full bg-brand-teal px-4 py-2 text-sm font-semibold text-white hover:bg-brand-tealDark disabled:opacity-60 disabled:cursor-not-allowed"
        >
          📥 Export to Excel
        </button>
        <button
          onClick={() => {
            setReschedulingBooking(null);
            setShowBookingModal(true);
          }}
          className="rounded-full bg-brand-pink px-4 py-2 text-sm font-semibold text-white hover:bg-brand-pink/90"
        >
          + Book New Appointment
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="tt-small text-slate-700 block mb-1">Filter by Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
            />
          </div>
          <div>
            <label className="tt-small text-slate-700 block mb-1">Filter by Status</label>
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
            >
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                onDateChange('');
                onStatusFilterChange('');
              }}
              className="w-full rounded-full bg-brand-tealSoft px-4 py-2 text-sm font-semibold text-white hover:bg-brand-teal"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="tt-small text-red-700">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <p className="tt-body text-slate-600">Loading bookings...</p>
        </div>
      ) : sortedBookings.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <p className="tt-body text-slate-600">No bookings found for the selected filters.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort('preferredDate')}
                  >
                    <div className="flex items-center gap-2">
                      Date <SortIcon field="preferredDate" />
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort('preferredSlot')}
                  >
                    <div className="flex items-center gap-2">
                      Time <SortIcon field="preferredSlot" />
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort('childName')}
                  >
                    <div className="flex items-center gap-2">
                      Child <SortIcon field="childName" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Parent</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Type</th>
                  <th
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center gap-2">
                      Status <SortIcon field="status" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {paginatedBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-900">
                      {formatDate(booking.preferredDate)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900">{booking.preferredSlot}</td>
                    <td className="px-4 py-3 text-sm text-slate-900">
                      <div>
                        <div className="font-medium">{booking.childName}</div>
                        {(booking.childAgeYears !== null || booking.childAgeMonths !== null) && (
                          <div className="text-xs text-slate-500">
                            {booking.childAgeYears !== null && `${booking.childAgeYears}y `}
                            {booking.childAgeMonths !== null && `${booking.childAgeMonths}m`}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900">{booking.parentName}</td>
                    <td className="px-4 py-3 text-sm text-slate-900">
                      <div>
                        <a
                          href={`tel:${booking.parentPhone}`}
                          className="text-brand-teal hover:underline block"
                        >
                          {booking.parentPhone}
                        </a>
                        {booking.parentEmail && (
                          <a
                            href={`mailto:${booking.parentEmail}`}
                            className="text-brand-teal hover:underline block text-xs"
                          >
                            {booking.parentEmail}
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="inline-block px-2 py-1 rounded-full text-xs bg-brand-tealSoft/20 text-brand-tealDark">
                        {booking.visitType === 'CLINIC' ? 'In-Clinic' : 'Online'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                          booking.status,
                        )}`}
                      >
                        {getStatusLabel(booking.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(booking)}
                          className="text-brand-teal hover:text-brand-tealDark font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setReschedulingBooking(booking);
                            setShowBookingModal(true);
                          }}
                          className="text-brand-pink hover:text-brand-pink/80 font-medium"
                        >
                          Reschedule
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex items-center justify-between">
              <div className="text-sm text-slate-700">
                Showing {startIndex + 1} to {Math.min(endIndex, sortedBookings.length)} of {sortedBookings.length} bookings
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 2 && page <= currentPage + 2)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1 rounded-lg text-sm font-medium ${
                            currentPage === page
                              ? 'bg-brand-teal text-white'
                              : 'border border-slate-300 text-slate-700 hover:bg-white'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (
                      page === currentPage - 3 ||
                      page === currentPage + 3
                    ) {
                      return <span key={page} className="px-2 text-slate-500">...</span>;
                    }
                    return null;
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {editingBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="tt-h3 text-brand-tealDark mb-4">Edit Booking</h3>

              <div className="space-y-4 mb-6">
                <div>
                  <p className="tt-small text-slate-600 mb-1">Child</p>
                  <p className="tt-body text-slate-900">{editingBooking.childName}</p>
                </div>
                <div>
                  <p className="tt-small text-slate-600 mb-1">Parent</p>
                  <p className="tt-body text-slate-900">{editingBooking.parentName}</p>
                </div>
                <div>
                  <p className="tt-small text-slate-600 mb-1">Date & Time</p>
                  <p className="tt-body text-slate-900">
                    {formatDate(editingBooking.preferredDate)} at {editingBooking.preferredSlot}
                  </p>
                </div>
                {editingBooking.reason && (
                  <div>
                    <p className="tt-small text-slate-600 mb-1">Reason</p>
                    <p className="tt-body text-slate-900">{editingBooking.reason}</p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="tt-small text-slate-700 block mb-1">Status*</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="tt-small text-slate-700 block mb-1">Admin Notes</label>
                  <textarea
                    value={editAdminNotes}
                    onChange={(e) => setEditAdminNotes(e.target.value)}
                    rows={4}
                    maxLength={2000}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                    placeholder="Add notes about this booking..."
                  />
                  <p className="tt-small text-slate-500 mt-1">
                    {editAdminNotes.length}/2000 characters
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="flex-1 rounded-full bg-brand-teal px-4 py-2 text-sm font-semibold text-white hover:bg-brand-tealDark disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => {
                    setEditingBooking(null);
                    setEditStatus('');
                    setEditAdminNotes('');
                    setError(null);
                  }}
                  disabled={saving}
                  className="flex-1 rounded-full bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-300 disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Book/Reschedule Appointment Modal */}
      {showBookingModal && (
        <AdminBookingModal
          apiBase={apiBase}
          existingBooking={reschedulingBooking}
          onClose={() => {
            setShowBookingModal(false);
            setReschedulingBooking(null);
          }}
          onSuccess={() => {
            setShowBookingModal(false);
            setReschedulingBooking(null);
            fetchBookings();
          }}
        />
      )}
    </div>
  );
}

// Admin Booking Modal Component
interface AdminBookingModalProps {
  apiBase: string;
  existingBooking: Booking | null;
  onClose: () => void;
  onSuccess: () => void;
}

function AdminBookingModal({ apiBase, existingBooking, onClose, onSuccess }: AdminBookingModalProps) {
  const [parentName, setParentName] = useState(existingBooking?.parentName || '');
  const [parentPhone, setParentPhone] = useState(existingBooking?.parentPhone || '');
  const [parentEmail, setParentEmail] = useState(existingBooking?.parentEmail || '');
  const [childName, setChildName] = useState(existingBooking?.childName || '');
  const [childAgeYears, setChildAgeYears] = useState<string>(existingBooking?.childAgeYears?.toString() || '');
  const [childAgeMonths, setChildAgeMonths] = useState<string>(existingBooking?.childAgeMonths?.toString() || '');
  const [visitType, setVisitType] = useState<'CLINIC' | 'ONLINE'>(existingBooking?.visitType as 'CLINIC' | 'ONLINE' || 'CLINIC');
  const [preferredDate, setPreferredDate] = useState<string>(existingBooking?.preferredDate.split('T')[0] || '');
  const [preferredSlot, setPreferredSlot] = useState<string>(existingBooking?.preferredSlot || '');
  const [reason, setReason] = useState<string>(existingBooking?.reason || '');
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [status, setStatus] = useState<'PENDING' | 'CONFIRMED'>('CONFIRMED');

  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [dayType, setDayType] = useState<'AVAILABLE' | 'UNAVAILABLE' | 'ONLINE_ONLY' | null>(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { minDate, maxDate } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const max = new Date(today);
    max.setDate(max.getDate() + 90);
    return {
      minDate: today.toISOString().split('T')[0],
      maxDate: max.toISOString().split('T')[0],
    };
  }, []);

  // Fetch available slots when date or visit type changes
  useEffect(() => {
    if (!preferredDate) {
      setAvailableSlots([]);
      setDayType(null);
      setIsLoadingSlots(false);
      return;
    }

    setIsLoadingSlots(true);
    setError(null);

    const fetchSlots = async () => {
      try {
        const res = await fetch(`${apiBase}/api/bookings/slots?date=${preferredDate}&visitType=${visitType}`);
        if (res.ok) {
          const data = await res.json();
          setAvailableSlots(data.slots || []);
          setDayType(data.dayType || 'AVAILABLE');
          // Clear selected slot if it's no longer available
          if (data.slots && !data.slots.includes(preferredSlot)) {
            setPreferredSlot('');
          }
        } else {
          setAvailableSlots([]);
          setDayType('AVAILABLE');
          setError('Unable to load available time slots. Please try again.');
        }
      } catch (e) {
        setAvailableSlots([]);
        setDayType('AVAILABLE');
        setError('Unable to load available time slots. Please try again.');
      } finally {
        setIsLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [preferredDate, visitType, apiBase, preferredSlot]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!parentName || !parentPhone || !childName || !preferredDate || !preferredSlot) {
      setError('Please fill in all required fields.');
      return;
    }

    const token = localStorage.getItem('adminToken');
    if (!token) {
      setError('Authentication required. Please log in again.');
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(`${apiBase}/api/admin/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          parentName,
          parentPhone: parentPhone.replace(/\D/g, '').slice(0, 10),
          parentEmail: parentEmail || undefined,
          childName,
          childAgeYears: childAgeYears ? parseInt(childAgeYears, 10) : undefined,
          childAgeMonths: childAgeMonths ? parseInt(childAgeMonths, 10) : undefined,
          visitType,
          preferredDate,
          preferredSlot,
          reason: reason || undefined,
          status,
          adminNotes: adminNotes || undefined,
        }),
      });

      if (res.status === 401) {
        localStorage.removeItem('adminToken');
        window.location.href = '/admin/login';
        return;
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create booking');
      }

      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create booking. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="tt-h3 text-brand-tealDark mb-4">
            {existingBooking ? 'Reschedule Appointment' : 'Book New Appointment'}
          </h3>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="tt-small text-red-700">{error}</p>
            </div>
          )}

          {dayType === 'UNAVAILABLE' && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="tt-small text-red-700 font-semibold">
                The clinic is unavailable on this date. Please choose another day.
              </p>
            </div>
          )}

          {dayType === 'ONLINE_ONLY' && visitType === 'CLINIC' && (
            <div className="mb-4 bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="tt-small text-orange-700 font-semibold">
                This date is available for ONLINE consultations only. Please switch to ONLINE or pick another date.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="tt-small text-slate-700 block mb-1">
                  Parent Name*
                </label>
                <input
                  type="text"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="tt-small text-slate-700 block mb-1">
                  Parent Phone*
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  value={parentPhone}
                  onInput={(e) => {
                    e.currentTarget.value = e.currentTarget.value.replace(/\D/g, '').slice(0, 10);
                    setParentPhone(e.currentTarget.value);
                  }}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="tt-small text-slate-700 block mb-1">
                  Parent Email
                </label>
                <input
                  type="email"
                  value={parentEmail}
                  onChange={(e) => setParentEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                />
              </div>

              <div>
                <label className="tt-small text-slate-700 block mb-1">
                  Child Name*
                </label>
                <input
                  type="text"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="tt-small text-slate-700 block mb-1">
                  Child Age (Years)
                </label>
                <input
                  type="number"
                  min="0"
                  max="21"
                  value={childAgeYears}
                  onChange={(e) => setChildAgeYears(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                />
              </div>

              <div>
                <label className="tt-small text-slate-700 block mb-1">
                  Child Age (Months)
                </label>
                <input
                  type="number"
                  min="0"
                  max="11"
                  value={childAgeMonths}
                  onChange={(e) => setChildAgeMonths(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                />
              </div>

              <div>
                <label className="tt-small text-slate-700 block mb-1">
                  Visit Type*
                </label>
                <select
                  value={visitType}
                  onChange={(e) => setVisitType(e.target.value as 'CLINIC' | 'ONLINE')}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  required
                >
                  <option value="CLINIC">In-Clinic</option>
                  <option value="ONLINE">Online</option>
                </select>
              </div>

              <div>
                <label className="tt-small text-slate-700 block mb-1">
                  Initial Status*
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'PENDING' | 'CONFIRMED')}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  required
                >
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="PENDING">Pending</option>
                </select>
              </div>

              <div>
                <label className="tt-small text-slate-700 block mb-1">
                  Preferred Date*
                </label>
                <input
                  type="date"
                  min={minDate}
                  max={maxDate}
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="tt-small text-slate-700 block mb-1">
                  Preferred Time Slot*
                </label>
                <select
                  value={preferredSlot}
                  onChange={(e) => setPreferredSlot(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 disabled:opacity-60"
                  disabled={!preferredDate || isLoadingSlots || availableSlots.length === 0}
                  required
                >
                  {!preferredDate && <option value="">Select a date first</option>}
                  {isLoadingSlots && <option value="">Loading slots...</option>}
                  {preferredDate && !isLoadingSlots && availableSlots.length === 0 && (
                    <option value="">No slots available</option>
                  )}
                  {availableSlots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="tt-small text-slate-700 block mb-1">
                Reason / Notes
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                maxLength={1000}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                placeholder="Optional: Reason for visit or any notes..."
              />
            </div>

            <div>
              <label className="tt-small text-slate-700 block mb-1">
                Admin Notes
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
                maxLength={2000}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                placeholder="Internal notes (not visible to patient)..."
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="submit"
                disabled={saving || dayType === 'UNAVAILABLE' || (dayType === 'ONLINE_ONLY' && visitType === 'CLINIC')}
                className="flex-1 rounded-full bg-brand-teal px-4 py-2 text-sm font-semibold text-white hover:bg-brand-tealDark disabled:opacity-60"
              >
                {saving ? 'Saving...' : existingBooking ? 'Reschedule' : 'Create Booking'}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="flex-1 rounded-full bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-300 disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

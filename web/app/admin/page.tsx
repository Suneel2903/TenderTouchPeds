'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import AvailabilityManager from '../../components/AvailabilityManager';
import BookingsManager from '../../components/BookingsManager';

type Tab = 'availability' | 'bookings';

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('availability');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    router.push('/admin/login');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full overflow-hidden bg-white border border-brand-tealSoft flex items-center justify-center">
                <Image
                  src="/logo-tender-touch.png"
                  alt="Tender Touch Pediatrics logo"
                  width={48}
                  height={48}
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="flex-1 text-center">
                <h1 className="tt-h3 text-brand-tealDark" style={{ fontSize: '1.725rem' }}>Admin Dashboard</h1>
                <p className="tt-small text-slate-500">Tender Touch Pediatric Clinic</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-full bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-300"
            >
              Logout
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-slate-200">
            <button
              onClick={() => setActiveTab('availability')}
              className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === 'availability'
                  ? 'border-brand-teal text-brand-tealDark'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Availability
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === 'bookings'
                  ? 'border-brand-teal text-brand-tealDark'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Bookings
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'availability' && <AvailabilityManager />}
        {activeTab === 'bookings' && (
          <BookingsManager
            selectedDate={selectedDate}
            statusFilter={statusFilter}
            onDateChange={setSelectedDate}
            onStatusFilterChange={setStatusFilter}
          />
        )}
      </main>
    </div>
  );
}

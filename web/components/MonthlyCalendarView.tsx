'use client';

interface MonthlyCalendarViewProps {
  currentMonth: Date;
  monthDayAvailabilities: Record<string, string>;
  loading: boolean;
  onMonthChange: (month: Date) => void;
  onBulkDayUpdate: (dates: string[], availabilityType: 'UNAVAILABLE' | 'ONLINE_ONLY' | 'AVAILABLE') => void;
  getDaysInMonth: () => Array<{ date: Date; dateStr: string; day: number; isSunday: boolean }>;
}

export default function MonthlyCalendarView({
  currentMonth,
  monthDayAvailabilities,
  loading,
  onMonthChange,
  onBulkDayUpdate,
  getDaysInMonth,
}: MonthlyCalendarViewProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="tt-h3 text-brand-tealDark">
          {currentMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const prevMonth = new Date(currentMonth);
              prevMonth.setMonth(prevMonth.getMonth() - 1);
              onMonthChange(prevMonth);
            }}
            className="rounded-full bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-300"
          >
            ← Previous
          </button>
          <button
            onClick={() => onMonthChange(new Date())}
            className="rounded-full bg-brand-tealSoft px-4 py-2 text-sm font-semibold text-white hover:bg-brand-teal"
          >
            Today
          </button>
          <button
            onClick={() => {
              const nextMonth = new Date(currentMonth);
              nextMonth.setMonth(nextMonth.getMonth() + 1);
              onMonthChange(nextMonth);
            }}
            className="rounded-full bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-300"
          >
            Next →
          </button>
        </div>
      </div>

      {/* Legend at top */}
      <div className="mb-4 p-3 bg-slate-50 rounded-lg">
        <p className="tt-small text-slate-700 mb-2 font-semibold">Legend:</p>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-100 border-2 border-green-300" />
            <span className="tt-small text-slate-600">Available (All appointments)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-amber-100 border-2 border-amber-300" />
            <span className="tt-small text-slate-600">Online Only</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-100 border-2 border-red-300" />
            <span className="tt-small text-slate-600">Unavailable</span>
          </div>
        </div>
        <p className="tt-small text-slate-500 mt-2">
          Click on any date to cycle through: Available → Online Only → Unavailable → Available
        </p>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-4">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center tt-small font-semibold text-slate-600 py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {getDaysInMonth().map((dayInfo, idx) => {
          if (dayInfo.day === 0) {
            return <div key={idx} className="aspect-square" />;
          }

          const availabilityType = monthDayAvailabilities[dayInfo.dateStr] || 'AVAILABLE';
          const isPast = dayInfo.date < new Date(new Date().setHours(0, 0, 0, 0));
          const isSunday = dayInfo.isSunday;

          return (
            <button
              key={dayInfo.dateStr}
              onClick={() => {
                if (isPast || isSunday) return;
                const currentType = availabilityType;
                const nextType =
                  currentType === 'AVAILABLE'
                    ? 'ONLINE_ONLY'
                    : currentType === 'ONLINE_ONLY'
                      ? 'UNAVAILABLE'
                      : 'AVAILABLE';
                onBulkDayUpdate([dayInfo.dateStr], nextType as 'AVAILABLE' | 'ONLINE_ONLY' | 'UNAVAILABLE');
              }}
              disabled={isPast || isSunday}
              className={`aspect-square rounded-lg border-2 flex flex-col items-center justify-center text-sm font-semibold transition-colors ${
                isPast || isSunday
                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                  : availabilityType === 'UNAVAILABLE'
                    ? 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200'
                    : availabilityType === 'ONLINE_ONLY'
                      ? 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200'
                      : 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200'
              }`}
              title={
                isPast
                  ? 'Past date'
                  : isSunday
                    ? 'Clinic closed on Sundays'
                    : availabilityType === 'UNAVAILABLE'
                      ? 'Click to mark as Available'
                      : availabilityType === 'ONLINE_ONLY'
                        ? 'Click to mark as Unavailable'
                        : 'Click to mark as Online Only'
              }
            >
              <span>{dayInfo.day}</span>
              {!isPast && !isSunday && (
                <span className="text-xs mt-1">
                  {availabilityType === 'UNAVAILABLE'
                    ? '❌'
                    : availabilityType === 'ONLINE_ONLY'
                      ? '💻'
                      : '✓'}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}



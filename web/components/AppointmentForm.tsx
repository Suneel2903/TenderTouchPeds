'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// Schema matches backend api/src/routes/bookings.ts exactly
const schema = z.object({
  parentName: z.string().min(2, 'Parent name must be at least 2 characters'),
  parentPhone: z
    .string()
    .regex(/^\d{10}$/, 'Phone number must be exactly 10 digits (no spaces or special characters)'),
  parentEmail: z.string().email('Please enter a valid email address').optional().or(z.literal('')),
  childName: z.string().min(1, 'Please enter your child\'s name'),
  childAgeYears: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : undefined))
    .pipe(z.number().int().min(0, 'Age in years cannot be negative').max(21, 'Age in years cannot exceed 21').optional()),
  childAgeMonths: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : undefined))
    .pipe(z.number().int().min(0, 'Age in months cannot be negative').max(11, 'Age in months cannot exceed 11').optional()),
  visitType: z.enum(['CLINIC', 'ONLINE'], { errorMap: () => ({ message: 'Please select either In-clinic visit or Online consultation' }) }),
  preferredDate: z.string().min(1, 'Please select a preferred date'),
  preferredSlot: z.string().min(1, 'Please select a valid time slot from the dropdown'),
  reason: z.string().max(1000, 'Description cannot exceed 1000 characters').optional()
});

type FormValues = z.infer<typeof schema>;

type DayType = 'AVAILABLE' | 'UNAVAILABLE' | 'ONLINE_ONLY' | null;
type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

export default function AppointmentForm() {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:6060';
  
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [dayType, setDayType] = useState<DayType>(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitState, setSubmitState] = useState<SubmitState>('idle');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      visitType: 'CLINIC'
    }
  });

  const preferredDate = watch('preferredDate');
  const visitType = watch('visitType');

  // Calculate min date (today) and max date (3 months ahead)
  const { minDate, maxDate } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const max = new Date(today);
    max.setDate(max.getDate() + 90);
    return {
      minDate: today.toISOString().split('T')[0],
      maxDate: max.toISOString().split('T')[0]
    };
  }, []);

  const [nextAvailableClinicDate, setNextAvailableClinicDate] = useState<string | null>(null);
  const autoSetOnlineRef = useRef(false);

  // Find next available in-clinic date (memoized to avoid recreating on every render)
  const findNextAvailableClinicDate = useCallback(async (startDate: string) => {
    const start = new Date(startDate);
    start.setDate(start.getDate() + 1);
    
    for (let i = 0; i < 90; i++) {
      const checkDate = new Date(start);
      checkDate.setDate(start.getDate() + i);
      
      // Skip Sundays
      if (checkDate.getDay() === 0) continue;
      
      const dateStr = checkDate.toISOString().split('T')[0];
      
      try {
        const res = await fetch(`${apiBase}/api/bookings/slots?date=${dateStr}&visitType=CLINIC`);
        if (res.ok) {
          const data = await res.json();
          if (data.dayType === 'AVAILABLE' && data.slots && data.slots.length > 0) {
            return dateStr;
          }
        }
      } catch {
        continue;
      }
    }
    return null;
  }, [apiBase]);

  // Fetch available slots when date or visit type changes
  useEffect(() => {
    if (!preferredDate) {
      setAvailableSlots([]);
      setDayType(null);
      setIsLoadingSlots(false);
      setNextAvailableClinicDate(null);
      autoSetOnlineRef.current = false;
      return;
    }
    
    // Reset auto-set flag when date changes
    autoSetOnlineRef.current = false;

    setIsLoadingSlots(true);
    setApiError(null);

    const fetchSlots = async () => {
      try {
        const res = await fetch(`${apiBase}/api/bookings/slots?date=${preferredDate}&visitType=${visitType}`);
        if (res.ok) {
          const data = await res.json();
          setAvailableSlots(data.slots || []);
          const newDayType = data.dayType || 'AVAILABLE';
          setDayType(newDayType);
          
          // Auto-set visitType to ONLINE if day is ONLINE_ONLY and user selected CLINIC
          if (newDayType === 'ONLINE_ONLY' && visitType === 'CLINIC' && !autoSetOnlineRef.current) {
            autoSetOnlineRef.current = true;
            setValue('visitType', 'ONLINE', { shouldDirty: false });
            // Re-fetch slots with ONLINE visitType
            const onlineRes = await fetch(`${apiBase}/api/bookings/slots?date=${preferredDate}&visitType=ONLINE`);
            if (onlineRes.ok) {
              const onlineData = await onlineRes.json();
              setAvailableSlots(onlineData.slots || []);
            }
            // Find next available clinic date
            const nextDate = await findNextAvailableClinicDate(preferredDate);
            setNextAvailableClinicDate(nextDate);
          } else if (newDayType !== 'ONLINE_ONLY') {
            autoSetOnlineRef.current = false;
            setNextAvailableClinicDate(null);
          } else if (newDayType === 'ONLINE_ONLY' && visitType === 'ONLINE') {
            // Find next available clinic date when already on ONLINE
            const nextDate = await findNextAvailableClinicDate(preferredDate);
            setNextAvailableClinicDate(nextDate);
          }
        } else {
          setAvailableSlots([]);
          setDayType('AVAILABLE');
          setApiError('Unable to load available time slots. Please try again.');
        }
      } catch (e) {
        setAvailableSlots([]);
        setDayType('AVAILABLE');
        setApiError('Unable to load available time slots. Please try again.');
      } finally {
        setIsLoadingSlots(false);
      }
    };

    fetchSlots();
    // setValue is stable from react-hook-form, so we don't need to include it
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferredDate, visitType, apiBase, findNextAvailableClinicDate]);

  const onSubmit = async (values: FormValues) => {
    setApiError(null);
    setSubmitState('submitting');

    // Check if date is Sunday
    const selectedDate = new Date(values.preferredDate);
    if (selectedDate.getDay() === 0) {
      setError('preferredDate', {
        type: 'manual',
        message: 'Clinic is closed on Sundays. Please select another day.'
      });
      setSubmitState('error');
      return;
    }

    // Check day availability
    if (dayType === 'UNAVAILABLE') {
      setApiError('The clinic is unavailable on this date. Please choose another day.');
      setSubmitState('error');
      return;
    }

    if (dayType === 'ONLINE_ONLY' && visitType === 'CLINIC') {
      setApiError('This date is available for ONLINE consultations only. Please switch to ONLINE or pick another date.');
      setSubmitState('error');
      return;
    }

    try {
      const payload = {
        parentName: values.parentName,
        parentPhone: values.parentPhone,
        parentEmail: values.parentEmail || undefined,
        childName: values.childName,
        childAgeYears: values.childAgeYears ?? undefined,
        childAgeMonths: values.childAgeMonths ?? undefined,
        visitType: values.visitType,
        preferredDate: new Date(values.preferredDate).toISOString(),
        preferredSlot: values.preferredSlot,
        reason: values.reason || undefined
      };

      const res = await fetch(`${apiBase}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to submit booking');
      }

      setSubmitState('success');
      reset({ visitType: values.visitType });
      setAvailableSlots([]);
      setDayType(null);
    } catch (e) {
      setSubmitState('error');
      setApiError(e instanceof Error ? e.message : 'Something went wrong. Please try again or call the clinic.');
    }
  };

  const isSubmitDisabled = 
    submitState === 'submitting' || 
    dayType === 'UNAVAILABLE' || 
    (dayType === 'ONLINE_ONLY' && visitType === 'CLINIC') ||
    isLoadingSlots ||
    availableSlots.length === 0;

  const showUnavailableWarning = dayType === 'UNAVAILABLE';
  const showOnlineOnlyWarning = dayType === 'ONLINE_ONLY' && visitType === 'CLINIC';
  const showOnlineOnlyInfo = dayType === 'ONLINE_ONLY' && visitType === 'ONLINE';

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      {showUnavailableWarning && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
          <p className="tt-small text-red-800 font-semibold">
            The clinic is unavailable on this date. Please choose another day.
          </p>
        </div>
      )}

      {dayType === 'ONLINE_ONLY' && visitType === 'ONLINE' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="tt-small text-blue-700 font-semibold mb-1">
            Doctor not available for in-clinic consultation today.
          </p>
          {nextAvailableClinicDate && (
            <p className="tt-small text-blue-700">
              Next available in-clinic date: {new Date(nextAvailableClinicDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          )}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="parentName" className="tt-small text-slate-700">
            Parent Name*
          </label>
          <input
            id="parentName"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-teal"
            {...register('parentName')}
          />
          {errors.parentName && (
            <p className="tt-small text-red-600 mt-1">{errors.parentName.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="parentPhone" className="tt-small text-slate-700">
            Parent Phone*
          </label>
          <input
            id="parentPhone"
            type="tel"
            maxLength={10}
            onInput={(e) => {
              e.currentTarget.value = e.currentTarget.value.replace(/\D/g, '').slice(0, 10);
            }}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-teal"
            {...register('parentPhone')}
          />
          {errors.parentPhone && (
            <p className="tt-small text-red-600 mt-1">{errors.parentPhone.message}</p>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="parentEmail" className="tt-small text-slate-700">
            Parent Email (Optional)
          </label>
          <input
            id="parentEmail"
            type="email"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-teal"
            {...register('parentEmail')}
          />
          {errors.parentEmail && (
            <p className="tt-small text-red-600 mt-1">{errors.parentEmail.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="childName" className="tt-small text-slate-700">
            Child Name*
          </label>
          <input
            id="childName"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-teal"
            {...register('childName')}
          />
          {errors.childName && (
            <p className="tt-small text-red-600 mt-1">{errors.childName.message}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label htmlFor="childAgeYears" className="tt-small text-slate-700">
            Child Age (Years)
          </label>
          <input
            id="childAgeYears"
            type="number"
            min={0}
            max={21}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-teal"
            {...register('childAgeYears')}
          />
          {errors.childAgeYears && (
            <p className="tt-small text-red-600 mt-1">{errors.childAgeYears.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="childAgeMonths" className="tt-small text-slate-700">
            Child Age (Months)
          </label>
          <input
            id="childAgeMonths"
            type="number"
            min={0}
            max={11}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-teal"
            {...register('childAgeMonths')}
          />
          {errors.childAgeMonths && (
            <p className="tt-small text-red-600 mt-1">{errors.childAgeMonths.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="visitType" className="tt-small text-slate-700">
            Visit Type*
          </label>
          <select
            id="visitType"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-teal"
            {...register('visitType')}
          >
            <option value="CLINIC">In-clinic visit</option>
            <option value="ONLINE">Online consultation</option>
          </select>
          {errors.visitType && (
            <p className="tt-small text-red-600 mt-1">{errors.visitType.message}</p>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="preferredDate" className="tt-small text-slate-700">
            Preferred Date*
          </label>
          <input
            id="preferredDate"
            type="date"
            min={minDate}
            max={maxDate}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-teal"
            {...register('preferredDate')}
          />
          {errors.preferredDate && (
            <p className="tt-small text-red-600 mt-1">{errors.preferredDate.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="preferredSlot" className="tt-small text-slate-700">
            Preferred Time Slot*
          </label>
          <select
            id="preferredSlot"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-teal disabled:opacity-60 disabled:cursor-not-allowed"
            {...register('preferredSlot')}
            disabled={!preferredDate || isLoadingSlots || availableSlots.length === 0}
          >
            {!preferredDate && <option value="">Select a date first</option>}
            {isLoadingSlots && <option value="">Loading slots...</option>}
            {preferredDate && !isLoadingSlots && availableSlots.length === 0 && dayType === 'AVAILABLE' && (
              <option value="">No slots available for this date</option>
            )}
            {preferredDate && !isLoadingSlots && availableSlots.length > 0 && (
              <>
                <option value="">Select a time slot</option>
                {availableSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </>
            )}
          </select>
          {errors.preferredSlot && (
            <p className="tt-small text-red-600 mt-1">{errors.preferredSlot.message}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="reason" className="tt-small text-slate-700">
          Briefly Describe The Concern (Optional, Max 1000 Characters)
        </label>
        <textarea
          id="reason"
          rows={4}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-teal"
          {...register('reason')}
        />
        {errors.reason && (
          <p className="tt-small text-red-600 mt-1">{errors.reason.message}</p>
        )}
      </div>


      {submitState === 'success' && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <p className="tt-small text-emerald-800 font-semibold">
            Your appointment request has been received. Our clinic will call you to confirm the exact time.
          </p>
        </div>
      )}

      {apiError && submitState === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="tt-small text-red-800 font-semibold">{apiError}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitDisabled}
        className="w-full md:w-auto rounded-full bg-brand-pink px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-pink/90 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {submitState === 'submitting' ? 'Submitting…' : 'Request Appointment'}
      </button>
    </form>
  );
}



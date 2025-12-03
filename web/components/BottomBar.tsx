'use client';

export default function BottomBar() {
  const phone = process.env.NEXT_PUBLIC_CLINIC_PHONE ?? '';

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 bg-white border-t border-slate-200 md:hidden">
      <div className="flex">
        {phone && (
          <a
            href={`tel:${phone}`}
            className="flex-1 py-3 text-center text-sm font-semibold text-brand-tealDark"
          >
            Call
          </a>
        )}
        <a
          href="#appointments"
          className="flex-1 py-3 text-center text-sm font-semibold bg-brand-pink text-white"
        >
          Book
        </a>
      </div>
    </div>
  );
}



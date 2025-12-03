'use client';

import { useMemo } from 'react';

export default function FloatingActions() {
  const phone = process.env.NEXT_PUBLIC_CLINIC_PHONE ?? '';

  const whatsappHref = useMemo(() => {
    if (!phone) return '';
    const digits = phone.replace(/[^0-9]/g, '');
    return `https://wa.me/${digits}`;
  }, [phone]);

  if (!phone) return null;

  return (
    <div className="fixed z-40 right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3 md:gap-2">
      <a
        href={`tel:${phone}`}
        className="h-12 w-12 rounded-full bg-brand-pink shadow-lg flex items-center justify-center text-white text-lg md:h-10 md:w-10"
        aria-label="Call clinic"
      >
        ☎
      </a>
      {whatsappHref && (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noreferrer"
          className="h-12 w-12 rounded-full bg-brand-teal shadow-lg flex items-center justify-center text-white text-lg md:h-10 md:w-10"
          aria-label="WhatsApp clinic"
        >
          {/* Simple WhatsApp-style glyph without external assets */}
          🟢
        </a>
      )}
    </div>
  );
}



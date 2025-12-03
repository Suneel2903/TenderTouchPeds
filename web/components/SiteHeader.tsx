'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const navItems = [
  { href: '#top', label: 'Home', id: 'top' },
  { href: '#about-clinic', label: 'About the Clinic', id: 'about-clinic' },
  { href: '#services', label: 'Services', id: 'services' },
  { href: '#appointments', label: 'Appointments', id: 'appointments' },
  { href: '#reviews', label: 'Reviews', id: 'reviews' },
  { href: '#contact', label: 'Contact', id: 'contact' }
];

const sectionItems = navItems.filter((item) => item.id !== 'top');

export default function SiteHeader() {
  const phone = process.env.NEXT_PUBLIC_CLINIC_PHONE ?? '';
  const [activeId, setActiveId] = useState<string>('top');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            if (id) setActiveId(id);
          }
        });
      },
      {
        root: null,
        threshold: 0.3
      }
    );

    sectionItems.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    const handleScroll = () => {
      if (window.scrollY < 120) {
        setActiveId('top');
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <header
      id="top"
      className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-200"
      aria-label="Main navigation"
    >
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
        <Link href="#top" className="flex items-center gap-4">
          <div className="h-14 w-14 md:h-16 md:w-16 rounded-full overflow-hidden bg-white border border-brand-tealSoft flex items-center justify-center">
            <Image
              src="/logo-tender-touch.png"
              alt="Tender Touch Pediatrics logo"
              width={64}
              height={64}
              className="h-full w-full object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span className="whitespace-nowrap text-3xl md:text-4xl font-semibold text-brand-tealDark leading-tight">
              Tender Touch Pediatrics
            </span>
            <span className="text-xs text-slate-500">Kokapet, Hyderabad</span>
          </div>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm md:text-base">
          {navItems.map((item) => {
            const isActive = activeId === item.id;
            return (
              <a
                key={item.href}
                href={item.href}
                className={
                  isActive
                    ? 'whitespace-nowrap rounded-full px-3 py-0.5 bg-gradient-to-r from-brand-tealSoft to-brand-teal text-white font-semibold shadow-sm'
                    : 'whitespace-nowrap rounded-full px-3 py-0.5 text-brand-tealDark hover:bg-brand-tealSoft/10'
                }
              >
                {item.label}
              </a>
            );
          })}
          {/* Call CTA moved to floating buttons / bottom bar to keep header clean */}
        </nav>
      </div>
    </header>
  );
}



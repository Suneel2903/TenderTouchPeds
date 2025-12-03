/* eslint-disable jsx-a11y/alt-text */
'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import AnimatedOnScroll from './AnimatedOnScroll';

const galleryImages = ['/1.jpg', '/2.jpg', '/3.jpg', '/4.jpg'];

export default function AboutClinicSection() {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const next = () => setIndex((prev) => (prev + 1) % galleryImages.length);
  const prev = () => setIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0]?.clientX - touchStartX.current;
    if (dx > 40) prev();
    if (dx < -40) next();
    touchStartX.current = null;
  };

  return (
    <section id="about-clinic" className="py-10 md:py-14 bg-animated-pink">
      <div className="mx-auto max-w-7xl px-6 grid md:grid-cols-2 gap-10 items-start">
        <AnimatedOnScroll direction="left">
          <div>
            <h2 className="tt-h2 mb-3 text-brand-tealDark">About the Clinic</h2>
            <p className="tt-body mb-3">
              Tender Touch Pediatric Clinic is a calm, child-friendly space in Kokapet, Hyderabad,
              created to make doctor visits easier for both children and parents. From the waiting
              area to the consultation room, everything is designed to feel gentle, warm, and
              unhurried.
            </p>
            <p className="tt-body mb-3">
              The clinic is led by Dr. S M Deepthi, an American Board Certified Pediatrician with
              MD Pediatrics (USA) and over 15 years of experience. Her approach is to listen first,
              explain clearly, and avoid unnecessary medicines or tests.
            </p>
            <p className="tt-body">
              We primarily serve families from Kokapet, Gandipet, Narsingi, the Financial District,
              and nearby areas in Hyderabad, but parents from across the city are welcome.
            </p>
          </div>
        </AnimatedOnScroll>
        <AnimatedOnScroll direction="right">
          <div
            className="rounded-2xl border border-brand-tealSoft/60 bg-white/70 p-3 flex flex-col items-center gap-3 relative overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className="relative w-full aspect-video overflow-hidden rounded-xl bg-slate-200">
              <Image
                src={galleryImages[index]}
                alt={`Clinic photo ${index + 1}`}
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
            <button
              type="button"
              onClick={prev}
              aria-label="Previous image"
              className="absolute inset-y-6 left-2 w-8 bg-black/10 hover:bg-black/20 text-white flex items-center justify-center rounded-full"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next image"
              className="absolute inset-y-6 right-2 w-8 bg-black/10 hover:bg-black/20 text-white flex items-center justify-center rounded-full"
            >
              ›
            </button>
            <div className="flex gap-1 mt-2">
              {galleryImages.map((_, i) => (
                // eslint-disable-next-line react/no-array-index-key
                <button
                  key={i}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={
                    i === index
                      ? 'h-2 w-2 rounded-full bg-brand-pink'
                      : 'h-2 w-2 rounded-full bg-slate-300'
                  }
                  aria-label={`Go to image ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </AnimatedOnScroll>
      </div>
    </section>
  );
}


import Link from 'next/link';
import Image from 'next/image';

export default function HeroSection() {
  const phone = process.env.NEXT_PUBLIC_CLINIC_PHONE ?? '';
  const reviewsUrl = process.env.NEXT_PUBLIC_GOOGLE_MAPS_URL ?? '#reviews';

  return (
    <section className="bg-animated-teal text-white">
      <div className="mx-auto max-w-7xl px-6 py-8 md:py-12 grid md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)] gap-10 items-center">
        <div className="order-1 md:order-none flex justify-center md:justify-start motion-safe:animate-fade-in-left">
          <div className="w-56 h-56 md:w-64 md:h-64 rounded-full overflow-hidden border-4 border-brand-pink">
            <Image
              src="/dr-deepthi.jpg"
              alt="Dr. S M Deepthi at Tender Touch Pediatrics"
              width={256}
              height={256}
              priority
              className="h-full w-full object-cover"
            />
          </div>
        </div>
        <div className="order-2 md:order-none motion-safe:animate-fade-in-right self-center">
          <h1 className="tt-h1 mb-3 text-brand-pink">Dr. S M Deepthi</h1>
          <p className="tt-subtitle mb-1">
            American Board Certified Pediatrician
          </p>
          <p className="tt-subtitle mb-1">MD Pediatrics (USA)</p>
          <p className="tt-subtitle mb-4">15+ years of pediatric experience</p>
          <p className="text-sm md:text-base mb-4 max-w-2xl leading-relaxed">
            Whether your child is due for vaccines, feeling unwell, or you simply need clarity
            about their growth, this is a calm, child-friendly space where you&apos;ll be heard and
            your concerns are taken seriously. We follow gentle, evidence-based pediatric care and
            explain what is truly needed in clear, simple language.
          </p>
          <p className="text-sm md:text-base mb-4 max-w-2xl leading-relaxed">
            Serving families from Kokapet, Gandipet, the Financial District, and surrounding areas
            in Hyderabad. Not for emergencies – in case of emergency, please visit the nearest
            hospital.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="#appointments"
              className="inline-flex items-center rounded-full bg-brand-pink px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-brand-pink/90"
            >
              Book an Appointment
            </a>
            <Link
              href={reviewsUrl}
              target="_blank"
              className="inline-flex items-center rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold text-white border border-white/30 hover:bg-white/20"
            >
              Read Google Reviews
            </Link>
            {phone && (
              <a
                href={`tel:${phone}`}
                className="inline-flex items-center rounded-full bg-transparent px-5 py-2.5 text-sm font-semibold text-white border border-white/40 hover:bg-white/10"
              >
                Call Clinic
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}



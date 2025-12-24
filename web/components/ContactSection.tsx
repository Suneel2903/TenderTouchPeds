import Link from 'next/link';

export default function ContactSection() {
  const phone = process.env.NEXT_PUBLIC_CLINIC_PHONE ?? '+918121666387';
  const email = 'info.tendertouchpeds@gmail.com';
  const clinicAddress =
    process.env.NEXT_PUBLIC_CLINIC_ADDRESS ??
    'Shop No. 111, Ground Floor, Kokapet Terminal Building, Radha Spaces, Gandipet Main Road, Kokapet, Hyderabad';
  const mapsUrl = process.env.NEXT_PUBLIC_GOOGLE_MAPS_URL ?? '#';

  return (
    <section id="contact" className="py-10 md:py-14 bg-white">
      <div className="mx-auto max-w-7xl px-6 grid md:grid-cols-2 gap-10">
        <div className="motion-safe:animate-fade-in-left">
          <h2 className="tt-h2 mb-3 text-brand-tealDark">Contact & Location</h2>
          <p className="tt-body mb-3">
            <strong>Tender Touch Pediatric Clinic</strong>
          </p>
          <p className="tt-body mb-2">
            <strong>Address:</strong>
            <br />
            {clinicAddress}
          </p>
          <p className="tt-body mb-2">
            <strong>Phone:</strong>{' '}
            <a href={`tel:${phone}`} className="text-brand-teal underline">
              {phone}
            </a>
          </p>
          <p className="tt-body mb-2">
            <strong>Email:</strong>{' '}
            <a href={`mailto:${email}`} className="text-brand-teal underline">
              {email}
            </a>
          </p>
          <p className="tt-body mb-2">
            <strong>Clinic hours:</strong> Mon–Sat, 11:00 AM – 2:00 PM & 5:00 PM – 8:00 PM
          </p>
        </div>
        <div className="space-y-3 motion-safe:animate-fade-in-right">
          <Link
            href={mapsUrl}
            target="_blank"
            className="inline-flex items-center rounded-full bg-brand-tealDark px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-brand-teal"
          >
            Open in Google Maps
          </Link>
          <div className="aspect-video w-full rounded-2xl border border-slate-200 overflow-hidden">
            <iframe
              title="Tender Touch Pediatric Clinic location"
              src={mapsUrl}
              className="h-full w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
      <footer className="mt-8 border-t border-brand-tealSoft/40 bg-brand-tealSoft/10 pt-4 pb-4 text-center tt-small text-slate-700">
        <p>© 2025 Tender Touch Pediatric Clinic. All rights reserved.</p>
        <p>Information on this site is for general awareness and not a substitute for a doctor visit.</p>
      </footer>
    </section>
  );
}



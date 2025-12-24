import Link from 'next/link';

export default function ContactSection() {
  const phone = process.env.NEXT_PUBLIC_CLINIC_PHONE ?? '+918121666387';
  const email = 'info.tendertouchpeds@gmail.com';
  const clinicAddress =
    process.env.NEXT_PUBLIC_CLINIC_ADDRESS ??
    'Shop No. 111, Ground Floor, Kokapet Terminal Building, Radha Spaces, Gandipet Main Road, Kokapet, Hyderabad';
  // Embed URL for iframe (must be an embed URL from Google Maps "Share" > "Embed a map")
  const mapsEmbedUrl =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_URL ||
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3807.548492475724!2d78.32731307493462!3d17.385445983501402!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb95a56a3c56bb%3A0xe771f72337243a2d!2sDr.%20Deepthi%E2%80%99s%20Tender%20Touch%20Pediatrics!5e0!3m2!1sen!2sin!4v1766553871049!5m2!1sen!2sin';
  
  // Share URL for "Open in Google Maps" link (regular Google Maps URL)
  const mapsShareUrl =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_SHARE_URL ||
    'https://maps.google.com/?q=Shop+No.+111,+Ground+Floor,+Kokapet+Terminal+Building,+Radha+Spaces,+Gandipet+Main+Road,+Kokapet,+Hyderabad';

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
          <a
            href={mapsShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-full bg-brand-tealDark px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-brand-teal"
          >
            Open in Google Maps
          </a>
          <div className="aspect-video w-full rounded-2xl border border-slate-200 overflow-hidden">
            <iframe
              title="Tender Touch Pediatric Clinic location"
              src={mapsEmbedUrl}
              className="h-full w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
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



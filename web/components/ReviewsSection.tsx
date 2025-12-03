import Link from 'next/link';

export default function ReviewsSection() {
  const reviewsUrl = process.env.NEXT_PUBLIC_GOOGLE_MAPS_URL ?? '#';

  return (
    <section id="reviews" className="py-10 md:py-14 bg-animated-pink">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="tt-h2 mb-3 text-brand-tealDark motion-safe:animate-fade-in-left">
          What Parents Say
        </h2>
        <p className="tt-body mb-6 motion-safe:animate-fade-in-left">
          Instead of hearing from us, hear from parents who have brought their children to the
          clinic.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm motion-safe:animate-fade-in-right">
            <p className="tt-small text-slate-700">
              “Doctor patiently listened to all our concerns about our toddler&apos;s feeding and
              sleep. We left feeling calmer and with a clear plan.”
            </p>
            <p className="tt-small mt-2 text-slate-500">— Parent of a 2-year-old</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm motion-safe:animate-fade-in-right">
            <p className="tt-small text-slate-700">
              “Very gentle with vaccines. My child was surprisingly relaxed, and everything was
              explained before giving any injection.”
            </p>
            <p className="tt-small mt-2 text-slate-500">— Parent of a 6-month-old</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm motion-safe:animate-fade-in-right">
            <p className="tt-small text-slate-700">
              “We appreciated the honest guidance about what is truly needed and what can be
              avoided. No unnecessary medicines or tests.”
            </p>
            <p className="tt-small mt-2 text-slate-500">— Parent of a 10-year-old</p>
          </article>
        </div>
        <div className="mt-6 motion-safe:animate-fade-in-right">
          <Link
            href={reviewsUrl}
            target="_blank"
            className="inline-flex items-center rounded-full border border-brand-tealSoft px-5 py-2.5 text-sm font-semibold text-brand-tealDark hover:bg-brand-tealSoft/10"
          >
            Read all reviews on Google
          </Link>
        </div>
      </div>
    </section>
  );
}



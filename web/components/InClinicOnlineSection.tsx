export default function InClinicOnlineSection() {
  const clinicAddress =
    process.env.NEXT_PUBLIC_CLINIC_ADDRESS ??
    'Shop No. 111, Ground Floor, Kokapet Terminal Building, Radha Spaces, Gandipet Main Road, Kokapet, Hyderabad';

  return (
    <section className="py-10 md:py-14 bg-brand-tealDark text-white">
      <div className="mx-auto max-w-6xl px-4 grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="tt-h2 mb-3">In-Clinic Visits</h2>
          <p className="tt-body mb-3">
            Tender Touch Pediatric Clinic is located in Kokapet, Hyderabad, easily accessible from
            Gandipet and the Financial District.
          </p>
          <p className="tt-body mb-2">
            <strong>Timings:</strong> 11:00 AM – 2:00 PM, 5:00 PM – 8:00 PM (Monday to Saturday)
          </p>
          <p className="tt-body mb-2">
            <strong>Address:</strong> {clinicAddress}
          </p>
          <p className="tt-small text-white/80">
            Parking is available nearby. Please arrive a few minutes early for the first visit so
            that you have enough time to settle in and share your child&apos;s history.
          </p>
        </div>
        <div>
          <h2 className="tt-h2 mb-3">Online Pediatric Consultations</h2>
          <p className="tt-body mb-3">
            For suitable concerns, online consultations are available for families who prefer not to
            travel or live further away.
          </p>
          <p className="tt-body mb-2">
            <strong>Timings:</strong> 8:00 AM – 8:00 PM (by prior booking)
          </p>
          <p className="tt-body mb-2">
            Online visits are best for follow-ups, non-emergency issues, growth and development
            discussions, and review of reports. If an in-person examination is needed, this will be
            clearly communicated.
          </p>
          <p className="tt-small text-white/80">
            Online consultations are not suitable for medical emergencies. Please visit the nearest
            hospital in an emergency.
          </p>
        </div>
      </div>
    </section>
  );
}



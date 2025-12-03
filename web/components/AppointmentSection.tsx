import AppointmentForm from './AppointmentForm';
import AnimatedOnScroll from './AnimatedOnScroll';

export default function AppointmentSection() {
  return (
    <section id="appointments" className="py-10 md:py-14 bg-animated-teal text-white">
      <div className="mx-auto max-w-7xl px-6 grid md:grid-cols-2 gap-10 items-start">
        <AnimatedOnScroll direction="left">
          <div>
            <h2 className="tt-h2 mb-3 text-white">Book an Appointment</h2>
            <p className="tt-body mb-2 text-white/90">
              Share a few details and our clinic staff will call you to confirm the exact time. You
              can choose between an in-clinic visit or an online pediatric consultation.
            </p>
            <ul className="tt-body mb-3 list-disc list-inside text-white/90">
              <li>In-clinic visits: Mon–Sat, 11:00 AM–2:00 PM &amp; 5:00 PM–8:00 PM.</li>
              <li>
                Online consultations: best for follow-ups and non-emergency concerns, available
                8:00 AM–8:00 PM.
              </li>
            </ul>
            <p className="tt-small text-white/80">
              For emergencies (severe breathing difficulty, seizures, major injury, or your child
              looks very unwell), please visit the nearest hospital emergency immediately instead of
              waiting for an appointment.
            </p>
          </div>
        </AnimatedOnScroll>
        <AnimatedOnScroll direction="right">
          <div className="rounded-2xl bg-white p-4 shadow-sm border border-brand-tealSoft/60 text-slate-900">
            <AppointmentForm />
          </div>
        </AnimatedOnScroll>
      </div>
    </section>
  );
}


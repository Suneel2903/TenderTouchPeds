import AppointmentForm from './AppointmentForm';
import AnimatedOnScroll from './AnimatedOnScroll';

export default function AppointmentSection() {
  return (
    <section id="appointments" className="py-10 md:py-14 bg-animated-teal text-white">
      <div className="mx-auto max-w-7xl px-6 grid md:grid-cols-2 gap-10 items-center">
        <AnimatedOnScroll direction="left">
          <div className="text-center md:text-left">
            <h2 className="tt-h2 mb-3 text-white">Book an Appointment</h2>
            <p className="tt-body mb-2 text-white/90">
              Share a few details and our clinic staff will call you to confirm the exact time. You
              can choose between an in-clinic visit or an online pediatric consultation.
            </p>
            <p className="tt-body mb-2 text-white/90">
              In-clinic visits: Mon–Sat, 11:00 AM–2:00 PM &amp; 5:00 PM–8:00 PM.
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


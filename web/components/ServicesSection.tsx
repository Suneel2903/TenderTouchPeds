const services = [
  {
    title: 'Well-Child Checkups',
    icon: '🩺',
    body: 'Regular health checks to track growth, development, and milestones. A good time to discuss sleep, feeding, behavior, and school concerns in a relaxed way.'
  },
  {
    title: 'Vaccinations',
    icon: '💉',
    body: 'Evidence-based vaccine schedules with clear explanations on what is due, what can be combined, and how to keep your child comfortable before and after shots.'
  },
  {
    title: 'Sick Visits',
    icon: '🌡️',
    body: 'Fever, cough, cold, vomiting, loose stools, rashes and more. We focus on identifying what is serious, what can be safely managed at home, and when to recheck.'
  },
  {
    title: 'Newborn & Infant Care',
    icon: '👶',
    body: 'Support for feeding, jaundice, weight gain, colic, crying, and sleep in the first months of life. Space for new parents to ask every question they carry.'
  },
  {
    title: 'Developmental Screening',
    icon: '📈',
    body: 'Age-appropriate screening for speech, social skills, movement, and learning so that any delays are picked up early and you know what to look out for.'
  },
  {
    title: 'Adolescent Checkups',
    icon: '🧑‍🎓',
    body: 'Support for pre-teens and teenagers on growth, puberty, emotional health, and lifestyle in a non-judgmental, private, and respectful setting.'
  },
  {
    title: 'Parent Counselling',
    icon: '🗣️',
    body: 'Dedicated time for parents to understand confusing reports, second opinions, or long-standing concerns about their child’s health or behavior.'
  },
  {
    title: 'Nutrition & Growth Guidance',
    icon: '🥦',
    body: 'Simple, practical guidance on fussy eating, underweight, overweight, and balanced nutrition without unnecessary supplements or fad diets.'
  }
];

export default function ServicesSection() {
  return (
    <section id="services" className="py-10 md:py-14 bg-white">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="tt-h2 mb-6 text-brand-tealDark motion-safe:animate-fade-in-left">
          Our Pediatric Services
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          {services.map((service) => (
            <article
              key={service.title}
              className="rounded-2xl border border-brand-tealSoft/40 bg-gradient-to-br from-white to-brand-tealSoft/10 p-3 hover:-translate-y-1 hover:shadow-md transition-all motion-safe:animate-fade-in-right"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className="h-7 w-7 flex items-center justify-center rounded-full bg-brand-pinkSoft text-base">
                  <span aria-hidden="true">{service.icon}</span>
                </div>
                <h3 className="tt-h3 text-brand-tealDark">{service.title}</h3>
              </div>
              <p className="tt-body text-slate-700">{service.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}



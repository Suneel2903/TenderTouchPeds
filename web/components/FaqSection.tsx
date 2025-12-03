import Script from 'next/script';

const faqs = [
  {
    q: 'When should I bring my child to the emergency room instead of the clinic?',
    a: 'If your child has difficulty breathing, persistent vomiting, seizures, is unusually drowsy, or you feel that something is very wrong, please go to the nearest hospital emergency immediately instead of waiting for an appointment.'
  },
  {
    q: 'Can I book vaccines through the online form?',
    a: 'Yes, you can request an appointment for vaccines. Please mention the age of your child and any specific vaccines you are planning so the clinic can be prepared.'
  },
  {
    q: 'Are online consultations as good as clinic visits?',
    a: 'Some issues can be safely managed online, especially follow-ups, report reviews, or general questions. For new fevers, breathing issues, or if an examination is needed, an in-clinic visit is recommended.'
  },
  {
    q: 'What should I bring for the first visit?',
    a: 'Please carry your child’s previous prescriptions, vaccination card, growth charts (if any), and a list of medicines currently being taken.'
  },
  {
    q: 'Do you see newborns and very young babies?',
    a: 'Yes, newborn and infant care is a core part of the clinic. Concerns about feeding, jaundice, crying, and sleep are very common and welcome.'
  },
  {
    q: 'How long is a typical consultation?',
    a: 'Most consultations are scheduled with enough time to listen, examine, and explain. The exact time can vary depending on how complex the issue is on that day.'
  },
  {
    q: 'Do you provide second opinions?',
    a: 'Yes. If you have reports or plans from another doctor that you would like explained, please bring all documents so that a clear, respectful second opinion can be given.'
  },
  {
    q: 'How do I reschedule or cancel an appointment?',
    a: 'Please call the clinic phone number given on this page. A quick message or call helps us offer that slot to another child who may be waiting.'
  }
];

export default function FaqSection() {
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.a
      }
    }))
  };

  return (
    <section id="faq" className="py-10 md:py-14 bg-white">
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="tt-h2 mb-3 text-brand-tealDark">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map((faq) => (
            <details
              key={faq.q}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <summary className="tt-h3 cursor-pointer text-brand-tealDark">{faq.q}</summary>
              <p className="tt-body mt-2 text-slate-700">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}



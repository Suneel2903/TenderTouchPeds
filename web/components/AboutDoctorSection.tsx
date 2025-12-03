export default function AboutDoctorSection() {
  return (
    <section id="about-doctor" className="py-10 md:py-14 bg-brand-pinkSoft/40">
      <div className="mx-auto max-w-6xl px-4 grid md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-8 items-start">
        <div>
          <h2 className="tt-h2 mb-3 text-brand-tealDark">About Dr. S M Deepthi</h2>
          <p className="tt-body mb-3">
            Dr. S M Deepthi is an American Board Certified Pediatrician with over 15 years of
            clinical experience in caring for babies, children, and adolescents. She completed her
            MD Pediatrics training in the United States and has cared for families across different
            healthcare systems before returning to Hyderabad.
          </p>
          <p className="tt-body mb-3">
            Her style of practice is calm, thorough, and low on hype. She focuses on explaining
            your child&apos;s condition in simple language, helping you understand what is
            necessary, what is optional, and what can safely be observed at home.
          </p>
          <ul className="tt-body space-y-1 mt-3 list-disc list-inside">
            <li>MD Pediatrics (USA)</li>
            <li>American Board Certified in Pediatrics</li>
            <li>15+ years of experience in newborn, child, and adolescent care</li>
            <li>Special interest in growth, development, and preventive pediatrics</li>
          </ul>
        </div>
      </div>
    </section>
  );
}



import Script from 'next/script';
import HeroSection from '../components/HeroSection';
import AboutClinicSection from '../components/AboutClinicSection';
import ServicesSection from '../components/ServicesSection';
import InClinicOnlineSection from '../components/InClinicOnlineSection';
import AppointmentSection from '../components/AppointmentSection';
import ReviewsSection from '../components/ReviewsSection';
import ContactSection from '../components/ContactSection';
import SiteHeader from '../components/SiteHeader';
import BottomBar from '../components/BottomBar';
import FloatingActions from '../components/FloatingActions';

export default function HomePage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:4000';
  const clinicPhone = process.env.NEXT_PUBLIC_CLINIC_PHONE ?? '+918121666387';
  const clinicAddress =
    process.env.NEXT_PUBLIC_CLINIC_ADDRESS ??
    'Shop No. 111, Ground Floor, Kokapet Terminal Building, Radha Spaces, Gandipet Main Road, Kokapet, Hyderabad';

  const localBusinessJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MedicalClinic',
    name: 'Tender Touch Pediatric Clinic',
    url: siteUrl,
    telephone: clinicPhone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: clinicAddress,
      addressLocality: 'Hyderabad',
      addressRegion: 'Telangana',
      addressCountry: 'IN'
    },
    medicalSpecialty: 'Pediatric',
    openingHours: ['Mo-Sa 11:00-14:00', 'Mo-Sa 17:00-20:00']
  };

  return (
    <>
      <Script
        id="local-business-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
      />
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1">
          <HeroSection />
          <AboutClinicSection />
          <ServicesSection />
          <AppointmentSection />
          <ReviewsSection />
          <ContactSection />
        </main>
        <BottomBar />
        <FloatingActions />
      </div>
    </>
  );
}



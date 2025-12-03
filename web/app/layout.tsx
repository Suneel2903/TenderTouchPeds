import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../styles/globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans'
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:4000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Tender Touch Pediatric Clinic – Pediatrician in Kokapet, Hyderabad',
  description:
    'Tender Touch Pediatric Clinic in Kokapet, Hyderabad – American Board Certified Pediatrician Dr. S M Deepthi. Child-friendly care for vaccines, fevers, growth, and more.',
  openGraph: {
    title: 'Tender Touch Pediatric Clinic – Pediatrician in Kokapet, Hyderabad',
    description:
      'Child-friendly pediatric clinic in Kokapet, Hyderabad, led by American Board Certified Pediatrician Dr. S M Deepthi.',
    url: siteUrl,
    siteName: 'Tender Touch Pediatric Clinic',
    type: 'website'
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans bg-white text-slate-900`}>
        {children}
      </body>
    </html>
  );
}



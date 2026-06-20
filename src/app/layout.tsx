import type { Metadata } from 'next';
import './globals.css';
import Providers from '../providers';
import ClientLayout from '../components/ClientLayout';

export const metadata: Metadata = {
  title: 'AURA — Modern Premium E-Commerce',
  description: 'A premium minimalist e-commerce experience for designer gadgets, audio accessories, and creative workspace gear.',
  metadataBase: new URL('http://localhost:3000'),
  openGraph: {
    title: 'AURA — Premium Minimalist EDC Store',
    description: 'Designer tech, mechanical keyboards, ANC audio, and premium workspace gear.',
    url: 'http://localhost:3000',
    siteName: 'AURA',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">
        <Providers>
          <ClientLayout>{children}</ClientLayout>
        </Providers>
      </body>
    </html>
  );
}

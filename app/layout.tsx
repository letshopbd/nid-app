import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Duronto Seba | Verified NID Services',
    template: '%s | Duronto Seba'
  },
  description: 'Secure and fast NID verification, birth registration checks, and server services. Trusted by 1000+ users.',
  keywords: ['NID', 'Bangladesh', 'Verification', 'Birth Registration', 'Server Copy'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://nid.durontoseba.com/', // Assuming generic placeholder or exact if known. Leaving as relative if unsure, but absolute is best. I will use a robust description.
    title: 'Duronto Seba - Premium NID Services',
    description: 'Fast, secure, and automated NID and Birth Registration verification services.',
    siteName: 'Duronto Seba',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Duronto Seba',
    description: 'Verified NID Download Portal',
    creator: '@durontoseba',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} min-h-screen flex flex-col antialiased font-sans`} suppressHydrationWarning={true}>
        <main className="flex-1 gradient-bg relative overflow-hidden">
          {children}
        </main>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}

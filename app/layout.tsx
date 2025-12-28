import type { Metadata } from 'next';
import './globals.css';
// import Link from 'next/link';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'Duronto Seba',
  description: 'Verified NID Download Portal',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col antialiased" suppressHydrationWarning={true}>
        <main className="flex-1 gradient-bg relative overflow-hidden">
          {children}
        </main>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}

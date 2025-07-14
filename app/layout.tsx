import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import { SessionProvider } from "next-auth/react";


const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Mugi Cerdas - Smart Book Cataloging',
  description: 'Smart book cataloging with just one photo. Upload, extract, and manage your library catalog efficiently.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}

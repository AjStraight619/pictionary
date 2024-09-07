import type { Metadata } from 'next';
import { Inter as FontSans, Bangers, Roboto } from 'next/font/google';
import './globals.css';
import Image from 'next/image';
import { ClerkProvider } from '@clerk/nextjs';
import Nav from '@/components/landing-page/nav';
import { cn } from '@/lib/utils';
import Providers from '@/providers/providers';
import { Toaster } from 'sonner';

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
});

const bangers = Bangers({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-bangers',
});

const fontRoboto = Roboto({
  subsets: ['latin'],
  weight: ['100', '300', '400', '500', '700', '900'],
  variable: '--font-roboto',
});

export const metadata: Metadata = {
  title: 'Pictionary',
  description: 'Play pictionary wihfhs fljsbjfbsljehbf',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning={true}>
        <body
          className={cn(
            'min-h-screen bg-background font-sans antialiased',
            bangers.variable,
            fontSans.variable,
            fontRoboto.variable,
          )}
        >
          <Nav />
          <Image
            src={'/pictionary-bg.png'}
            alt="Pictionary"
            quality={100}
            fill
            sizes="100vw"
            style={{
              objectFit: 'cover',
            }}
            className="-z-10 select-none"
          />
          <Providers>{children}</Providers>
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}

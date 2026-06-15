import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Onboardly — Client Onboarding for Freelancers',
  description: 'Automate your client onboarding. Send contracts, collect intake forms, and track progress — all in one place.',
  openGraph: {
    title: 'Onboardly',
    description: 'Client onboarding automation for freelancers',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

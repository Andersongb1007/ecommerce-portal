import type { Metadata } from 'next';
import { Outfit, Fraunces } from 'next/font/google';
import { cookies } from 'next/headers';
import { SessionProvider } from '@/context/SessionContext';
import './globals.css';

const outfit = Outfit({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
});

const fraunces = Fraunces({
  variable: '--font-display',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Vitrina | Portal Empresa',
  description: 'Portal para comercios: registro, empresa, productos y vitrina',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const theme = cookieStore.get('theme')?.value || 'light';
  const userSession = cookieStore.get('userSession')?.value;
  let initialUser = null;

  if (userSession) {
    try {
      initialUser = JSON.parse(decodeURIComponent(userSession));
    } catch {
      // Ignorar error de parsing
    }
  }

  return (
    <html
      lang="es"
      className={`${outfit.variable} ${fraunces.variable} ${theme} h-full antialiased`}
      style={{ colorScheme: theme }}
    >
      <body className="bg-background text-foreground flex min-h-full flex-col font-sans">
        <SessionProvider initialUser={initialUser}>{children}</SessionProvider>
      </body>
    </html>
  );
}

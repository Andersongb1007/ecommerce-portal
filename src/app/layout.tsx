import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { cookies } from 'next/headers';
import { SessionProvider } from '@/context/SessionContext';
import './globals.css';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Portal Empresa',
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
      className={`${inter.variable} ${theme} h-full antialiased`}
      style={{ colorScheme: theme }}
    >
      <body className="bg-background text-foreground flex min-h-full flex-col">
        <SessionProvider initialUser={initialUser}>{children}</SessionProvider>
      </body>
    </html>
  );
}

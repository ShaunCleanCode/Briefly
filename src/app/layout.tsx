import type { Metadata, Viewport } from 'next';
import { Toaster } from 'sonner';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Briefly; - 맞춤형 시장 콘텐츠',
  description: '매일 아침, 당신만을 위한 시장 인사이트를 받아보세요.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>
          {children}
          <Toaster 
            position="top-center" 
            richColors 
            closeButton
            toastOptions={{
              className: 'rounded-xl',
            }}
          />
        </Providers>
      </body>
    </html>
  );
}

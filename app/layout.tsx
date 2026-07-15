import type { Metadata } from 'next';
import { I18nProvider } from '@/lib/i18n-context';
import './globals.css';

export const metadata: Metadata = {
  title: 'Communist Party of Ethiopia (PC-CPE)',
  description: 'የኢትዮጵያ ኮሚኒስት ፓርቲ (ኢኮፓ)',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#0d0808] min-h-screen">
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}

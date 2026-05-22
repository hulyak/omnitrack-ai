import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'OmniTrack AI - Agentic AI That Saves Supply Chains',
  description: 'Autonomous risk detection. Multi-agent mitigation. Zero-downtime resilience. Powered by AWS Bedrock and specialized AI agents.',
  keywords: 'supply chain, AI, agentic AI, risk management, disruption detection, AWS Bedrock, multi-agent system',
  authors: [{ name: 'OmniTrack AI Team' }],
  icons: {
    icon: '/omnitrack-icon.svg',
    apple: '/omnitrack-icon.svg',
    shortcut: '/omnitrack-icon.svg',
  },
  openGraph: {
    title: 'OmniTrack AI - Agentic AI That Saves Supply Chains',
    description: 'Autonomous risk detection. Multi-agent mitigation. Zero-downtime resilience.',
    type: 'website',
    url: 'https://omnitrack.ai',
    images: [
      {
        url: '/omnitrack-logo.svg',
        width: 1200,
        height: 630,
        alt: 'OmniTrack AI Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OmniTrack AI - Agentic AI That Saves Supply Chains',
    description: 'Autonomous risk detection. Multi-agent mitigation. Zero-downtime resilience.',
    images: ['/omnitrack-logo.svg'],
  },
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#3B82F6',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

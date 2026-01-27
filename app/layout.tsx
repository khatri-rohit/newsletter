import type { Metadata } from "next";
import { Newsreader, IBM_Plex_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/components/error-boundary";
import { Providers } from "@/lib/providers";

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "600", "700"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "Low Noise - AI News, Simplified",
    template: "%s | Low Noise"
  },
  description: "Need-to-know AI news, minus the fluff—served bite-size, every day.",
  keywords: ["AI news", "artificial intelligence", "machine learning", "tech news", "daily newsletter"],
  authors: [{ name: "Low Noise Team" }],
  creator: "Low Noise",
  publisher: "Low Noise",
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'mask-icon', url: '/lownoise.png' },
    ],
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'Low Noise',
    title: 'Low Noise - AI News, Simplified',
    description: 'Need-to-know AI news, minus the fluff—served bite-size, every day.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Low Noise - AI News, Simplified' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@lownoise',
    creator: '@lownoise',
    title: 'Low Noise - AI News, Simplified',
    description: 'Need-to-know AI news, minus the fluff—served bite-size, every day.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add your verification tokens here
    // google: 'your-google-verification-token',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Low Noise',
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Low Noise',
    alternateName: 'Low Noise - AI News, Simplified',
    url: baseUrl,
    description: 'Need-to-know AI news, minus the fluff—served bite-size, every day.',
  };

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Low Noise',
    url: baseUrl,
    logo: `${baseUrl}/lownoise.png`,
    description: 'Curated AI news and insights delivered daily.',
  };

  return (
    <html lang="en">
      <head>
        <link rel="dns-prefetch" href="https://firebasestorage.googleapis.com" />
        <link rel="preconnect" href="https://firebasestorage.googleapis.com" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </head>
      <body
        className={`${newsreader.variable} ${ibmPlexMono.variable} antialiased`}
      >
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-EJ2NCBM9DJ"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-EJ2NCBM9DJ');
          `}
        </Script>

        <ErrorBoundary>
          <Providers>
            <AuthProvider>
              {children}
            </AuthProvider>
          </Providers>
        </ErrorBoundary>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}

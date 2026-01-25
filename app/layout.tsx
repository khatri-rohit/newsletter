import type { Metadata } from "next";
import { Newsreader, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/components/error-boundary";

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
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'Low Noise',
    title: 'Low Noise - AI News, Simplified',
    description: 'Need-to-know AI news, minus the fluff—served bite-size, every day.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Low Noise - AI News, Simplified',
    description: 'Need-to-know AI news, minus the fluff—served bite-size, every day.',
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="dns-prefetch" href="https://firebasestorage.googleapis.com" />
        <link rel="preconnect" href="https://firebasestorage.googleapis.com" />
      </head>
      <body
        className={`${newsreader.variable} ${ibmPlexMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ErrorBoundary>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}

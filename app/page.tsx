import { Suspense } from "react";
import Footer from "@/components/footer";
import { HeaderWrapper } from "@/components/header-wrapper";
import { HeroSection } from "./hero-section";
import { HomeClient } from "./home-client";
import { Newsletter } from "@/services/types";
import apiClient from "@/lib/axios";

/**
 * Server-side data fetching for newsletters
 * This runs on the server and provides instant data to the client
 */
async function getNewsletters(): Promise<Newsletter[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await apiClient.get('/api/newsletters?status=published&limit=20', {
      headers: {
        'Content-Type': 'application/json',
      },
      httpVersion: 2,
      baseURL: baseUrl,
    })
    // console.log('Response:', response);
    // const response = await fetch(`${baseUrl}/api/newsletters?status=published&limit=20`, {
    //   next: { revalidate: 300 }, // Revalidate every 5 minutes
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    // });

    if (response.status !== 200) {
      console.error('Failed to fetch newsletters:', response.statusText);
      return [];
    }

    return response.data.data?.newsletters || [];
  } catch (error) {
    console.error('Error fetching newsletters:', error);
    return [];
  }
}

/**
 * Loading fallback for the newsletter section
 */
function NewslettersSkeleton() {
  return (
    <div className="relative py-16 md:py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 space-y-6">
            <div className="text-center space-y-3">
              <div className="h-10 bg-slate-200 rounded w-64 mx-auto animate-pulse" />
              <div className="h-6 bg-slate-200 rounded w-96 mx-auto animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white rounded-lg border border-slate-200 overflow-hidden">
                <div className="bg-slate-200 h-48" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-slate-200 rounded w-3/4" />
                  <div className="h-4 bg-slate-200 rounded w-1/2" />
                  <div className="space-y-2 pt-2">
                    <div className="h-3 bg-slate-200 rounded w-full" />
                    <div className="h-3 bg-slate-200 rounded w-5/6" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Home Page - Server Component with optimized data fetching
 * This component renders on the server for instant content delivery
 */
export default async function Home() {
  // Fetch newsletters on the server
  const newsletters = await getNewsletters();

  return (
    <div className="min-h-screen bg-slate-50">
      <HeaderWrapper />

      {/* Hero Section */}
      <main className="relative overflow-hidden">
        <HeroSection />

        {/* Newsletter Preview Cards Section with Suspense */}
        <Suspense fallback={<NewslettersSkeleton />}>
          <HomeClient initialNewsletters={newsletters} />
        </Suspense>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

// Enable static generation with revalidation
export const revalidate = 300; // Revalidate every 5 minutes

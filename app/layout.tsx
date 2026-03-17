import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import NextTopLoader from "nextjs-toploader";
import { GlobalRouteLoadingOverlay } from "@/components/ui/global-route-loading-overlay";
import { ToastViewport } from "@/components/ui/toast-viewport";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "PlanProject",
    template: "%s | PlanProject",
  },
  description: "Strategic planning SaaS for startup teams",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F9FAFB] text-gray-900 antialiased">
        <NextTopLoader color="#3182F6" height={3} showSpinner={false} />
        <Suspense fallback={null}>
          <GlobalRouteLoadingOverlay />
        </Suspense>
        <ToastViewport />
        {children}
      </body>
    </html>
  );
}

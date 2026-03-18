import type { Metadata } from "next";
import type { ReactNode } from "react";
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
      <body className="min-h-screen bg-[#F9FAFB] text-gray-900 antialiased">{children}</body>
    </html>
  );
}

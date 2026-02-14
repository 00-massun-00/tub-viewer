import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TUB Viewer — Technology Update Briefing",
  description: "Microsoft 製品のアップデート情報を多言語で確認できるビューア。Message Center + Microsoft Learn がデータソース。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <LanguageSetter />
        {children}
      </body>
    </html>
  );
}

/** Client component to dynamically set html[lang] based on locale state */
function LanguageSetter() {
  "use client";
  if (typeof window !== "undefined") {
    // Listen for locale changes via a custom event
    // The page component dispatches this when locale changes
  }
  return null;
}

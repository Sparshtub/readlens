import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { isClerkMocked } from "@/lib/auth-helper";
import dynamic from "next/dynamic";
import "./globals.css";

const ClerkProviderWrapper = dynamic(() => import("@/components/ClerkProviderWrapper"));

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ReadLens AI - Intelligent Reading Companion",
  description: "Read anything. Understand everything. Your intelligent document reader and learning companion.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isMock = isClerkMocked();

  const bodyContent = (
    <body className="min-h-full flex flex-col text-slate-900 bg-slate-50 dark:text-slate-100 dark:bg-slate-950">
      {children}
    </body>
  );

  if (isMock) {
    return (
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        {bodyContent}
      </html>
    );
  }

  return (
    <ClerkProviderWrapper>
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        {bodyContent}
      </html>
    </ClerkProviderWrapper>
  );
}



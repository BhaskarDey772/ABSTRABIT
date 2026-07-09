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
  title: "Discord Bot Admin",
  description: "Admin dashboard for the Discord slash-command bot",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* h-screen + overflow-hidden: the /servers shell owns all intentional scrolling
          internally (its <main> has overflow-y-auto) - this stops anything portaled
          straight to <body> (e.g. a Select dropdown) from inflating the document's own
          height and reviving page-level scroll, which was dragging the sidebar/header
          along with it. */}
      <body className="h-screen overflow-hidden flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Noto_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";

// Discord's own UI font ("gg sans") is a proprietary in-house typeface, not
// something available to license/embed - Discord's own site falls back to
// Noto Sans for anyone without it installed locally, which is effectively
// everyone. Matching that stack (see globals.css --font-sans) with Noto Sans
// properly loaded as a web font instead of just hoping it's a system font.
const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
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
      className={`dark ${notoSans.variable} ${geistMono.variable} h-full antialiased`}
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

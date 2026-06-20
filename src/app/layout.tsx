import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Project Zenith — The Celestial Eye",
  description:
    "Turn any point on Earth into a live observatory. Real-time satellites, the ISS, planets, and sky conditions overhead — a mission-control instrument.",
  applicationName: "Project Zenith",
  authors: [{ name: "Team IDSCC — SRM IST" }],
  keywords: [
    "satellite tracking",
    "ISS",
    "celestial",
    "astronomy",
    "space weather",
    "CesiumJS",
  ],
};

export const viewport: Viewport = {
  themeColor: "#04060d",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="relative min-h-full overflow-hidden">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

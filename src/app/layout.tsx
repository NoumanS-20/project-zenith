import type { Metadata, Viewport } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const displayFont = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const monoFont = JetBrains_Mono({
  variable: "--font-mono-zenith",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
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
      className={`${displayFont.variable} ${monoFont.variable} h-full antialiased`}
    >
      <body className="relative min-h-full overflow-hidden">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

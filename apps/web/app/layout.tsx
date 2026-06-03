import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { brandingToCssVars } from "@firstcall/ui/theme";
import { resolveTenantBranding } from "@/lib/tenant";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FirstCall",
  description: "ERP + CRM for the disaster-restoration industry",
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const branding = await resolveTenantBranding();
  const style = brandingToCssVars(branding) as CSSProperties;

  return (
    <html lang="en" className={`${plexSans.variable} ${plexMono.variable}`}>
      <body style={style}>{children}</body>
    </html>
  );
}

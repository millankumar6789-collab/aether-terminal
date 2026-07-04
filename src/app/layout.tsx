import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { MobileShell } from "@/components/layout/mobile-shell";

export const metadata: Metadata = {
  title: "Aether Terminal — Institutional Trading Platform",
  description:
    "Cloud-native institutional trading platform: order flow, SMC/ICT, multi-strategy consensus, AI research, portfolio analytics. Mobile-first.",
  applicationName: "Aether Terminal",
  manifest: "/app.webmanifest",
};

// Mobile-first viewport — tuned for POCO X6 Pro (1220×2712, 120Hz).
// `viewport-fit=cover` + `interactive-widget=resizes-content` keeps one-handed
// thumb-zone layouts stable when the soft keyboard opens.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,            // disable pinch-zoom to prevent layout break in dense dashboards
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#060a18",
  interactiveWidget: "resizes-content",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <Providers>
          <MobileShell>{children}</MobileShell>
        </Providers>
      </body>
    </html>
  );
}

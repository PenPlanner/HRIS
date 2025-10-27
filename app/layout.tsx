import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@xyflow/react/dist/style.css"; // Import React Flow CSS before Tailwind
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "sonner";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";
import { OnlineStatusBanner } from "@/components/online-status-banner";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HRIS - Wind Turbine Service Manager",
  description: "Offline-capable wind turbine service flowchart and documentation manager",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "HRIS",
  },
};

// Next.js 15: viewport and themeColor must be separate exports
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const themeColor = "#2563eb";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="HRIS" />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* Service Worker Registration */}
          <ServiceWorkerRegistration />

          {/* Online/Offline Status Banner */}
          <OnlineStatusBanner />

          {/* PWA Install Prompt */}
          <PWAInstallPrompt />

          {children}
          <Toaster position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}

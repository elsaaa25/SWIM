import './globals.css';
import type { Metadata } from 'next';
import { RealtimeProvider } from './providers';
import AppLayoutClient from './AppLayoutClient';
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: 'SWIM — Smart Water IoT Monitoring System',
  description: 'Dashboard Monitoring Real-time Tandon Air berbasis IoT, Deteksi Anomali Kebocoran, dan Pelampung Rusak',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={cn("light font-sans", inter.variable)} suppressHydrationWarning>
      <body className={cn(inter.className, "bg-slate-50 text-slate-900 min-h-screen antialiased selection:bg-cyan-500 selection:text-white transition-colors duration-300")}>
        <RealtimeProvider>
          <AppLayoutClient>{children}</AppLayoutClient>
        </RealtimeProvider>
      </body>
    </html>
  );
}

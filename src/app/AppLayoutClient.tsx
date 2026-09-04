'use client';

import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import AlertBanner from '@/components/AlertBanner';
import { useRealtime } from './providers';

export default function AppLayoutClient({ children }: { children: React.ReactNode }) {
  const { device, alerts, resolveAlert } = useRealtime();

  const activeAlertCount = alerts.filter((a) => a.status === 'ACTIVE').length;

  return (
    <div className="flex min-h-screen">
      {/* Sidebar Navigation */}
      <Sidebar activeAlertCount={activeAlertCount} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar device={device} activeAlertCount={activeAlertCount} />

        {/* Global Active Alert Banner */}
        <AlertBanner alerts={alerts} onResolve={resolveAlert} />

        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto pb-20 md:pb-8">{children}</main>
      </div>
    </div>
  );
}

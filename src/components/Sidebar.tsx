'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, LineChart, BellRing, Settings, Droplets, Activity } from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Grafik & Historis', href: '/analytics', icon: LineChart },
  { name: 'Notifikasi & Alert', href: '/alerts', icon: BellRing },
  { name: 'Pengaturan', href: '/settings', icon: Settings },
];

export default function Sidebar({ activeAlertCount }: { activeAlertCount: number }) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="w-64 glass-panel border-r border-slate-200 bg-white flex flex-col justify-between hidden md:flex min-h-screen">
        <div>
          {/* Brand Logo */}
          <div className="p-6 flex items-center gap-3 border-b border-slate-200">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-md">
              <Droplets className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="font-extrabold text-xl text-slate-900 tracking-widest leading-tight">SWIM</h1>
              <p className="text-xs text-cyan-600 font-medium">Smart Water IoT Monitor</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-cyan-50 text-cyan-700 border border-cyan-200 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${isActive ? 'text-cyan-600' : 'text-slate-400'}`} />
                    <span>{item.name}</span>
                  </div>
                  {item.href === '/alerts' && activeAlertCount > 0 && (
                    <span className="px-2 py-0.5 text-xs font-bold bg-rose-500 text-white rounded-full animate-pulse shadow-sm">
                      {activeAlertCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Info */}
        <div className="p-4 border-t border-slate-200">
          <div className="glass-panel p-3 rounded-xl text-xs text-slate-500 flex items-center justify-between bg-slate-50 border border-slate-200">
            <span className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-cyan-600" />
              <span>SWIM v1.0.0</span>
            </span>
            <span className="text-emerald-600 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
              Aktif
            </span>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-slate-200 z-50 flex items-center justify-around px-2 shadow-lg">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all relative ${
                isActive ? 'text-cyan-600 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'text-cyan-600' : 'text-slate-400'}`} />
                {item.name === 'Notifikasi & Alert' && activeAlertCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 w-4 h-4 text-[10px] font-bold bg-rose-500 text-white rounded-full flex items-center justify-center animate-pulse">
                    {activeAlertCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 truncate max-w-[70px]">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

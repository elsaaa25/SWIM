'use client';

import { useState, useEffect } from 'react';
import { useRealtime } from '../providers';
import { Settings, Save, Sliders, Bell, Cpu, Container, Check, Volume2 } from 'lucide-react';

export default function SettingsPage() {
  const { settings, updateSettings } = useRealtime();
  const [formData, setFormData] = useState(settings);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <Settings className="w-7 h-7 text-cyan-600" />
            Pengaturan Parameter Sistem
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Konfigurasi kapasitas tandon, threshold logika anomali, kalibrasi sensor, dan notifikasi.
          </p>
        </div>

        <button
          type="submit"
          className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
        >
          {isSaved ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
          {isSaved ? 'Tersimpan!' : 'Simpan Pengaturan'}
        </button>
      </div>

      {/* 1. Konfigurasi Tandon */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-200 bg-white/80 space-y-4 shadow-sm">
        <h3 className="font-bold text-base text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-3">
          <Container className="w-5 h-5 text-cyan-600" />
          Konfigurasi Tandon Air Fisik
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Kapasitas Tandon (Liter)</label>
            <input
              type="number"
              value={formData.tankCapacity}
              onChange={(e) => handleChange('tankCapacity', Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-mono focus:outline-none focus:border-cyan-600 focus:bg-white"
            />
            <p className="text-[11px] text-slate-500 mt-1">Digunakan untuk menghitung estimasi volume overflow / air luber.</p>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Estimasi Waktu Isi Normal (Menit)</label>
            <input
              type="number"
              value={formData.normalFillTimeMinutes}
              onChange={(e) => handleChange('normalFillTimeMinutes', Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-mono focus:outline-none focus:border-cyan-600 focus:bg-white"
            />
            <p className="text-[11px] text-slate-500 mt-1">Waktu acuan pengisian tandon dari posisi kosong hingga penuh.</p>
          </div>
        </div>
      </div>

      {/* 2. Konfigurasi Threshold Alert */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-200 bg-white/80 space-y-4 shadow-sm">
        <h3 className="font-bold text-base text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-3">
          <Sliders className="w-5 h-5 text-amber-600" />
          Konfigurasi Threshold Alert & Deteksi Anomali
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Threshold Pompa Waspada (Menit)</label>
            <input
              type="number"
              value={formData.warningPumpMinutes}
              onChange={(e) => handleChange('warningPumpMinutes', Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-mono focus:outline-none focus:border-cyan-600 focus:bg-white"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Threshold Interval Bocor (Menit)</label>
            <input
              type="number"
              value={formData.leakIntervalMinutes}
              onChange={(e) => handleChange('leakIntervalMinutes', Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-mono focus:outline-none focus:border-cyan-600 focus:bg-white"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Jam Dini Hari Mulai</label>
            <input
              type="time"
              value={formData.earlyMorningStart}
              onChange={(e) => handleChange('earlyMorningStart', e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-mono focus:outline-none focus:border-cyan-600 focus:bg-white cursor-pointer"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Jam Dini Hari Selesai</label>
            <input
              type="time"
              value={formData.earlyMorningEnd}
              onChange={(e) => handleChange('earlyMorningEnd', e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-mono focus:outline-none focus:border-cyan-600 focus:bg-white cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 3. Konfigurasi Sensor */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-200 bg-white/80 space-y-4 shadow-sm">
        <h3 className="font-bold text-base text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-3">
          <Cpu className="w-5 h-5 text-emerald-600" />
          Konfigurasi Sensor & Perangkat IoT
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Faktor Kalibrasi Sensor (Pulse/Liter)</label>
            <input
              type="number"
              step="0.1"
              value={formData.calibrationFactor}
              onChange={(e) => handleChange('calibrationFactor', Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-mono focus:outline-none focus:border-cyan-600 focus:bg-white"
            />
            <p className="text-[11px] text-slate-500 mt-1">Konversi pulsa sensor flow meter ke debit air dalam Liter.</p>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Interval Kirim Data Telemetri (Detik)</label>
            <input
              type="number"
              value={formData.dataIntervalSeconds}
              onChange={(e) => handleChange('dataIntervalSeconds', Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-mono focus:outline-none focus:border-cyan-600 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* 4. Konfigurasi Kanal Notifikasi (Hanya Notifikasi Web & Suara Alarm) */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-200 bg-white/80 space-y-4 shadow-sm">
        <h3 className="font-bold text-base text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-3">
          <Bell className="w-5 h-5 text-cyan-600" />
          Notifikasi & Peringatan
        </h3>

        <div className="space-y-4 pt-2">
          {/* Web Push Notification */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-600">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Notifikasi Web (Browser Push)</p>
                <p className="text-xs text-slate-600">Tampilkan notifikasi pop-up langsung di layar browser saat terjadi alert.</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={formData.notifyBrowser}
              onChange={(e) => handleChange('notifyBrowser', e.target.checked)}
              className="w-5 h-5 accent-cyan-600 cursor-pointer"
            />
          </div>

          {/* Sound Alarm Notification */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-600">
                <Volume2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Suara Alarm (Sound Alert)</p>
                <p className="text-xs text-slate-600">Bunyikan suara alarm sirine otomatis di web saat anomali atau overflow terdeteksi.</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={(formData as any).notifySound ?? true}
              onChange={(e) => handleChange('notifySound', e.target.checked)}
              className="w-5 h-5 accent-cyan-600 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </form>
  );
}


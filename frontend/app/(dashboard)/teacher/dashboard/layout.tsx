import React from 'react';
import { TeacherSidebar } from '../components/sidebar';

export default function TeacherDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      {/* SIDEBAR (Desktop Only) */}
      <TeacherSidebar />

      {/* MAIN CONTENT AREA */}
      {/* md:pl-64 memberikan padding kiri selebar sidebar agar konten tidak tertutup */}
      <main className="md:pl-64 transition-all duration-300 ease-in-out">
        
        {/* Container untuk konten halaman */}
        <div className="mx-auto max-w-7xl p-4 md:p-8">
          {/* Header Mobile bisa ditaruh disini jika perlu (visible on mobile only) */}
          
          {/* Children (Halaman Dashboard) */}
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             {children}
          </div>
        </div>
      </main>
    </div>
  );
}
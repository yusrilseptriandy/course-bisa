import React from 'react';
import { TeacherSidebar } from '../components/sidebar';

export default function TeacherDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black">
            <TeacherSidebar />
            <main className="md:pl-64 transition-all duration-300 ease-in-out">
                <div className="mx-auto max-w-7xl p-4 md:p-8">
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}

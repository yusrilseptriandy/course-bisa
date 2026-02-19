import React from 'react';
import { TeacherSidebar } from '../components/sidebar';

export default function TeacherDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-white dark:bg-black">
            <TeacherSidebar />
            <main className="md:pl-64 transition-all duration-300 ease-in-out">
                <div className="mx-auto max-w-7xl">
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}

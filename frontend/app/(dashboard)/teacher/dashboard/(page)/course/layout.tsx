"use client"
import React from 'react';
import Header from '../../../components/teacher/course-detail/header';
import { usePathname } from 'next/navigation';


export default function CourseDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {

    const pathname = usePathname()

   const isCoursePage = pathname === '/teacher/dashboard/course'
    return (
        <div className="flex flex-col min-h-screen bg-white dark:bg-abu">
            {!isCoursePage && <Header/>}
            <main className="transition-all duration-300 ease-in-out p-4 md:p-8 w-full h-full">
                        {children}
            </main>
        </div>
    );
}

"use client"
import React from 'react';
import Header from '../../../components/teacher/course-detail/header';


export default function CourseDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {

    return (
        <div className="flex flex-col min-h-screen bg-white dark:bg-black">
            <Header/>
            <main className="transition-all duration-300 ease-in-out p-4 md:p-8 w-full h-full">
                        {children}
            </main>
        </div>
    );
}

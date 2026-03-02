'use client';

import { Icon } from '@iconify/react';
import Link from 'next/link';
import { Course } from '@/app/hooks/use-course-data';
import Image from 'next/image';

interface CourseTableProps {
    courses: Course[] | undefined;
    isLoading: boolean;
}

export default function CourseTable({ courses, isLoading }: CourseTableProps) {
    const safeCourses = Array.isArray(courses) 
        ? courses.filter(course => !course.isDeleted) 
        : [];

    if (isLoading) {
        return (
            <div className="w-full h-40 flex items-center justify-center border rounded-2xl border-dashed border-zinc-200 dark:border-zinc-800">
                <Icon
                    icon="mingcute:loading-2-line"
                    className="animate-spin text-zinc-400"
                    width={24}
                />
            </div>
        );
    }

    if (safeCourses.length === 0) {
        return;
    }

    return (
        <div className="w-full overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="border-b border-zinc-200 bg-zinc-50/50 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50">
                        <tr>
                            <th className="px-6 py-4 font-medium">
                                Judul Kursus
                            </th>
                            <th className="px-6 py-4 font-medium text-center">
                                Harga
                            </th>
                            <th className="px-6 py-4 font-medium text-center">
                                Status
                            </th>
                            <th className="px-6 py-4 font-medium text-right">
                                Aksi
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                        {safeCourses.map((course) => (
                            <tr
                                key={course.id}
                                className="group hover:bg-zinc-50 transition-colors dark:hover:bg-zinc-900/50"
                            >
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 shrink-0 rounded-lg bg-zinc-100 dark:bg-zinc-800 overflow-hidden border border-zinc-200 dark:border-zinc-700 relative">
                                            {course.thumbnail ? (
                                                <Image
                                                    fill
                                                    src={course.thumbnail}
                                                    alt={course.name}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center">
                                                    <Icon
                                                        icon="lucide:image"
                                                        className="text-zinc-400"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate max-w-50 md:max-w-xs">
                                            {course.name}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center text-zinc-600 dark:text-orange-500 font-semibold">
                                    {course.price === 0 || !course.price
                                        ? 'Gratis'
                                        : `Rp ${(course.price || 0).toLocaleString('id-ID')}`}
                                    </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex items-center justify-center gap-1.5 group/status relative">
                                        <span
                                            className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                                                course.isPublish
                                                    ? 'text-emerald-700 dark:text-emerald-400'
                                                    : ' text-amber-700  dark:text-amber-400'
                                            }`}
                                        >
                                            {course.isPublish
                                                ? 'Published'
                                                : 'Draft'}
                                        </span>

                                        {!course.isPublish && (
                                            <div className="relative cursor-help">
                                                <Icon
                                                    icon="lucide:info"
                                                    width={14}
                                                    className="text-amber-500 opacity-60 hover:opacity-100 transition-opacity"
                                                />

                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-zinc-900 text-white text-[10px] rounded-lg opacity-0 invisible group-hover/status:opacity-100 group-hover/status:visible transition-all z-10 shadow-xl pointer-events-none">
                                                    <p className="leading-tight">
                                                        Status draf hanya
                                                        disimpan sementara di
                                                        Redis dan akan terhapus
                                                        otomatis dalam 24 jam
                                                        jika tidak segera
                                                        dipublikasikan.
                                                    </p>

                                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-zinc-900" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <Link
                                        href={`/teacher/dashboard/course/${course.id}`}
                                        className="inline-flex h-8 w-8 items-center justify-center text-zinc-500 hover:bg-black hover:text-white hover:rounded-full transition-all dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-white dark:hover:text-black"
                                    >
                                        <Icon icon="lucide:edit-3" width={16} />
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

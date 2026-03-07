'use client';

import { Icon } from '@iconify/react';
import Image from 'next/image';
import { useCourseData } from '@/app/hooks/use-course-data';
import Link from 'next/link';
import { useState } from 'react';

export default function CardCourse() {
    const { publicCourses, isPublicLoading } = useCourseData(undefined, true);
    const [imageLoaded, setImageLoaded] = useState(false);

    if (isPublicLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 w-full h-max py-10 px-5 md:px-20">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div
                        key={i}
                        className="dark:bg-[#171717] bg-white border border-zinc-200 dark:border-0 rounded-2xl overflow-hidden p-3 flex flex-col gap-3 scale-110"
                    >
                        <div className="w-full aspect-video rounded-xl bg-gray-200 dark:bg-zinc-800 animate-pulse" />

                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <div className="h-3 w-16 rounded bg-gray-200 dark:bg-zinc-800 animate-pulse" />
                                <div className="h-3 w-10 rounded bg-gray-200 dark:bg-zinc-800 animate-pulse" />
                                <div className="h-3 w-10 rounded bg-gray-200 dark:bg-zinc-800 animate-pulse" />
                            </div>

                            <div className="space-y-1">
                                <div className="h-3.5 w-full rounded bg-gray-200 dark:bg-zinc-800 animate-pulse" />
                                <div className="h-3.5 w-3/4 rounded bg-gray-200 dark:bg-zinc-800 animate-pulse" />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="h-3 w-12 rounded bg-gray-200 dark:bg-zinc-800 animate-pulse" />
                                <div className="h-3 w-20 rounded bg-gray-200 dark:bg-zinc-800 animate-pulse" />
                            </div>
                        </div>

                        <hr className="dark:border-zinc-800 border-zinc-200" />

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-zinc-800 animate-pulse" />
                                <div className="h-3 w-20 rounded bg-gray-200 dark:bg-zinc-800 animate-pulse" />
                            </div>
                            <div className="h-4 w-4 rounded bg-gray-200 dark:bg-zinc-800 animate-pulse" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 w-full h-max py-10 px-5 md:px-20">
            {publicCourses?.map((course) => (
                <Link
                    href={`/courses/${course.id}`}
                    key={course.id}
                    className="dark:bg-abu-second scale-110 hover:scale-105 transition-all bg-white border border-zinc-200 dark:border-0 rounded-2xl overflow-hidden p-3 flex flex-col gap-3 "
                >
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden">
                        {/* Skeleton */}
                        {!imageLoaded && (
                            <div className="absolute inset-0 animate-pulse bg-gray-300 dark:bg-zinc-800" />
                        )}

                        <Image
                            src={course.thumbnail || '/c1.jpg'}
                            alt={course.name}
                            fill
                            className={`object-cover transition-opacity duration-300 ${
                                imageLoaded ? 'opacity-100' : 'opacity-0'
                            }`}
                            onLoadingComplete={() => setImageLoaded(true)}
                        />
                        <div className="flex bg-black/60 text-xs py-0.5 px-2 rounded-full items-center gap-1 absolute bottom-1 right-4">
                            <span className="text-white font-semibold">
                                {Math.floor(
                                    (course.totalDurationSeconds || 0) / 60,
                                )}{' '}
                                menit
                            </span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-sm font-semibold dark:text-white leading-tight line-clamp-2">
                            {course.name}
                        </h3>

                        <div className="flex items-center gap-1">
                            <Icon
                                icon={'f7:square-stack'}
                                className="text-md"
                            />
                            <span className="text-[10px] font-bold">
                                {course.totalLessons} lesson
                            </span>
                            <Icon
                                icon={'proicons:thumbs-up'}
                                className="text-md ml-1"
                            />
                            <span className="text-[10px] font-bold ">12k</span>

                            <Icon
                                icon={'proicons:comment'}
                                className="text-md ml-1"
                            />
                            <span className="text-[10px] font-bold ">1200</span>
                        </div>
                    </div>

                    <hr className="dark:border-zinc-800 border-zinc-200" />

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gray-600"></div>
                            <span className="text-[10px] font-bold dark:text-gray-300">
                                {course.owner?.name}
                            </span>
                        </div>
                        {/* <span className="flex items-center gap-1 text-orange-500">
                            <Icon icon={'glyphs:coin-bold'} />
                        </span> */}
                    </div>
                </Link>
            ))}
        </div>
    );
}

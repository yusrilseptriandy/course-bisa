'use client';

import { Icon } from '@iconify/react';
import Image from 'next/image';
import { useCourseData } from '@/app/hooks/use-course-data';
import Link from 'next/link';
import { useState } from 'react';

export default function CardCourse() {
    const { publicCourses, isPublicLoading } = useCourseData();
    const [imageLoaded, setImageLoaded] = useState(false);

    if (isPublicLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 w-full h-max py-10 px-5 md:px-20">
                {[...Array(6)].map((_, i) => (
                    <div
                        key={i}
                        className="dark:bg-[#171717] bg-white border border-zinc-200 dark:border-0 rounded-2xl overflow-hidden p-3 flex flex-col gap-3 animate-pulse"
                    >
                        <div className="w-full aspect-video rounded-xl bg-gray-300 dark:bg-zinc-800" />

                        <div className="space-y-2">
                            <div className="flex gap-2">
                                <div className="h-3 w-10 bg-gray-300 dark:bg-zinc-800 rounded" />
                                <div className="h-3 w-8 bg-gray-300 dark:bg-zinc-800 rounded" />
                                <div className="h-3 w-12 bg-gray-300 dark:bg-zinc-800 rounded" />
                            </div>

                            <div className="h-4 w-3/4 bg-gray-300 dark:bg-zinc-800 rounded" />
                            <div className="h-4 w-1/2 bg-gray-300 dark:bg-zinc-800 rounded" />

                            <div className="flex justify-between mt-2">
                                <div className="h-3 w-16 bg-gray-300 dark:bg-zinc-800 rounded" />
                                <div className="h-3 w-20 bg-gray-300 dark:bg-zinc-800 rounded" />
                            </div>
                        </div>

                        <hr className="dark:border-zinc-800 border-zinc-200" />

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-zinc-800" />
                                <div className="h-3 w-16 bg-gray-300 dark:bg-zinc-800 rounded" />
                            </div>
                            <div className="h-4 w-6 bg-gray-300 dark:bg-zinc-800 rounded" />
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
                    className="dark:bg-[#171717] scale-110 hover:scale-105 transition-all bg-white border border-zinc-200 dark:border-0 rounded-2xl overflow-hidden p-3 flex flex-col gap-3 "
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
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-1">
                            <Icon icon={'lucide:play'} className="text-xs" />
                            <span className="text-[10px] font-bold ">
                                {course.durationSeconds || 0}s
                            </span>
                            <Icon
                                icon={'proicons:thumbs-up'}
                                className="text-xs ml-1"
                            />
                            <span className="text-[10px] font-bold ">12k</span>

                            <Icon
                                icon={'proicons:comment'}
                                className="text-xs ml-1"
                            />
                            <span className="text-[10px] font-bold ">1200</span>
                        </div>

                        <h3 className="text-sm font-semibold dark:text-white leading-tight line-clamp-2">
                            {course.name}
                        </h3>

                        <div className="flex items-center justify-between text-[10px] ">
                            <div className="flex items-center gap-1">
                                <Icon icon={'proicons:video'} width={15} />
                                <span>
                                    {Math.floor(course.durationSeconds || 0)} s
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Icon icon={'proicons:calendar'} width={15} />
                                <span>
                                    {course.createdAt
                                        ? new Date(
                                              course.createdAt,
                                          ).toLocaleDateString('id-ID', {
                                              day: '2-digit',
                                              month: 'short',
                                              year: 'numeric',
                                          })
                                        : '-'}
                                </span>
                            </div>
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
                        <span className="flex items-center gap-1 text-orange-500">
                            <Icon icon={'glyphs:coin-bold'} />
                        </span>
                    </div>
                </Link>
            ))}
        </div>
    );
}

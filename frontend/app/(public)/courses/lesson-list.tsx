'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Icon } from '@iconify/react';
import MuxPlayer from '@mux/mux-player-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { BASE_URL, Lesson } from '@/app/hooks/use-course-data';



function formatDuration(seconds: number): string {
    if (!seconds) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

function LessonSkeleton() {
    return (
        <div className="flex flex-col gap-4">
            <div className="w-full aspect-video rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            <div className="space-y-1 px-1">
                <div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                <div className="h-4 w-2/3 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
            </div>
            <div className="flex items-center justify-between px-1">
                <div className="space-y-1">
                    <div className="h-4 w-28 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                    <div className="h-3 w-20 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                </div>
                <div className="h-6 w-16 bg-zinc-200 dark:bg-zinc-800 rounded-full animate-pulse" />
            </div>
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="flex items-center gap-3 px-4 py-3.5"
                    >
                        <div className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse shrink-0" />
                        <div className="flex-1 space-y-1.5">
                            <div className="h-3 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                            <div className="h-2.5 w-1/2 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                        </div>
                        <div className="h-3 w-8 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                    </div>
                ))}
            </div>
        </div>
    );
}

interface LessonListProps {
    courseId: string;
    courseTitle?: string;
    hasAccess?: boolean;
    lessons?: Lesson[];
}

export default function LessonList({
    courseId,
    hasAccess = false,
    lessons: lessonsProp,
}: LessonListProps) {
    const { data: fetchedCourse, isLoading } = useQuery({
        queryKey: ['public-course-lessons', courseId],
        queryFn: async () => {
            const res = await axios.get(`${BASE_URL}/publik/${courseId}`);
            return res.data.data ?? res.data;
        },
        enabled: !!courseId && !lessonsProp?.length,
        staleTime: 1000 * 60 * 5,
    });

    const lessons = useMemo<Lesson[]>(
        () =>
            lessonsProp?.length ? lessonsProp : (fetchedCourse?.lessons ?? []),
        [lessonsProp, fetchedCourse?.lessons],
    );
    const [activeLesson, setActiveLesson] = useState<Lesson | null>(
        () => lessons.find((l) => l.isFree) ?? lessons[0] ?? null,
    );

    if (isLoading && !lessonsProp?.length) return <LessonSkeleton />;

    if (!lessons.length) return null;

    const canPlay = (lesson: Lesson) => !!(lesson.isFree || hasAccess);
    const totalMinutes = Math.floor(
        lessons.reduce((sum, l) => sum + (l.durationSeconds ?? 0), 0) / 60,
    );
    const freeCount = lessons.filter((l) => l.isFree).length;

    return (
        <div className="flex flex-col gap-4">
            <AnimatePresence mode="wait">
                {activeLesson?.muxPlaybackId && canPlay(activeLesson) ? (
                    <motion.div
                        key={activeLesson.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="w-full aspect-video rounded-xl overflow-hidden bg-abu"
                    >
                        <MuxPlayer
                            playbackId={activeLesson.muxPlaybackId}
                            metadata={{ video_title: activeLesson.title }}
                            accentColor="#F97316"
                            streamType="on-demand"
                            className="w-full h-full"
                        />
                    </motion.div>
                ) : (
                    <motion.div
                        key="locked-placeholder"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="w-full aspect-video rounded-xl bg-zinc-100 dark:bg-abu-second flex flex-col items-center justify-center gap-2 text-zinc-400"
                    >
                        <Icon
                            icon="solar:lock-bold-duotone"
                            width={32}
                            className="text-zinc-300 dark:text-zinc-700"
                        />
                        <p className="text-xs font-medium">
                            Beli paket untuk menonton course ini
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {activeLesson && (
                <div className="px-1 -mt-1">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate mt-0.5">
                        {activeLesson.title}
                    </p>
                </div>
            )}

            <div className="flex items-center justify-between px-1">
                <div>
                    <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
                        Daftar Materi
                    </h2>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                        {lessons.length} lesson &middot; {totalMinutes} menit
                    </p>
                </div>
                {freeCount > 0 && (
                    <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                        {freeCount} gratis
                    </span>
                )}
            </div>

            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden divide-zinc-200 divide-y dark:divide-zinc-800 dark:bg-zinc-900">
                {lessons.map((lesson, index) => {
                    const isActive = activeLesson?.id === lesson.id;
                    const playable = canPlay(lesson);

                    return (
                        <button
                            key={lesson.id}
                            type="button"
                            onClick={() => playable && setActiveLesson(lesson)}
                            className={[
                                'w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors',
                                isActive
                                    ? 'bg-orange-50 dark:bg-orange-950/25'
                                    : playable
                                      ? 'hover:bg-zinc-50 dark:hover:bg-zinc-900/60 cursor-pointer'
                                      : 'cursor-not-allowed opacity-50',
                            ].join(' ')}
                        >
                            <div
                                className={[
                                    'w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold transition-colors',
                                    isActive
                                        ? 'bg-orange-500 text-white'
                                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500',
                                ].join(' ')}
                            >
                                {isActive ? (
                                    <Icon icon="lucide:play" width={11} />
                                ) : !playable ? (
                                    <Icon icon="lucide:lock" width={10} />
                                ) : (
                                    <span>{index + 1}</span>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <p
                                    className={[
                                        'text-xs font-semibold truncate leading-snug',
                                        isActive
                                            ? 'text-orange-600 dark:text-orange-400'
                                            : 'text-zinc-800 dark:text-zinc-200',
                                    ].join(' ')}
                                >
                                    {lesson.title}
                                </p>
                                {lesson.description && (
                                    <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                                        {lesson.description}
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                {lesson.isFree && isActive && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                                        Free
                                    </span>
                                )}
                                <span className="text-[10px] text-zinc-400 tabular-nums">
                                    {formatDuration(
                                        lesson.durationSeconds ?? 0,
                                    )}
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

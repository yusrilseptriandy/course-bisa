'use client';

import { useParams } from 'next/navigation';
import { useCourseData } from '@/app/hooks/use-course-data';
import Image from 'next/image';
import MuxPlayer from '@mux/mux-player-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { authClient } from '@/app/libs/auth-client';

const Skeleton = ({ className }: { className: string }) => (
    <div
        className={`animate-pulse bg-zinc-200 dark:bg-zinc-800 rounded ${className}`}
    />
);

export default function CourseDetailPage() {
    const [expandedDesc, setExpandedDesc] = useState(false);
    const params = useParams();
    const id = params?.id as string;

    const { data: session } = authClient.useSession();
    const user = session?.user;

    const { publicCourse, publicCourses, isPublicCourseLoading } =
        useCourseData(id);
    const isOwner = user?.id === publicCourse?.owner?.id;

    if (isPublicCourseLoading) {
        return (
            <div className="flex dark:bg-black flex-col lg:flex-row gap-6 px-4 md:px-10 py-6 max-w-350 mx-auto">
                <div className="flex-1">
                    <Skeleton className="w-full aspect-video rounded-xl" />
                    <Skeleton className="h-8 w-3/4 mt-6" />
                    <div className="flex items-center justify-between mt-4 pb-6 border-b border-gray-100 dark:border-zinc-800">
                        <div className="flex items-center gap-3">
                            <Skeleton className="w-10 h-10 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-3 w-16" />
                            </div>
                        </div>
                        <Skeleton className="h-4 w-20" />
                    </div>
                    <div className="mt-6">
                        <Skeleton className="h-4 w-24 mb-3" />
                        <Skeleton className="h-24 w-full rounded-xl" />
                    </div>
                </div>
                <div className="w-full lg:w-96 flex flex-col gap-6">
                    <Skeleton className="h-87.5 w-full rounded-2xl" />
                    <div className="flex flex-col gap-4">
                        <Skeleton className="h-4 w-20 ml-1" />
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex gap-3">
                                <Skeleton className="w-32 aspect-video rounded-lg" />
                                <div className="flex-1 space-y-2 py-2">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-3 w-2/3" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (!publicCourse) return <p className="p-10 text-center">Not found</p>;

    return (
        <div className="flex dark:bg-black flex-col lg:flex-row gap-6 px-4 md:px-10 py-6 max-w-350 mx-auto">
            <div className="flex-1">
                <div className="w-full aspect-video rounded-xl overflow-hidden">
                    <MuxPlayer
                        playbackId={publicCourse.muxPlaybackId}
                        metadata={{
                            video_title: publicCourse.name,
                        }}
                        accentColor="#F97316"
                        streamType="on-demand"
                        autoPlay={true}
                        className="w-full h-full"
                    />
                </div>

                <h1 className="text-2xl font-bold mt-6 tracking-tight">
                    {publicCourse.name}
                </h1>

                <div className="flex items-center justify-between mt-4 border-b border-gray-100 dark:border-zinc-800 pb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-zinc-200 dark:bg-zinc-800 rounded-full flex items-center justify-center">
                            <Icon
                                icon="solar:user-bold"
                                className="text-zinc-500"
                            />
                        </div>
                        <div>
                           <div className='flex items-center justify-center'>
                                <p className="font-medium text-sm">
                                {publicCourse.owner?.name}
                                 </p>
                              <Icon icon={"stash:badge-verified-solid"} width={20} className='text-orange-500'/>
                            </div>
                            <p className="text-xs text-zinc-500">Instructor</p>
                        </div>
                    </div>

                    <div className="text-xs text-zinc-400 font-medium flex items-center gap-3">
                        <div className="flex items-center justify-center bg-orange-50 cursor-pointer hover:scale-95 dark:bg-orange-950/50 rounded-full py-2 px-3 text-black dark:text-white gap-2">
                            <Icon icon={'heroicons-solid:thumb-up'} width={20} className='text-orange-500'/>
                            <p className="font-semibold text-orange-500 text-sm">120</p>
                        </div>
                        <div className="flex items-center justify-center bg-zinc-200 cursor-pointer dark:bg-zinc-800 rounded-full py-2 px-3 text-black dark:text-white gap-2 text-nowrap">
                            <Icon icon={'proicons:calendar'} width={20} />
                            {publicCourse.createdAt
                                ? new Date(
                                      publicCourse.createdAt,
                                  ).toLocaleDateString('id-ID', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric',
                                  })
                                : '-'}
                        </div>
                    </div>
                </div>

                <div className="mt-6">
                    <h2 className="text-sm font-semibold text-zinc-400 mb-3">
                        Deskripsi
                    </h2>
                    <div className="bg-zinc-100 dark:bg-zinc-900/50 rounded-xl p-5 text-sm leading-relaxed">
                        <AnimatePresence initial={false}>
                            <motion.div
                                key={expandedDesc ? 'expanded' : 'collapsed'}
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden"
                            >
                                <div></div>
                                <p
                                    className={`whitespace-pre-line text-zinc-600 dark:text-zinc-400 ${expandedDesc ? '' : 'line-clamp-2'}`}
                                >
                                    {publicCourse.desc ||
                                        'No description available for this course.'}
                                </p>
                            </motion.div>
                        </AnimatePresence>

                        {publicCourse.desc &&
                            publicCourse.desc.length > 100 && (
                                <button
                                    onClick={() =>
                                        setExpandedDesc(!expandedDesc)
                                    }
                                    className="mt-3 font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1 hover:underline"
                                >
                                    {expandedDesc
                                        ? 'Tampilkan sedikit'
                                        : 'Selengkapnya'}
                                    <Icon
                                        icon={
                                            expandedDesc
                                                ? 'solar:alt-arrow-up-linear'
                                                : 'solar:alt-arrow-down-linear'
                                        }
                                    />
                                </button>
                            )}
                    </div>
                    {publicCourse?.attachments?.length > 0 && (
                        <div className="mt-6">
                            <h2 className="text-sm font-semibold text-zinc-400 mb-3">
                                Lampiran Materi
                            </h2>

                            <div className="space-y-3">
                                {publicCourse.attachments.map((file) => (
                                    <a
                                        key={file.id}
                                        href={file.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Icon
                                                icon="solar:document-text-bold-duotone"
                                                className="text-orange-500 w-5 h-5"
                                            />
                                            <div>
                                                <p className="text-sm font-medium group-hover:text-orange-500 transition-colors">
                                                    {file.name}
                                                </p>
                                            </div>
                                        </div>

                                        <Icon
                                            icon="solar:download-bold"
                                            className="w-4 h-4 text-zinc-400 group-hover:text-orange-500 transition-colors"
                                        />
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="w-full lg:w-96 flex flex-col gap-6">
                {!isOwner && (
                    <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 bg-white dark:bg-zinc-950">
                        <div className="mb-6">
                            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                                Akses Kursus
                            </h3>
                            <p className="text-xs text-zinc-500 mt-1">
                                Pilih akses yang sesuai kebutuhan kamu
                            </p>
                        </div>

                        <div className="space-y-4">
                            {/* Trial */}
                            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 hover:border-orange-500/40 transition-all">
                                <p className="text-[11px] font-medium text-zinc-500">
                                    Akses Harian
                                </p>

                                <div className="mt-2 flex items-baseline gap-1">
                                    <span className="text-2xl font-semibold text-zinc-900 dark:text-white">
                                        Rp 5.000
                                    </span>
                                    <span className="text-xs text-zinc-500">
                                        /hari
                                    </span>
                                </div>

                                <button className="w-full mt-4 py-2.5 text-xs font-medium border border-zinc-300 dark:border-zinc-700 rounded-full hover:bg-zinc-900 hover:text-white dark:hover:bg-white dark:hover:text-black transition-all">
                                    Pilih Paket
                                </button>
                            </div>

                            <div className="border border-orange-500/30 bg-orange-500/5 dark:bg-orange-500/10 rounded-xl p-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-[11px] font-medium text-orange-600">
                                        Akses Bulanan
                                    </p>
                                    <span className="text-[10px] px-2 py-0.5 bg-orange-500 text-white rounded-full">
                                        Best Value
                                    </span>
                                </div>

                                <div className="mt-2">
                                    <span className="text-2xl font-semibold text-zinc-900 dark:text-white">
                                      {new Intl.NumberFormat('id-ID', {
                                        style: 'currency',
                                        currency: 'IDR',
                                        minimumFractionDigits: 0,
                                        }).format(publicCourse.price)}
                                    </span>
                                    <span className='text-xs ml-1 text-zinc-600'>/bulan</span>
                                </div>

                                <button className="w-full mt-4 py-2.5 text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-full transition-all">
                                    Beli Sekarang
                                </button>
                            </div>
                            <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                                <div className="flex flex-col items-center justify-center text-center text-xs text-zinc-500 gap-2">
                                    <div className="flex gap-1 items-center">
                                        {' '}
                                        <Icon
                                            icon="solar:qr-code-bold-duotone"
                                            className="w-5 h-5 text-zinc-950 dark:text-white"
                                        />
                                        <p>
                                            Pembayaran saat ini hanya mendukung{' '}
                                            <span className="font-medium text-zinc-700 dark:text-zinc-300">
                                                QRIS
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex flex-col gap-4">
                    <h3 className="text-xs font-bold text-zinc-400 ml-1">
                        Lainnya
                    </h3>
                    {publicCourses
                        ?.filter((c) => c.id !== publicCourse.id)
                        .map((course) => (
                            <div
                                key={course.id}
                                className="flex gap-3 cursor-pointer group"
                            >
                                <div className="relative w-32 aspect-video rounded-lg overflow-hidden shrink-0 bg-zinc-100">
                                    <Image
                                        src={course.thumbnail || '/c1.jpg'}
                                        alt={course.name}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                </div>

                                <div className="flex flex-col justify-center">
                                    <p className="font-semibold text-xs line-clamp-2 leading-tight group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">
                                        {course.name}
                                    </p>
                                    <p className="text-zinc-400 text-[10px] mt-1 font-medium">
                                        {course.owner?.name}
                                    </p>
                                </div>
                            </div>
                        ))}
                </div>
            </div>
        </div>
    );
}

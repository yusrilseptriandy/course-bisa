'use client';

import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { useParams, useRouter } from 'next/navigation';
import { useCourseData, Lesson, VideoStatus } from '@/app/hooks/use-course-data';
import MuxPlayer from '@mux/mux-player-react';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import CourseNotFound from '@/app/(dashboard)/teacher/components/course-not-found';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useQueryClient } from '@tanstack/react-query';

function LessonVideoCard({
    lesson,
    courseId,
    onDelete,
}: {
    lesson: Lesson;
    courseId: string;
    onDelete: (lesson: Lesson) => void;
}) {
    const { pollLessonVideoStatus, updateLesson } = useCourseData(courseId);
    const [isPolling, setIsPolling] = useState(false);

    const handlePollStatus = async () => {
        setIsPolling(true);
        try {
            const res = await pollLessonVideoStatus.mutateAsync(lesson.id);
            if (res.data?.videoStatus === 'READY') {
                toast.success(`"${lesson.title}" sudah siap ditonton`);
            } else {
                toast('Video masih diproses, coba lagi sebentar');
            }
        } finally {
            setIsPolling(false);
        }
    };

    return (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold flex items-center justify-center">
                        {lesson.order}
                    </span>
                    <p className="text-sm font-medium truncate">{lesson.title}</p>
                    <Icon icon={'proicons:pencil'} className='cursor-pointer hover:scale-95'/>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {/* Status badge */}
                    {lesson.videoStatus === VideoStatus.READY && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            READY
                        </span>
                    )}
                    {lesson.videoStatus === VideoStatus.PROCESSING && (
                        <button
                            onClick={handlePollStatus}
                            disabled={isPolling}
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 flex items-center gap-1"
                        >
                            {isPolling ? (
                                <Icon icon="mingcute:loading-2-line" className="animate-spin" width={10} />
                            ) : (
                                <Icon icon="lucide:refresh-cw" width={10} />
                            )}
                            PROCESSING
                        </button>
                    )}
                    {lesson.videoStatus === VideoStatus.FAILED && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                            FAILED
                        </span>
                    )}

                   <div
    onClick={() =>
        updateLesson.mutate({
            lessonId: lesson.id,
            isFree: !lesson.isFree,
        })
    }
    className="flex items-center gap-2 cursor-pointer select-none"
>
    {/* Label */}
    <span
        className={`text-[10px] font-semibold transition-colors ${
            lesson.isFree
                ? 'text-blue-700 dark:text-blue-400'
                : 'text-orange-500 dark:text-orange-600'
        }`}
    >
        {lesson.isFree ? 'GRATIS' : 'BERBAYAR'}
    </span>

    <div
        className={`relative w-8 h-4 rounded-full transition-colors ${
            lesson.isFree
                ? 'bg-blue-200 dark:bg-blue-900/40'
                : 'bg-orange-200 dark:bg-orange-900/40'
        }`}
    >
        <div
            className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all ${
                lesson.isFree ? 'left-4' : 'left-0.5'
            }`}
        />
    </div>
</div>

                    {/* Delete */}
                    <button
                        onClick={() => onDelete(lesson)}
                        className="text-zinc-400 hover:text-red-500 transition"
                    >
                        <Icon icon="lucide:trash-2" width={15} />
                    </button>
                </div>
            </div>

            {/* Video player or placeholder */}
            <div className="aspect-video bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
                {lesson.videoStatus === VideoStatus.READY && lesson.muxPlaybackId ? (
                    <MuxPlayer
                        playbackId={lesson.muxPlaybackId}
                        metadataVideoTitle={lesson.title}
                        accentColor="#F97316"
                        className="w-full h-full object-contain"
                    />
                ) : lesson.videoStatus === VideoStatus.PROCESSING ? (
                    <div className="flex flex-col items-center gap-2 text-zinc-400">
                        <Icon icon="mingcute:loading-2-line" className="animate-spin" width={28} />
                        <p className="text-xs">Video sedang diproses...</p>
                    </div>
                ) : lesson.videoStatus === VideoStatus.FAILED ? (
                    <div className="flex flex-col items-center gap-2 text-red-400">
                        <Icon icon="lucide:alert-circle" width={28} />
                        <p className="text-xs">Gagal memproses video</p>
                    </div>
                ) : null}
            </div>

            {/* Duration info */}
            {lesson.durationSeconds > 0 && (
                <div className="px-5 py-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-1 text-xs text-zinc-400">
                    <Icon icon="lucide:clock" width={12} />
                    <span>{Math.floor(lesson.durationSeconds / 60)}m {lesson.durationSeconds % 60}s</span>
                </div>
            )}
        </div>
    );
}

export default function VideoPage() {
    const params = useParams();
    const router = useRouter();
    const courseId = params.id as string;
    const queryClient = useQueryClient();
    const { pollLessonVideoStatus } = useCourseData(courseId, false);

    const {
        course,
        isLoading,
        isError,
        createLesson,
        deleteLesson,
        uploadAttachments,
        deleteAttachment,
    } = useCourseData(courseId);

    const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
    const [progressAttachment, setProgressAttachment] = useState(0);
    const [lessonToDelete, setLessonToDelete] = useState<Lesson | null>(null);
    const [fileToDelete, setFileToDelete] = useState<{ name: string; url: string } | null>(null);

    if(!course){
        return "tidak ada course yang tersedia"
    }

    const allLessonsReady = course.lessons?.length > 0 && 
    course.lessons.every((l) => l.videoStatus === VideoStatus.READY);

    const startPolling = (lessonId: string) => {
    const interval = setInterval(async () => {
        try {
            const res = await pollLessonVideoStatus.mutateAsync(lessonId);
            if (res.data?.videoStatus === 'READY') {
                clearInterval(interval);
                toast.success('Video siap ditonton');
                queryClient.invalidateQueries({ queryKey: ['course', courseId] });
            }
        } catch {
            clearInterval(interval);
        }
    }, 3000);
};

const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const lessonTitle = `Lesson ${(course?.lessons?.length ?? 0) + 1}`;

    try {
        const result = await createLesson.mutateAsync({
            title: lessonTitle,
            isFree: false,
        });

        const { uploadUrl, data: newLesson } = result;

        if (!uploadUrl) {
            toast.error('Gagal mendapatkan URL upload');
            return;
        }

        const lessonId = newLesson.id;
        setUploadProgress((prev) => ({ ...prev, [lessonId]: 0 }));

        await axios.put(uploadUrl, file, {
            headers: { 'Content-Type': file.type },
            onUploadProgress: (progressEvent) => {
                if (progressEvent.total) {
                    const percent = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total,
                    );
                    setUploadProgress((prev) => ({ ...prev, [lessonId]: percent }));
                }
            },
        });

        setUploadProgress((prev) => {
            const updated = { ...prev };
            delete updated[lessonId];
            return updated;
        });

        // Refresh agar lesson muncul di UI dengan status PROCESSING
        await queryClient.invalidateQueries({ queryKey: ['course', courseId] });

        toast.success('Video diunggah, sedang diproses...');
        e.target.value = '';

        // Auto polling sampai READY
        startPolling(lessonId);
    } catch {
        toast.error('Gagal mengunggah video');
    }
};

    const handleConfirmDeleteLesson = () => {
        if (lessonToDelete) {
            deleteLesson.mutate(lessonToDelete.id, {
                onSuccess: () => setLessonToDelete(null),
            });
        }
    };

    const onAttachmentsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            uploadAttachments.mutate(
                { files, onProgress: (percent) => setProgressAttachment(percent) },
                {
                    onSuccess: () => {
                        setTimeout(() => setProgressAttachment(0), 1000);
                        e.target.value = '';
                    },
                },
            );
        }
    };

    const handleConfirmDeleteAttachment = () => {
        if (fileToDelete) {
            deleteAttachment.mutate(fileToDelete.url, {
                onSuccess: () => setFileToDelete(null),
            });
        }
    };

    if (isLoading) return <div className="p-10 text-center">Memuat...</div>;
    if (isError || !course || course.isDeleted) return <CourseNotFound />;

    const activeUploads = Object.keys(uploadProgress);

    return (
        <div className="max-w-5xl mx-auto px-6 space-y-10 pb-16 md:pb-0">

            {/* ── Section: Lessons ── */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-base font-semibold">Video Pembelajaran</h2>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                            {course.totalLessons} lesson · {Math.floor((course.totalDurationSeconds ?? 0) / 60)} menit total
                        </p>
                    </div>

                    {/* Tombol tambah lesson */}
                     <label className={`cursor-pointer dark:bg-white dark:text-black text-white bg-black text-sm px-4 py-2 rounded-full  hover:bg-zinc-900 font-medium dark:hover:bg-zinc-200 transition flex items-center gap-2 ${createLesson.isPending ? 'opacity-50 pointer-events-none' : ''}`}>
                        {createLesson.isPending ? (
                            <Icon icon="mingcute:loading-2-line" className="animate-spin" width={16} />
                        ) : (
                            <Icon icon="lucide:plus" width={16} />
                        )}
                        Tambah Video
                        <input
                            type="file"
                            accept="video/*"
                            className="hidden"
                            onChange={handleVideoUpload}
                            disabled={createLesson.isPending}
                        />
                    </label>
                </div>

                <div className="space-y-4">
                    {/* Upload progress cards */}
                    {activeUploads.map((lessonId) => (
                        <div
                            key={lessonId}
                            className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5"
                        >
                            <div className="flex justify-between text-xs text-zinc-500 mb-2">
                                <span>Mengunggah video...</span>
                                <span>{uploadProgress[lessonId]}%</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                                <div
                                    className="h-full transition-all duration-300"
                                    style={{
                                        width: `${uploadProgress[lessonId]}%`,
                                        backgroundColor: '#F97316',
                                    }}
                                />
                            </div>
                        </div>
                    ))}

                    {/* Lesson cards */}
                    {course.lessons?.length > 0 ? (
                        course.lessons.map((lesson) => (
                            <LessonVideoCard
                                key={lesson.id}
                                lesson={lesson}
                                courseId={courseId}
                                onDelete={setLessonToDelete}
                            />
                        ))
                    ) : activeUploads.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 p-10 flex flex-col items-center gap-3 text-zinc-400">
                            <Icon icon="lucide:video" width={32} />
                            <p className="text-sm">Belum ada video. Klik Tambah Video untuk mulai.</p>
                        </div>
                    ) : null}
                </div>
            </section>

            {/* ── Section: Attachments ── */}
            <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-abu-second">
                <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-medium">Materi Tambahan</h2>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                            File pendukung seperti PDF atau ZIP
                        </p>
                    </div>
                    <label className="cursor-pointer text-sm px-4 py-2 rounded-full border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 items-center justify-center gap-2 dark:hover:bg-zinc-800 transition flex">
                        <Icon icon="lucide:plus" width={16} />
                        Tambah File
                        <input
                            type="file"
                            multiple
                            className="hidden"
                            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.txt"
                            onChange={onAttachmentsChange}
                            disabled={uploadAttachments.isPending}
                        />
                    </label>
                </div>

                <div className="p-6 space-y-3">
                    {uploadAttachments.isPending && (
                        <div className="w-full max-w-xs space-y-2">
                            <div className="flex justify-between text-xs text-zinc-500">
                                <span>Mengunggah file</span>
                                <span>{progressAttachment}%</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                                <div
                                    className="h-full transition-all duration-300"
                                    style={{ width: `${progressAttachment}%`, backgroundColor: '#F97316' }}
                                />
                            </div>
                        </div>
                    )}

                    {course.attachments?.length > 0 ? (
                        course.attachments.map((file, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between rounded-full border border-zinc-200 dark:border-zinc-800 px-4 py-3"
                            >
                                <div className="flex items-center gap-3">
                                    <Icon icon="lucide:file" width={18} />
                                    <span className="text-sm truncate max-w-50 md:max-w-xs">
                                        {file.name}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 shrink-0 ml-4">
                                    <a
                                        href={file.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs px-3 py-1.5 text-blue-500 hover:text-blue-600 transition font-medium"
                                    >
                                        Unduh
                                    </a>
                                    <button
                                        onClick={() => setFileToDelete({ name: file.name, url: file.url })}
                                        disabled={deleteAttachment.isPending}
                                        className="text-red-500 hover:text-red-700 cursor-pointer"
                                    >
                                        <Icon icon="lucide:trash-2" width={16} />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            Belum ada file tambahan.
                        </p>
                    )}
                </div>
            </section>

            {/* ── Tombol Selanjutnya ── */}
{allLessonsReady && (
    <div className="flex justify-end">
        <button
            onClick={() => router.push(`/teacher/dashboard/course/${courseId}/plans`)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full dark:bg-white dark:text-black text-white bg-black text-sm hover:opacity-90 active:scale-95 transition font-medium"
        >
            Selanjutnya
            <Icon icon="lucide:arrow-right" width={16} />
        </button>
    </div>
)}

            <ConfirmModal
                isOpen={!!lessonToDelete}
                onClose={() => setLessonToDelete(null)}
                onConfirm={handleConfirmDeleteLesson}
                isLoading={deleteLesson.isPending}
                title="Hapus Lesson?"
                buttomConfirm="Hapus"
                description={`Apakah kamu yakin ingin menghapus "${lessonToDelete?.title}"? Video akan dihapus permanen dari Mux.`}
            />

            <ConfirmModal
                isOpen={!!fileToDelete}
                onClose={() => setFileToDelete(null)}
                onConfirm={handleConfirmDeleteAttachment}
                isLoading={deleteAttachment.isPending}
                title="Hapus File?"
                buttomConfirm="Hapus"
                description={`Apakah kamu yakin ingin menghapus file "${fileToDelete?.name}"? Ini tidak dapat dibatalkan.`}
            />
        </div>
    );
}
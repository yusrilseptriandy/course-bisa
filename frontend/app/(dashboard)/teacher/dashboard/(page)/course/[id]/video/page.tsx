'use client';

import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { useParams } from 'next/navigation';
import { useCourseData } from '@/app/hooks/use-course-data';
import MuxPlayer from '@mux/mux-player-react';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import CourseNotFound from '@/app/(dashboard)/teacher/components/course-not-found';

export default function VideoPage() {
    const params = useParams();
    const courseId = params.id as string;

    const {
        course,
        isLoading,
        isError,
        uploadVideoToMux,
        uploadAttachments,
        deleteAttachment,
    } = useCourseData(courseId);
    const [progress, setProgress] = useState(0);
    const [progressAttachment, setProgressAttachment] = useState(0);
    const [fileToDelete, setFileToDelete] = useState<{
        name: string;
        url: string;
    } | null>(null);
    const closeDeleteModal = () => setFileToDelete(null);

    const handleConfirmDelete = () => {
        if (fileToDelete) {
            deleteAttachment.mutate(fileToDelete.url, {
                onSuccess: () => {
                    closeDeleteModal();
                },
            });
        }
    };

    const onAttachmentsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            uploadAttachments.mutate(
                {
                    files,
                    onProgress: (percent) => setProgressAttachment(percent),
                },
                {
                    onSuccess: () => {
                        setTimeout(() => setProgressAttachment(0), 1000);
                        e.target.value = '';
                    },
                },
            );
        }
    };

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            uploadVideoToMux.mutate({
                file,
                onProgress: (percent) => setProgress(percent),
            });
        }
    };

    if (isError || !course || course.isDeleted) {
        return<CourseNotFound/>
    }

    if (isLoading) return <div className="p-10 text-center">Memuat...</div>;

    return (
        <div className="max-w-5xl mx-auto px-6 space-y-10 pb-16 md:pb-0">
            <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
                <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800">
                    <div className="flex gap-2">
                        <h2 className="text-base font-medium">
                            Video Pembelajaran
                        </h2>
                        <p className="text-red-600">{`*`}</p>
                    </div>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                        Upload video utama untuk kursus ini
                    </p>
                </div>

                <div className="aspect-video flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
                    {course?.muxPlaybackId ? (
                        <MuxPlayer
                            playbackId={course.muxPlaybackId}
                            metadataVideoTitle={course.name}
                            accentColor="#F97316"
                            className="w-full h-full object-contain"
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center text-center p-10 w-full">
                            {uploadVideoToMux.isPending ? (
                                <div className="w-full max-w-xs space-y-3">
                                    <div className="flex justify-between text-xs text-zinc-500">
                                        <span>Mengunggah video</span>
                                        <span>{progress}%</span>
                                    </div>
                                    <div className="h-1.5 w-full rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                                        <div
                                            className="h-full bg-black dark:bg-white transition-all duration-300"
                                            style={{ width: `${progress}%` ,backgroundColor: '#F97316'}}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <label className="cursor-pointer group flex flex-col items-center gap-4">
                                    <div className="w-14 h-14 rounded-full border border-zinc-300 dark:border-zinc-700 flex items-center justify-center group-hover:scale-105 transition">
                                        <Icon icon="lucide:upload" width={22} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">
                                            Upload Video
                                        </p>
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                                            MP4, MOV, MKV
                                        </p>
                                    </div>
                                    <input
                                        type="file"
                                        accept="video/*"
                                        className="hidden"
                                        onChange={onFileChange}
                                    />
                                </label>
                            )}
                        </div>
                    )}
                </div>
            </section>

            <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-medium">
                            Materi Tambahan
                        </h2>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                            File pendukung seperti PDF atau ZIP
                        </p>
                    </div>

                    <label className="cursor-pointer text-sm px-4 py-2 rounded-full border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition">
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
                        <div className="w-full max-w-xs space-y-3">
                            <div className="flex justify-between text-xs text-zinc-500">
                                <span>Mengunggah file</span>
                                <span>{progressAttachment}%</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                                <div
                                    className="h-full bg-black dark:bg-white transition-all duration-300"
                                    style={{ width: `${progressAttachment}%`, backgroundColor: '#F97316' }}
                                />
                            </div>
                        </div>
                    )}
                    {course?.attachment?.length ? (
                        course.attachment.map((file, index: number) => (
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
                                        className="text-xs px-3 py-1.5 text-biru hover:text-blue-500 transition font-medium"
                                    >
                                        Unduh
                                    </a>

                                    <button
                                        onClick={() =>
                                            setFileToDelete({
                                                name: file.name,
                                                url: file.url,
                                            })
                                        }
                                        disabled={deleteAttachment.isPending}
                                        className="text-red-500 hover:text-red-700 cursor-pointer"
                                    >
                                        <Icon
                                            icon="lucide:trash-2"
                                            width={16}
                                        />
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

            <ConfirmModal
                isOpen={!!fileToDelete}
                onClose={closeDeleteModal}
                onConfirm={handleConfirmDelete}
                isLoading={deleteAttachment.isPending}
                title="Hapus File?"
                buttomConfirm="Hapus"
                description={`Apakah kamu yakin ingin menghapus file "${fileToDelete?.name}"? ini tidak dapat dibatalkan.`}
            />
        </div>
    );
}

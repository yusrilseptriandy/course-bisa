'use client';

import { useCourseData, VideoStatus } from '@/app/hooks/use-course-data';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import { Icon } from '@iconify/react';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

export const isUUID = (uuid: string) => {
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return regex.test(uuid);
};

export default function Header() {
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const pathname = usePathname();
    const router = useRouter();
    const pathSegments = pathname.split('/');
    const potentialId = pathSegments[4];

    const { deleteCourse, publishCourse, course } = useCourseData(
        potentialId && isUUID(potentialId) ? potentialId : undefined,
    );

    const onConfirmDeleteCourse = () => {
        deleteCourse.mutate(undefined, {
            onSuccess: () => setIsDeleteModalOpen(false),
        });
    };

    const isPublished = course?.courseStatus === 'PUBLISHED';

    // Validasi publish: harus ada minimal 1 lesson dan semua READY
    const hasLessons = (course?.lessons?.length ?? 0) > 0;
    const allLessonsReady = hasLessons && course!.lessons.every(
        (l) => l.videoStatus === VideoStatus.READY,
    );
    const canPublish = !isPublished && allLessonsReady && !publishCourse.isPending;

    const getPublishHint = () => {
        if (isPublished) return 'Kursus sudah dipublikasikan';
        if (!hasLessons) return 'Tambahkan minimal 1 video terlebih dahulu';
        if (!allLessonsReady) return 'Tunggu semua video berstatus READY';
        return '';
    };

    const shoulShowButtonBack = potentialId && isUUID(potentialId);

    return (
        <div className="w-full h-16 border-b px-3 md:pl-8 flex items-center border-zinc-200 bg-white dark:border-zinc-800 dark:bg-abu sticky top-0 z-50">
            {shoulShowButtonBack && (
                <div className="flex justify-between w-full">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center justify-center gap-2 cursor-pointer"
                    >
                        <Icon icon="proicons:arrow-left" />
                        <p className="text-sm">Kembali</p>
                    </button>

                    <div className="flex items-center gap-4 mr-8">
                        {/* Hapus */}
                        <button
                            onClick={() => setIsDeleteModalOpen(true)}
                            className="flex items-center hover:scale-95 cursor-pointer text-red-600 text-xs gap-1"
                        >
                            <Icon icon="proicons:delete" width={20} />
                            Hapus
                        </button>

                        {/* Publish */}
                        <div className="relative group">
                            <button
                                onClick={() => publishCourse.mutate()}
                                disabled={!canPublish}
                                className={`py-2 px-4 cursor-pointer rounded-full font-semibold flex items-center gap-2 text-xs transition-all
                                    ${isPublished
                                        ? 'bg-emerald-100 text-emerald-700 cursor-not-allowed'
                                        : canPublish
                                            ? 'bg-zinc-900 text-white dark:bg-white dark:text-black hover:scale-95'
                                            : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed opacity-60'
                                    }`}
                            >
                                {publishCourse.isPending ? (
                                    <Icon icon="line-md:loading-twotone-loop" width={18} />
                                ) : (
                                    <Icon icon={isPublished ? 'lucide:check' : 'bx:world'} width={18} />
                                )}
                                {isPublished ? 'Published' : 'Publish'}
                            </button>

                            {!canPublish && !publishCourse.isPending && (
                                <div className="absolute right-0 top-full mt-2 w-max max-w-50 bg-zinc-800 text-white text-[10px] rounded-lg px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                    {getPublishHint()}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={onConfirmDeleteCourse}
                isLoading={deleteCourse.isPending}
                title="Hapus Seluruh Kursus?"
                description={`Anda yakin menghapus course ${course?.name} ini?`}
                buttomConfirm="Hapus"
            />
        </div>
    );
}
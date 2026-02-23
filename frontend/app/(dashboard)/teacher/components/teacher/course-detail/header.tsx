'use client';

import { useCourseData } from '@/app/hooks/use-course-data';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import { Icon } from '@iconify/react';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

export const isUUID = (uuid: string) => {
    const regex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return regex.test(uuid);
};

export default function Header() {
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const pathname = usePathname();
    const router = useRouter();
    const pathSegments = pathname.split('/');
    const potentialId = pathSegments[4];
    const { deleteCourse, publishCourse, course } = useCourseData(potentialId);

    const onConfirmDeleteCourse = () => {
        deleteCourse.mutate(undefined, {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
            },
        });
    };

    const onPublish = () => {
        publishCourse.mutate();
    };

    const isPublished = course?.courseStatus === 'PUBLISHED';
    const videoNotReady = course?.videoStatus !== 'READY';

    const shoulShowButtonBack = potentialId && isUUID(potentialId);
    return (
        <div className="w-full h-16 border-b px-3 md:pl-8 flex items-center border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black sticky top-0 z-50">
            {shoulShowButtonBack && (
                <div className="flex justify-between w-full">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center justify-center gap-2 cursor-pointer"
                    >
                        <Icon icon={'proicons:arrow-left'} />
                        <p className="text-sm">Kembali</p>
                    </button>
                    <div className="flex items-center gap-4 mr-8">
                        <button
                            onClick={() => setIsDeleteModalOpen(true)}
                            className="flex items-center hover:scale-95 cursor-pointer text-red-600 text-xs gap-1"
                        >
                            <Icon icon={'proicons:delete'} width={20} />
                            Hapus
                        </button>
                        <button
                            onClick={onPublish}
                            disabled={
                                publishCourse.isPending ||
                                isPublished ||
                                videoNotReady
                            }
                            className={`py-2 px-4 cursor-pointer hover:scale-95 rounded-full font-semibold flex items-center gap-2 text-xs transition-all ${
                                isPublished
                                    ? 'bg-emerald-100 text-emerald-700 cursor-not-allowed'
                                    : 'bg-zinc-900 text-white dark:bg-white dark:text-black'
                            } ${videoNotReady ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {publishCourse.isPending ? (
                                <Icon
                                    icon="line-md:loading-twotone-loop"
                                    width={18}
                                />
                            ) : (
                                <Icon
                                    icon={
                                        isPublished
                                            ? 'lucide:check'
                                            : 'bx:world'
                                    }
                                    width={18}
                                />
                            )}
                            {isPublished ? 'Published' : 'Publish'}
                        </button>
                    </div>
                </div>
            )}
            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={onConfirmDeleteCourse}
                isLoading={deleteCourse.isPending}
                title="Hapus Seluruh Kursus?"
                description="Tindakan ini akan menghapus course secara permanen."
                buttomConfirm="Hapus"
            />
        </div>
    );
}

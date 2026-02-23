import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/app/libs/axios';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import axios from 'axios';
import confetti from 'canvas-confetti';

interface Category {
    id: string;
    name: string;
}

enum VideoStatus {
    PROCESSING = 'PROCESSING',
    READY = 'READY',
    FAILED = 'FAILED',
}

enum CourseStatus {
    DRAFT = 'DRAFT',
    READY = 'READY',
    PUBLISHED = 'PUBLISHED',
}

export interface Course {
    id: string;
    name: string;
    desc: string;
    thumbnail: string;
    categoryId: string;
    price: number;
    isPublish: boolean;
    muxPlaybackId: string;
    videoStatus: VideoStatus;
    courseStatus: CourseStatus;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    attachment: any[];
    isDeleted: boolean
}

interface UploadVideoArgs {
    file: File;
    onProgress?: (percent: number) => void;
}

interface UploadAttachmentsArg {
    files: FileList | File[];
    onProgress?: (percent: number) => void;
}

export function useCourseData(courseId: string) {
    const router = useRouter();
    const queryClient = useQueryClient();

    //ini get course berdasarkan kepemilikan owner atau teacher
    const ownerCoursesQuery = useQuery({
        queryKey: ['owner-courses'],
        queryFn: async (): Promise<Course[]> => {
            const res = await api.get(
                'http://localhost:4000/api/courses/owner',
            );
            return res.data.data || res.data;
        },
        enabled: !courseId,
    });

    // ini get course untuk seluruh nya
    const courseQuery = useQuery({
        queryKey: ['course', courseId],
        queryFn: async (): Promise<Course> => {
            const res = await api.get(
                `http://localhost:4000/api/courses/${courseId}`,
            );
            return res.data.data || res.data;
        },
        refetchOnWindowFocus: false,
        enabled: !!courseId,
    });

    const categoriesQuery = useQuery({
        queryKey: ['categories'],
        queryFn: async (): Promise<Category[]> => {
            const res = await api.get(
                'http://localhost:4000/api/courses/categories',
            );
            return res.data.data || res.data;
        },
        staleTime: 1000 * 60 * 60,
    });

    const updateCourse = useMutation({
        mutationFn: async (payload: Partial<Course> | FormData) => {
            const isFormData = payload instanceof FormData;
            return await api.patch(
                `http://localhost:4000/api/courses/${courseId}`,
                payload,
                {
                    headers: {
                        ...(isFormData
                            ? { 'Content-Type': 'multipart/form-data' }
                            : {}),
                    },
                },
            );
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['course', courseId] });
            router.push(`/teacher/dashboard/course/${courseId}/video`);
        },
    });

    const uploadAttachments = useMutation({
        mutationFn: async ({ files, onProgress }: UploadAttachmentsArg) => {
            const formData = new FormData();

            Array.from(files).forEach((file) => {
                formData.append('files', file);
            });

            const response = await api.post(
                `http://localhost:4000/api/courses/${courseId}/attachments`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                    onUploadProgress: (progressEvent) => {
                        if (onProgress && progressEvent.total) {
                            const percent = Math.round(
                                (progressEvent.loaded * 90) /
                                    progressEvent.total,
                            );
                            onProgress(percent);
                        }
                    },
                },
            );

            return response.data;
        },
        onSuccess: (variables) => {
            if (variables.onProgress) {
                variables.onProgress(100);
            }
            toast.success('File berhasil ditambahkan');
            queryClient.invalidateQueries({ queryKey: ['course', courseId] });
        },
        onError: (error, variables) => {
            if (variables.onProgress) {
                variables.onProgress(0);
            }
            toast.error(error.message || 'Gagal mengunggah file');
        },
    });

    const deleteAttachment = useMutation({
        mutationFn: async (fileUrl: string) => {
            return await api.delete(
                `http://localhost:4000/api/courses/${courseId}/attachments`,
                {
                    data: { url: fileUrl },
                },
            );
        },
        onSuccess: () => {
            toast.success('File berhasil dihapus dari server');
            queryClient.invalidateQueries({ queryKey: ['course', courseId] });
        },
        onError: (error) => {
            const msg = error.message || 'Gagal menghapus file';
            toast.error(msg);
        },
    });

    const uploadVideoToMux = useMutation({
        mutationFn: async ({ file, onProgress }: UploadVideoArgs) => {
            const response = await api.post(
                `http://localhost:4000/api/courses/${courseId}/video`,
            );
            const { url } = response.data;

            if (!url) throw new Error('Gagal mendapatkan URL upload');

            await axios.put(url, file, {
                headers: { 'Content-Type': file.type },
                onUploadProgress: (progressEvent) => {
                    if (onProgress && progressEvent.total) {
                        const percent = Math.round(
                            (progressEvent.loaded * 100) / progressEvent.total,
                        );
                        onProgress(percent);
                    }
                },
            });
            return response.data;
        },
        onSuccess: () => {
            toast.success('Video berhasil diunggah');
            queryClient.invalidateQueries({ queryKey: ['course', courseId] });

            const interval = setInterval(async () => {
                const res = await api.post(
                    `http://localhost:4000/api/courses/${courseId}/video/status`,
                );

                if (res.data.videoStatus === 'READY') {
                    clearInterval(interval);
                    queryClient.invalidateQueries({
                        queryKey: ['course', courseId],
                    });
                }
            }, 3000);
        },
    });

    const deleteCourse = useMutation({
        mutationFn: async () => {
            return await api.delete(
                `http://localhost:4000/api/courses/${courseId}`,
            );
        },
        onSuccess: () => {
            toast.success('Course berhasil dihapus');
            router.push('/teacher/dashboard/course');
            queryClient.invalidateQueries({ queryKey: ['courses'] });
        },
        onError: () => {
            toast.error('Gagal menghapus course');
        },
    });

    const publishCourse = useMutation({
        mutationFn: async () => {
            const response = await api.post(
                `http://localhost:4000/api/courses/${courseId}/publish`,
            );
            return response.data;
        },
        onSuccess: () => {
            toast.success('Kursus berhasil dipublikasikan');

           const duration = 1500;
        const end = Date.now() + duration;

        (function frame() {
            confetti({
                particleCount: 3,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
            });
            confetti({
                particleCount: 3,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        })();
        
            queryClient.invalidateQueries({ queryKey: ['course', courseId] });
            queryClient.invalidateQueries({ queryKey: ['owner-courses'] });
            setTimeout(() => {
            router.push('/teacher/dashboard/course');
        }, 2000);
        },
        onError: (error) => {
            const message = error.message || 'Gagal mempublikasikan kursus';
            toast.error(message);
        },
    });

    return {
        course: courseQuery.data,
        categories: categoriesQuery.data,
        isLoading: courseQuery.isLoading || categoriesQuery.isLoading,
        ownerCourses: ownerCoursesQuery.data,
        isError: courseQuery.isError || categoriesQuery.isError,
        updateCourse,
        uploadVideoToMux,
        uploadAttachments,
        deleteAttachment,
        deleteCourse,
        publishCourse,
    };
}

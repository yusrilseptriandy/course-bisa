import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/app/libs/axios';
import { usePathname, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import axios from 'axios';
import confetti from 'canvas-confetti';

export const BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/courses`;

interface Category {
    id: string;
    name: string;
    slug: string;
}

export enum VideoStatus {
    PROCESSING = 'PROCESSING',
    READY = 'READY',
    FAILED = 'FAILED',
}

export enum CourseStatus {
    DRAFT = 'DRAFT',
    READY = 'READY',
    PUBLISHED = 'PUBLISHED',
}

export enum SubscriptionType {
    DAILY = 'DAILY',
    WEEKLY = 'WEEKLY',
    MONTHLY = 'MONTHLY',
    LIFETIME = 'LIFETIME',
}

export interface Owner {
    id: string;
    name: string;
    image?: string;
}

export interface Lesson {
    id: string;
    courseId: string;
    title: string;
    description?: string | null;
    order: number;
    durationSeconds: number;
    isFree: boolean;
    muxUploadId?: string | null;
    muxAssetId?: string | null;
    muxPlaybackId?: string | null;
    videoStatus: VideoStatus;
    createdAt?: string;
    updatedAt?: string;
}

export interface SubscriptionPlan {
    id: string;
    type: SubscriptionType;
    price: number;
    durationDays?: number | null;
    isActive: boolean;
}

export interface Attachment {
    id?: string;
    name: string;
    url: string;
}

export interface Course {
    id: string;
    name: string;
    desc?: string;
    thumbnail?: string | null;
    categoryId?: string | null;
    category?: { id: string; name: string; slug: string } | null;
    owner?: Owner;
    ownerId: string;
    isPublish: boolean;
    courseStatus: CourseStatus;
    lessons: Lesson[];
    plans?: SubscriptionPlan[];
    attachments: Attachment[];
    totalDurationSeconds: number;
    totalLessons: number;
    _count?: { likes: number; comments: number };
    isDeleted: boolean;
    isDraft?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

interface UploadVideoArgs {
    lessonId: string;
    file: File;
    onProgress?: (percent: number) => void;
}

interface UploadAttachmentsArg {
    files: FileList | File[];
    onProgress?: (percent: number) => void;
}

interface CreateLessonArg {
    title: string;
    description?: string;
    isFree?: boolean;
}

interface UpdateLessonArg {
    lessonId: string;
    title?: string;
    description?: string;
    isFree?: boolean;
}

interface CreatePlanArg {
    type: SubscriptionType;
    price: number;
    durationDays?: number;
}

interface UpdatePlanArg {
    planId: string;
    price?: number;
    durationDays?: number;
    isActive?: boolean;
}


export function useCourseData(courseId?: string, isPublic?: boolean) {
    
    const pathname = usePathname()
    const isHomePage = pathname === '/'
    const router = useRouter();
    const queryClient = useQueryClient();

    const publicCoursesQuery = useQuery({
        queryKey: ['public-courses'],
        queryFn: async (): Promise<Course[]> => {
            const res = await axios.get(`${BASE_URL}`);
            return res.data.data || res.data;
        },
        staleTime: 1000 * 60 * 5,
    });

    const publicCourseDetailQuery = useQuery({
        queryKey: ['public-course', courseId],
        queryFn: async (): Promise<Course> => {
            const res = await axios.get(`${BASE_URL}/publik/${courseId}`);
            return res.data.data || res.data;
        },
        enabled: !!courseId && isPublic === true,
        staleTime: 1000 * 60 * 5,
    });

    const categoriesQuery = useQuery({
        queryKey: ['categories'],
        queryFn: async (): Promise<Category[]> => {
            const res = await axios.get(`${BASE_URL}/categories`);
            return res.data.data || res.data;
        },
        enabled: isPublic !== true,
        staleTime: 1000 * 60 * 60,
    });

    const ownerCoursesQuery = useQuery({
        queryKey: ['owner-courses'],
        queryFn: async (): Promise<Course[]> => {
            const res = await api.get(`${BASE_URL}/owner`);
            return res.data.data || res.data;
        },
        enabled: !isHomePage && isPublic !== true && !courseId,
    });

    const courseQuery = useQuery({
        queryKey: ['course', courseId],
        queryFn: async (): Promise<Course> => {
            const res = await api.get(`${BASE_URL}/${courseId}`);
            return res.data.data || res.data;
        },
        refetchOnWindowFocus: false,
        enabled: !!courseId && isPublic !== true,
    });

    const updateCourse = useMutation({
        mutationFn: async (payload: Partial<Course> | FormData) => {
            const isFormData = payload instanceof FormData;
            return await api.patch(`${BASE_URL}/${courseId}`, payload, {
                headers: {
                    ...(isFormData ? { 'Content-Type': 'multipart/form-data' } : {}),
                },
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['course', courseId] });
            toast.success('Course berhasil diperbarui');
            router.push(`/teacher/dashboard/course/${courseId}/lessons`);
        },
        onError: () => {
            toast.error('Gagal memperbarui course');
        },
    });

    const createLesson = useMutation({
        mutationFn: async (payload: CreateLessonArg) => {
            const res = await api.post(`${BASE_URL}/${courseId}/lessons`, payload);
            return res.data as { success: boolean; uploadUrl: string; data: Lesson };
        },
    });

    // ── upload video langsung ke Mux URL ──
    const uploadVideoToMux = useMutation({
        mutationFn: async ({ lessonId, file, onProgress }: UploadVideoArgs) => {
            const { uploadUrl } = await (async () => {
                throw new Error('Gunakan createLesson terlebih dahulu untuk mendapat uploadUrl');
            })();

            await axios.put(uploadUrl, file, {
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

            return { lessonId };
        },
    });

    const uploadVideoWithUrl = async ({
        uploadUrl,
        lessonId,
        file,
        onProgress,
    }: {
        uploadUrl: string;
        lessonId: string;
        file: File;
        onProgress?: (percent: number) => void;
    }) => {
        await axios.put(uploadUrl, file, {
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

        const interval = setInterval(async () => {
            try {
                const res = await api.post(
                    `${BASE_URL}/${courseId}/lessons/${lessonId}/video/status`,
                );
                if (res.data.data?.videoStatus === 'READY') {
                    clearInterval(interval);
                    toast.success('Video berhasil diproses');
                    queryClient.invalidateQueries({ queryKey: ['course', courseId] });
                }
            } catch {
                clearInterval(interval);
            }
        }, 3000);
    };

    const pollLessonVideoStatus = useMutation({
        mutationFn: async (lessonId: string) => {
            const res = await api.post(
                `${BASE_URL}/${courseId}/lessons/${lessonId}/video/status`,
            );
            return res.data;
        },
        onSuccess: (data) => {
            if (data.data?.videoStatus === 'READY') {
                queryClient.invalidateQueries({ queryKey: ['course', courseId] });
            }
        },
    });

    const updateLesson = useMutation({
        mutationFn: async ({ lessonId, ...payload }: UpdateLessonArg) => {
            const res = await api.patch(
                `${BASE_URL}/${courseId}/lessons/${lessonId}`,
                payload,
            );
            return res.data;
        },
        onSuccess: () => {
            toast.success('Lesson berhasil diperbarui');
            queryClient.invalidateQueries({ queryKey: ['course', courseId] });
        },
        onError: () => {
            toast.error('Gagal memperbarui lesson');
        },
    });

    const deleteLesson = useMutation({
        mutationFn: async (lessonId: string) => {
            return await api.delete(`${BASE_URL}/${courseId}/lessons/${lessonId}`);
        },
        onSuccess: () => {
            toast.success('Lesson berhasil dihapus');
            queryClient.invalidateQueries({ queryKey: ['course', courseId] });
        },
        onError: () => {
            toast.error('Gagal menghapus lesson');
        },
    });

    const uploadAttachments = useMutation({
        mutationFn: async ({ files, onProgress }: UploadAttachmentsArg) => {
            const formData = new FormData();
            Array.from(files).forEach((file) => formData.append('files', file));

            const response = await api.post(
                `${BASE_URL}/${courseId}/attachments`,
                formData,
                {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    onUploadProgress: (progressEvent) => {
                        if (onProgress && progressEvent.total) {
                            const percent = Math.round(
                                (progressEvent.loaded * 90) / progressEvent.total,
                            );
                            onProgress(percent);
                        }
                    },
                },
            );

            return response.data;
        },
        onSuccess: () => {
            toast.success('File berhasil ditambahkan');
            queryClient.invalidateQueries({ queryKey: ['course', courseId] });
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Gagal mengunggah file');
        },
    });

    const deleteAttachment = useMutation({
        mutationFn: async (fileUrl: string) => {
            return await api.delete(`${BASE_URL}/${courseId}/attachments`, {
                data: { url: fileUrl },
            });
        },
        onSuccess: () => {
            toast.success('File berhasil dihapus');
            queryClient.invalidateQueries({ queryKey: ['course', courseId] });
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Gagal menghapus file');
        },
    });

    const createPlan = useMutation({
        mutationFn: async (payload: CreatePlanArg) => {
            const res = await api.post(`${BASE_URL}/${courseId}/plans`, payload);
            return res.data;
        },
        onSuccess: () => {
            toast.success('Plan berhasil dibuat');
            queryClient.invalidateQueries({ queryKey: ['course', courseId] });
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Gagal membuat plan');
        },
    });

    const updatePlan = useMutation({
        mutationFn: async ({ planId, ...payload }: UpdatePlanArg) => {
            const res = await api.patch(
                `${BASE_URL}/${courseId}/plans/${planId}`,
                payload,
            );
            return res.data;
        },
        onSuccess: () => {
            toast.success('Plan berhasil diperbarui');
            queryClient.invalidateQueries({ queryKey: ['course', courseId] });
        },
        onError: () => {
            toast.error('Gagal memperbarui plan');
        },
    });

    const deletePlan = useMutation({
        mutationFn: async (planId: string) => {
            return await api.delete(`${BASE_URL}/${courseId}/plans/${planId}`);
        },
        onSuccess: () => {
            toast.success('Plan berhasil dihapus');
            queryClient.invalidateQueries({ queryKey: ['course', courseId] });
        },
        onError: () => {
            toast.error('Gagal menghapus plan');
        },
    });

    const deleteCourse = useMutation({
        mutationFn: async () => {
            return await api.delete(`${BASE_URL}/${courseId}`);
        },
        onSuccess: () => {
            toast.success('Course berhasil dihapus');
            router.push('/teacher/dashboard/course');
            queryClient.invalidateQueries({ queryKey: ['owner-courses'] });
        },
        onError: () => {
            toast.error('Gagal menghapus course');
        },
    });

    const publishCourse = useMutation({
        mutationFn: async () => {
            const res = await api.post(`${BASE_URL}/${courseId}/publish`);
            return res.data;
        },
        onSuccess: () => {
            toast.success('Kursus berhasil dipublikasikan!');

            const duration = 1500;
            const end = Date.now() + duration;
            (function frame() {
                confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 } });
                confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 } });
                if (Date.now() < end) requestAnimationFrame(frame);
            })();

            queryClient.invalidateQueries({ queryKey: ['course', courseId] });
            queryClient.invalidateQueries({ queryKey: ['owner-courses'] });

            setTimeout(() => {
                router.push('/teacher/dashboard/course');
            }, 2000);
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Gagal mempublikasikan kursus');
        },
    });

    const unpublishCourse = useMutation({
        mutationFn: async () => {
            const res = await api.post(`${BASE_URL}/${courseId}/unpublish`);
            return res.data;
        },
        onSuccess: () => {
            toast.success('Course berhasil di-unpublish.');
            queryClient.invalidateQueries({ queryKey: ['course', courseId] });
            queryClient.invalidateQueries({ queryKey: ['owner-courses'] });
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Gagal unpublish course');
        },
    });

    return {
        // Queries
        course: courseQuery.data,
        isLoading: courseQuery.isLoading,
        isError: courseQuery.isError,

        publicCourses: publicCoursesQuery.data,
        isPublicLoading: publicCoursesQuery.isLoading,

        publicCourse: publicCourseDetailQuery.data,
        isPublicCourseLoading: publicCourseDetailQuery.isLoading,

        categories: categoriesQuery.data,
        isCategoriesLoading: categoriesQuery.isLoading,

        ownerCourses: ownerCoursesQuery.data,
        isOwnerCoursesLoading: ownerCoursesQuery.isLoading,

        // Mutations
        updateCourse,
        createLesson,
        deletePlan,
        updateLesson,
        deleteLesson,
        uploadVideoWithUrl,
        uploadVideoToMux,
        pollLessonVideoStatus,
        uploadAttachments,
        deleteAttachment,
        createPlan,
        updatePlan,
        deleteCourse,
        publishCourse,
        unpublishCourse,
    };
}
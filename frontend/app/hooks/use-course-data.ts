import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/app/libs/axios';
import { useRouter } from 'next/navigation';


interface Category {
    id: string;
    name: string;
}

enum VideoStatus {
  PROCESSING = "PROCESSING",
  READY = "READY",
  FAILED = "FAILED",
}

enum CourseStatus {
    DRAFT = "DRAFT",
    READY = "READY",
    PUBLISHED = "PUBLISHED"
}

export interface Course {
    id: string;
    name: string;
    desc: string;
    thumbnail: string;
    categoryId: string;
    price: number;
    isPublish: boolean
    muxPlaybackId: string
    videoStatus: VideoStatus
    courseStatus: CourseStatus
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    attachments: any[];
}


export function useCourseData(courseId: string) {
    const router = useRouter();
    const queryClient = useQueryClient();
    
    const uploadVideoInit = useMutation({
        mutationFn: async (payload: FormData)=>{
            const res = await api.post(`http://localhost:4000/api/courses/${courseId}/video`, payload, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data;
        }
    })

    const courseQuery = useQuery({
        queryKey: ['course', courseId],
        queryFn: async (): Promise<Course> => {
            const res = await api.get(`http://localhost:4000/api/courses/${courseId}`);
            return res.data.data || res.data;
        },
        refetchOnWindowFocus: false,
        enabled: !!courseId,
    });

    const categoriesQuery = useQuery({
        queryKey: ['categories'],
        queryFn: async (): Promise<Category[]> => {
            const res = await api.get('http://localhost:4000/api/courses/categories');
            return res.data.data || res.data;
        },
        staleTime: 1000 * 60 * 60,
    });

    const updateCourse = useMutation({
        mutationFn: async (payload: Partial<Course> | FormData) => {
            const isFormData = payload instanceof FormData;
            return await api.patch(`http://localhost:4000/api/courses/${courseId}`, payload, {
                headers:{
                    ...(isFormData ? { 'Content-Type': 'multipart/form-data' } : {}),
                }
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['course', courseId] });
            router.push(`/teacher/dashboard/course/${courseId}/video`);
        },
    });

    

    return {
        course: courseQuery.data,
        categories: categoriesQuery.data,
        isLoading: courseQuery.isLoading || categoriesQuery.isLoading,
        isError: courseQuery.isError || categoriesQuery.isError,
        updateCourse, 
        uploadVideoInit
    };
}


'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { EditorField } from '@/app/(dashboard)/teacher/components/teacher/course-detail/editor-field';
import { useCourseData } from '@/app/hooks/use-course-data';
import {
    courseSchema,
    CourseSchemaType,
} from '@/app/libs/schemas/course.schema';
import { useForm, useWatch, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import CategorySelect from '@/app/(dashboard)/teacher/components/teacher/course-detail/select-category';
import CourseNotFound from '@/app/(dashboard)/teacher/components/course-not-found';

export default function CourseEditor() {
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
    const thumbnailInputRef = useRef<HTMLInputElement>(null);
    const params = useParams();
    const courseId = params.id as string;

    const { course, categories, isLoading, updateCourse } = useCourseData(courseId, false);

    const {
        register,
        handleSubmit,
        reset,
        control,
        setValue,
        formState: { errors },
    } = useForm<CourseSchemaType>({
        resolver: zodResolver(courseSchema),
        defaultValues: {
            name: '',
            desc: '',
            categoryId: '',
            thumbnail: undefined,
        },
    });

    useEffect(() => {
        if (course) {
            reset({
                name: course.name || '',
                desc: course.desc || '',
                categoryId: course.categoryId || '',
                thumbnail: course.thumbnail || undefined,
            });
        }
    }, [course, reset]);

    const nameValue = useWatch({ control, name: 'name' });

    const onThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setThumbnailPreview(URL.createObjectURL(file));
            setValue('thumbnail', file, {
                shouldValidate: true,
                shouldDirty: true,
            });
        }
    };

    const onSubmit = (data: CourseSchemaType) => {
        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('desc', data.desc);
        formData.append('categoryId', data.categoryId);

        if (data.thumbnail instanceof File) {
            formData.append('thumbnail', data.thumbnail);
        }

        toast.promise(updateCourse.mutateAsync(formData), {
            loading: 'Menyimpan perubahan...',
            error: 'Gagal menyimpan data.',
        });
    };


    if (isLoading) {
        return (
            <Icon
                icon="mingcute:loading-2-line"
                className="animate-spin m-10"
                width={30}
            />
        );
    }

    if (!course) {
        return <CourseNotFound />;
    }

    return (
        <div className="max-w-7xl dark:text-[#f1f1f1] mb-16 md:mb-0">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Course Details</h1>
            </div>

            <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-6"
            >
                {/* Judul */}
                <EditorField
                    label="Judul Kursus"
                    charCount={`${nameValue?.length || 0}/100`}
                >
                    <input
                        {...register('name')}
                        type="text"
                        className="outline-none font-semibold w-full bg-transparent text-[15px] py-1"
                    />
                    {errors.name && (
                        <p className="text-red-500 text-xs mt-1">
                            {errors.name.message}
                        </p>
                    )}
                </EditorField>

                {/* Deskripsi */}
                <EditorField label="Deskripsi">
                    <textarea
                        {...register('desc')}
                        placeholder="Jelaskan isi materi..."
                        className="outline-none w-full bg-transparent text-[15px] py-1 min-h-30 resize-none"
                    />
                    {errors.desc && (
                        <p className="text-red-500 text-xs mt-1">
                            {errors.desc.message}
                        </p>
                    )}
                </EditorField>

                {/* Kategori */}
                <EditorField label="Kategori">
                    <Controller
                        name="categoryId"
                        control={control}
                        render={({ field }) => (
                            <CategorySelect
                                options={categories || []}
                                value={field.value}
                                onChange={field.onChange}
                                error={errors.categoryId?.message}
                            />
                        )}
                    />
                    {errors.categoryId && (
                        <p className="text-red-500 text-xs mt-1">
                            {errors.categoryId.message}
                        </p>
                    )}
                </EditorField>

                {/* Thumbnail */}
                <div
                    onClick={() => thumbnailInputRef.current?.click()}
                    className={`border cursor-pointer rounded-xl aspect-video flex items-center justify-center relative overflow-hidden group transition-all
                        ${errors.thumbnail ? 'border-red-500' : 'border-gray-200 dark:border-zinc-800'}`}
                >
                    <input
                        type="file"
                        accept="image/*"
                        ref={thumbnailInputRef}
                        className="hidden"
                        onChange={onThumbnailChange}
                    />

                    {thumbnailPreview || course.thumbnail ? (
                        <Image
                            fill
                            src={thumbnailPreview || course.thumbnail!}
                            alt="Thumbnail"
                            className="w-full h-full object-cover rounded-xl"
                        />
                    ) : (
                        <div className="flex flex-col items-center text-zinc-500">
                            <Icon icon="lucide:image-plus" width={40} />
                            <p className="text-xs mt-2">Pilih file thumbnail</p>
                        </div>
                    )}

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs">
                        Klik untuk mengganti gambar
                    </div>

                    {errors.thumbnail && (
                        <p className="text-red-500 text-xs font-medium flex items-center gap-1">
                            <Icon icon="lucide:alert-circle" width={14} />
                            {errors.thumbnail.message as string}
                        </p>
                    )}
                </div>

                {/* Info harga */}
                <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 text-xs">
                    <Icon icon="lucide:info" width={14} className="mt-0.5 shrink-0" />
                    <span>
                        Pengaturan harga dan paket dapat diatur setelah course diterbitkan melalui menu <strong>Pilihan Paket</strong>.
                    </span>
                </div>

                <button
                    type="submit"
                    disabled={updateCourse.isPending}
                    className={`w-full py-3 rounded-full text-sm transition-all font-semibold flex items-center justify-center gap-2
                        ${!updateCourse.isPending
                            ? 'text-white border dark:bg-white dark:text-black bg-black hover:scale-95'
                            : 'bg-zinc-200 text-zinc-500 cursor-not-allowed'
                        }`}
                >
                    {updateCourse.isPending ? (
                        <Icon
                            icon="mingcute:loading-2-line"
                            className="animate-spin"
                            width={20}
                        />
                    ) : (
                        'Selanjutnya'
                    )}
                </button>
            </form>
        </div>
    );
}
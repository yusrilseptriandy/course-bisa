'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { EditorField } from '@/app/(dashboard)/teacher/components/teacher/course-detail/editor-field';
import { useCourseData } from '@/app/hooks/use-course-data';
import { courseSchema, CourseSchemaType } from '@/app/libs/schemas/course.schema';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';

function AttachmentItem({
    icon,
    name,
    onDelete,
}: {
    icon: React.ReactNode;
    name: string;
    onDelete?: () => void;
}) {
    return (
        <div className="bg-biru/10 border border-biru p-3 rounded-lg flex items-center gap-3 group transition-all cursor-pointer">
            <div className="p-2 dark:bg-black/20 rounded-md">{icon}</div>
            <div className="flex-1 min-w-0">
                <p className="text-sm dark:text-[#f1f1f1] font-medium truncate">
                    {name}
                </p>
            </div>
            <button
                onClick={onDelete}
                className="dark:text-[#aaaaaa] opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500"
            >
                <Icon icon="lucide:trash-2" width={16} />
            </button>
        </div>
    );
}

export default function CourseEditor() {
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
    const thumbnailInputRef = useRef<HTMLInputElement>(null);
    const [selectedAttachments, setSelectedAttachments] = useState<File[]>([]);
    const [price, setPrice] = useState('')

    const attachmentInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);
    const params = useParams();
    const courseId = params.id;
    const { course, categories, isLoading, updateCourse } = useCourseData(
        courseId as string,
    );

    const {
      register,
      handleSubmit,
      reset,
      setValue,
      watch,
      formState: {errors, isDirty}
    } = useForm<CourseSchemaType>({
        resolver: zodResolver(courseSchema),
        defaultValues: {
            name: '',
            desc: '',
            categoryId: '',
            price: 0,
            thumbnail: undefined
        }
    })

    useEffect(()=>{
      if (course){
        reset({
          name: course.name || '',
                desc: course.desc || '',
                categoryId: course.categoryId || '',
                price: course.price || 0,
        })
      }
    },[course, reset])

    const onThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>)=>{
      const file = e.target.files?.[0]
      if(file){
        setThumbnailPreview(URL.createObjectURL(file));
        setValue('thumbnail', file, { 
            shouldValidate: true, 
            shouldDirty: true 
        });
      }
    }

       const onSubmit = (data: CourseSchemaType)=> {
        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('desc', data.desc);
        formData.append('price', data.price.toString());
        formData.append('categoryId', data.categoryId);

        if (data.thumbnail instanceof File){
          formData.append('thumbnail', data.thumbnail)
        }else if (thumbnailFile){
          formData.append('thumbnail', thumbnailFile);
        }

        toast.promise(updateCourse.mutateAsync(formData), {
          loading: 'Menyimpan perubahan...',
            success: 'Kursus berhasil diperbarui!',
            error: 'Gagal menyimpan data.',
        })
    }

    if (isLoading) return <Icon icon="mingcute:loading-2-line" className="animate-spin m-10" width={30} />;

    const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const validFiles = files.filter((file) => {
            if (file.type.startsWith('video/')) {
                return file;
            }
            return true;
        });
        setSelectedAttachments((prev) => [...prev, ...validFiles]);
        if (attachmentInputRef.current) attachmentInputRef.current.value = '';
    };

    const removeSelectedFile = (index: number) => {
        setSelectedAttachments((prev) => prev.filter((_, i) => i !== index));
    };

    if (!course) {
        return <h1>Data tidak ada</h1>;
    }

    return (
        <div className="max-w-7xl mx-auto dark:text-[#f1f1f1] mb-16 md:mb-0">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Course Details</h1>
            </div>

            <div className="grid grid-cols-12 gap-8">
                <form onSubmit={handleSubmit(onSubmit)} className="col-span-12 lg:col-span-8 space-y-6">
                    {/*Title Input */}
                    <EditorField
                        label="Judul Kursus"
                        charCount={`${watch('name')?.length || 0}/100`}
                    >
                        <input
                            {...register('name')}
                            type="text"
                            defaultValue={course.name}
                            className="outline-none font-semibold w-full bg-transparent text-[15px] py-1 disabled:text-zinc-500"
                        />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                    </EditorField>

                    {/* Desc */}
                    <EditorField label="Deskripsi">
                        <textarea
                            {...register('desc')}
                            placeholder="Jelaskan isi materi..."
                            className="outline-none w-full bg-transparent text-[15px] py-1 min-h-30 resize-none"
                        />
                        {errors.desc && <p className="text-red-500 text-xs mt-1">{errors.desc.message}</p>}
                    </EditorField>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Category Select */}
                        <EditorField label="Kategori">
                            <select
                                {...register('categoryId')}
                                className="outline-none w-full bg-transparent text-[15px] py-1 cursor-pointer appearance-none"
                            >
                                <option
                                    value=""
                                    disabled
                                    className="dark:bg-zinc-900"
                                >
                                    Pilih Kategori
                                </option>
                                {categories?.map((cat) => (
                                    <option
                                        key={cat.id}
                                        value={cat.id}
                                        className="dark:bg-zinc-900"
                                    >
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                            {errors.categoryId && <p className="text-red-500 text-xs mt-1">{errors.categoryId.message}</p>}
                        </EditorField>

                        <EditorField label="Harga (IDR)">
                            <div className="flex items-center gap-2 font-bold">
                                <span className="text-zinc-500">Rp</span>
                                <input
                                {...register('price')}
                                    type="text"
                                    inputMode="numeric"
                                    onChange={(e) => {
                                        const onlyNumber =
                                            e.target.value.replace(/\D/g, '');
                                        setPrice(onlyNumber);
                                    }}
                                    onWheel={(e) => e.currentTarget.blur()}
                                    placeholder="0"
                                    className="bg-transparent outline-none w-full"
                                />
                            </div>
                            {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
                        </EditorField>
                    </div>
                    <div
                        onClick={() => thumbnailInputRef.current?.click()}
                        className={`border cursor-pointer rounded-xl aspect-video flex items-center justify-center relative overflow-hidden group transition-all
            ${errors.thumbnail ? 'border-red-500 bg-red-50' : 'border-gray-200 dark:border-zinc-800'}`}
    >
                        <input
                            type="file"
                            accept="image/*"
                            ref={thumbnailInputRef}
                            className="hidden"
                            onChange={onThumbnailChange}
                        />
                        <div>
                            {thumbnailPreview || course.thumbnail ? (
                                <Image
                                    fill
                                    src={thumbnailPreview || course.thumbnail}
                                    alt="Thumbnail"
                                    className="w-full h-full object-cover rounded-xl"
                                />
                            ) : (
                                <div className="flex flex-col items-center text-zinc-500">
                                    <Icon icon="lucide:image-plus" width={40} />
                                    <p className="text-xs mt-2">
                                        Pilih file thumbnail
                                    </p>
                                </div>
                            )}
                        </div>

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
                    <button 
                        type="submit"
                        disabled={!isDirty && !thumbnailFile || updateCourse.isPending}
                        className={`w-full py-3 rounded-full font-bold transition-all flex items-center justify-center gap-2
                            ${(isDirty || thumbnailFile) && !updateCourse.isPending 
                                ? "bg-black text-white dark:bg-white dark:text-black hover:scale-95" 
                                : "bg-zinc-200 text-zinc-500 cursor-not-allowed"}`}
                    >
                        {updateCourse.isPending ? (
                            <Icon icon="mingcute:loading-2-line" className="animate-spin" width={20} />
                        ) : "Simpan Perubahan"}
                    </button>
                </form>

                {/* --- KOLOM KANAN  */}
                <div className="col-span-12 lg:col-span-4">
                    <div className="sticky top-6 space-y-4">
                        <div className="bg-white dark:bg-[#1e1e1e] rounded-xl overflow-hidden border border-gray-200 dark:border-[#3e3e3e]">
                            <input
                                type="file"
                                accept="video/*"
                                ref={videoInputRef}
                                className="hidden"
                            />

                            {/* Video Area */}
                            <div className="aspect-video dark:bg-black flex items-center justify-center relative group cursor-pointer">
                                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-white/20 transition-all">
                                    <Icon
                                        icon="lucide:upload"
                                        className={`dark:text-white ml-1`}
                                        width={20}
                                    />
                                </div>
                            </div>
                        </div>

                        <button className="px-4 bg-black text-white dark:bg-white dark:text-black rounded-full text-sm font-semibold py-3 w-full cursor-pointer hover:scale-95
                        transition-all">
                            Upload Video
                        </button>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-sm font-bold dark:text-[#f1f1f1]">
                                    Attachments
                                </h3>
                                <button
                                    onClick={() =>
                                        attachmentInputRef.current?.click()
                                    }
                                    className="text-biru flex items-center gap-1 hover:opacity-80 transition-all cursor-pointer"
                                >
                                    <span className="text-[11px] font-bold uppercase">
                                        Add Files
                                    </span>
                                    <Icon icon="lucide:plus" width={14} />
                                </button>
                                <input
                                    type="file"
                                    multiple
                                    ref={attachmentInputRef}
                                    className="hidden"
                                    accept=".pdf, .doc, .docx, .xls, .xlsx, .ppt, .pptx, .zip, .rar"
                                    onChange={handleAttachmentChange}
                                />
                            </div>

                            <div className="space-y-2">
                                {selectedAttachments.map((file, index) => (
                                    <AttachmentItem
                                        key={`new-${index}`}
                                        icon={
                                            <Icon
                                                icon="lucide:file-up"
                                                className="text-amber-500 animate-pulse"
                                                width={18}
                                            />
                                        }
                                        name={file.name}
                                        onDelete={() =>
                                            removeSelectedFile(index)
                                        }
                                    />
                                ))}

                                {course.attachments?.map((att) => (
                                    <AttachmentItem
                                        key={att.id}
                                        icon={
                                            <Icon
                                                icon="lucide:file-text"
                                                className="text-biru"
                                                width={18}
                                            />
                                        }
                                        name={att.name}
                                        onDelete={() => {
                                            /* Fungsi delete API di sini */
                                        }}
                                    />
                                ))}

                                {selectedAttachments.length === 0 &&
                                    (!course?.attachments ||
                                        course.attachments.length === 0) && (
                                        <div className="text-center py-6 border border-dashed border-gray-200 dark:border-zinc-800 rounded-lg">
                                            <p className="text-sm text-zinc-500 tracking-widest">
                                                Belum ada files
                                            </p>
                                        </div>
                                    )}
                            </div>

                            {selectedAttachments.length > 0 && (
                                <button
                                    className="px-4 dark:bg-white dark:text-black text-white rounded-full text-sm font-semibold py-2 w-full cursor-pointer hover:scale-95 transition-all bg-black "
                                    onClick={() => {
                                        console.log(
                                            'Files to upload:',
                                            selectedAttachments,
                                        );
                                        // Di sini masukkan logika upload FormData 
                                    }}
                                >
                                    Upload {selectedAttachments.length} New
                                    Files
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

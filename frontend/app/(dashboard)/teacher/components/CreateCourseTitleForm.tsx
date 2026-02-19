'use client';

import { Icon } from '@iconify/react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { motion, Variants } from 'framer-motion'; // Import motion
import {
    CreateCourseName,
    createNameCourseSchema,
} from '@/app/libs/schemas/course.schema';
import { api } from '@/app/libs/axios';

interface ModalProps {
    onClose: () => void;
}

export default function CreateCourseModal({ onClose }: ModalProps) {
    const router = useRouter();

     const {
        register,
        handleSubmit,
        control,
        formState: { errors },
    } = useForm<CreateCourseName>({
        resolver: zodResolver(createNameCourseSchema),
        defaultValues: { name: '' },
    });

    const nameValue = useWatch({ control, name: 'name', defaultValue: '' });

    const { mutate, isPending } = useMutation({
        mutationFn: async (data: CreateCourseName) => {
            const res = await api.post('/courses', data);
            return res.data;
        },
        onSuccess: (response) => {
            onClose();
            router.push(`/teacher/dashboard/course/${response.data.id}`);
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError: (error: any) => {
            alert(error.response?.data?.error || 'Terjadi kesalahan');
        },
    });

    const backdropVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
    };

    const modalVariants: Variants = {
        hidden: { opacity: 0, scale: 0.9, y: 20 },
        visible: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: {
                type: 'spring',
                damping: 25,
                stiffness: 300,
            },
        },
        exit: {
            opacity: 0,
            scale: 0.9,
            y: 10,
            transition: { duration: 0.2 },
        },
    };

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <motion.div
                variants={backdropVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            <motion.div
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="relative w-full max-w-2xl bg-[#1e1e1e] border border-[#3e3e3e] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
                <div className="flex justify-between items-center p-6 border-b border-[#3e3e3e]">
                    <h2 className="text-xl font-bold text-[#f1f1f1]">
                        Buat Materi Baru
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-white/10 rounded-full transition-colors text-[#aaaaaa] hover:text-white"
                    >
                        <Icon icon="lucide:x" width={24} />
                    </button>
                </div>

                <form
                    onSubmit={handleSubmit((data) => mutate(data))}
                    className="p-8"
                >
                    <div className="space-y-1">
                        <div
                            className={`group border rounded-md p-3 transition-all duration-200 bg-transparent
                ${errors.name ? 'border-red-500' : 'border-[#3e3e3e] focus-within:border-[#3ea6ff]'}`}
                        >
                            <label
                                className={`block text-[11px] font-medium mb-1 transition-colors
                  ${errors.name ? 'text-red-500' : 'text-[#aaaaaa] group-focus-within:text-[#3ea6ff]'}`}
                            >
                                Title (required)
                            </label>
                            <input
                                {...register('name')}
                                placeholder="Masukkan nama materi Anda"
                                autoFocus
                                autoComplete="off"
                                className="w-full bg-transparent text-[#f1f1f1] text-[15px] font-normal outline-none placeholder-[#717171]"
                            />
                        </div>
                        <div className="flex justify-between items-start pt-1 min-h-5">
                            <div className="flex-1">
                                {errors.name && (
                                    <p className="text-[#ff4e4e] text-xs font-medium italic">
                                        {errors.name.message}
                                    </p>
                                )}
                            </div>
                            <div className="text-[12px] text-[#aaaaaa] tabular-nums font-medium">
                                {nameValue.length}/100
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-10">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2 rounded-full text-[#aaaaaa] font-bold text-sm hover:text-white hover:bg-white/5 transition-all"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isPending || !nameValue.trim()}
                            className={`px-6 py-2 rounded-full font-bold text-sm transition-all
                ${
                    isPending || !nameValue.trim()
                        ? 'bg-[#333333] text-[#717171] cursor-not-allowed'
                        : 'bg-white text-[#0f0f0f] hover:bg-zinc-200 active:scale-95 shadow-lg shadow-white/5'
                }`}
                        >
                            {isPending ? (
                                <div className="flex items-center gap-2">
                                    <Icon
                                        icon={'mingcute:loading-2-line'}
                                        width={23}
                                        className="animate-spin"
                                    />
                                    <p>Loading...</p>
                                </div>
                            ) : (
                                'Selanjutnya'
                            )}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}

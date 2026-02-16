'use client';

import { Icon } from '@iconify/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';

interface LogoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isLoading: boolean;
}

export function LogoutModal({
    isLoading,
    isOpen,
    onClose,
    onConfirm,
}: LogoutModalProps) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={!isLoading ? onClose : undefined}
                        className="absolute inset-0 bg-black/20 backdrop-blur-xs dark:bg-black/60"
                    />

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{
                            type: 'spring',
                            damping: 30,
                            stiffness: 500,
                        }}
                        className="relative w-full max-w-70 overflow-hidden rounded-[20px] bg-white/85 text-center shadow-2xl backdrop-blur-xl dark:bg-zinc-900/85 pb-2"
                    >
                        <div className="flex flex-col items-center p-6 pb-5">
                            <h3 className="text-[17px] font-semibold text-zinc-900 dark:text-white">
                                Keluar Akun?
                            </h3>
                            <p className="mt-1 text-[13px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                                Kamu perlu masuk kembali untuk mengakses akun
                                ini nanti.
                            </p>
                        </div>

                        <div className="flex w-full p-2 gap-2">
                            <button
                                onClick={onClose}
                                disabled={isLoading}
                                className="cursor-pointer hover:scale-105 flex-1 rounded-full dark:border-zinc-800 py-3.5 bg-white dark:bg-zinc-800 text-[15px] font-medium hover:bg-zinc-100 active:bg-zinc-200 disabled:opacity-50  dark:hover:bg-zinc-800"
                            >
                                Batal
                            </button>
                            <button
                                onClick={onConfirm}
                                disabled={isLoading}
                                className="cursor-pointer hover:scale-105 flex-1 rounded-full dark:border-zinc-800 bg-red-100 dark:bg-red-900/20 py-3.5 text-[15px] font-bold text-red-600 hover:bg-red-50 active:bg-red-100 disabled:opacity-50 dark:text-red-500 dark:hover:bg-red-900/20"
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <Icon
                                            icon="mingcute:loading-2-line"
                                            width={23}
                                            className="animate-spin"
                                        />
                                        <span>Sebentar...</span>
                                    </div>
                                ) : (
                                    'Keluar'
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

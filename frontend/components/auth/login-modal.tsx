'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, Transition } from 'framer-motion';
import Link from 'next/link';
import { Icon } from '@iconify/react';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const springCustom: Transition<unknown> | undefined = {
    type: 'spring',
    damping: 25,
    stiffness: 350,
    mass: 0.8,
};

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
    const [isRegister, setIsRegister] = useState(false);
    useEffect(() => {
        if (!isOpen) setTimeout(() => setIsRegister(false), 200);
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [isOpen]);
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-100 bg-black/30 backdrop-blur-md"
                    />

                    <div className="fixed inset-0 z-101 flex items-center justify-center pointer-events-none p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 10 }}
                            transition={springCustom}
                            className="w-full max-w-100 bg-white dark:bg-zinc-900 rounded-4xl shadow-2xl overflow-hidden pointer-events-auto "
                        >
                            <div className="relative px-8 pt-8 pb-4 text-center">
                                <button
                                    onClick={onClose}
                                    className="absolute right-6 top-6 p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full hover:bg-zinc-700 transition-colors"
                                >
                                    <Icon icon={'proicons:cancel'} width={20} />
                                </button>

                                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
                                    {!isRegister ? ' Welcome Back' : 'Register'}
                                </h2>
                            </div>

                            <div className="px-8 pb-8 space-y-4">
                                <div className="space-y-1">
                                    {isRegister && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{
                                                opacity: 1,
                                                height: 'auto',
                                            }}
                                            exit={{ opacity: 0, height: 0 }}
                                        >
                                            <label className="text-xs font-semibold text-zinc-500 ml-3">
                                                Nama Lengkap
                                            </label>
                                            <div className="relative">
                                                <Icon
                                                    icon="tabler:user"
                                                    className="absolute left-4 top-4 h-5 w-5 text-zinc-400"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="John Doe"
                                                    className="w-full pl-12 pr-4 py-3.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-full border-none outline-none focus:ring-2 focus:ring-slate-500/50 transition-all font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                                                />
                                            </div>
                                        </motion.div>
                                    )}
                                    <label className="text-xs font-semibold text-zinc-500 ml-3">
                                        Email
                                    </label>
                                    <div className="relative">
                                        <Icon
                                            icon="tabler:mail"
                                            className="absolute left-4 top-4 h-5 w-5 text-zinc-400"
                                        />
                                        <input
                                            type="email"
                                            placeholder="nama@email.com"
                                            className="w-full pl-12 pr-4 py-3.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-full border-none outline-none focus:ring-2 focus:ring-slate-500/50 transition-all font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                                        />
                                    </div>
                                </div>

                                {/* Input Password */}
                                <div className="space-y-1">
                                    <div className="flex justify-between items-center ml-3 mr-1">
                                        <label className="text-xs font-semibold text-zinc-500">
                                            Password
                                        </label>
                                        {!isRegister ? (
                                            <Link
                                                href="#"
                                                className="text-xs font-medium text-biru"
                                            >
                                                Lupa?
                                            </Link>
                                        ) : (
                                            ''
                                        )}
                                    </div>
                                    <div className="relative">
                                        <Icon
                                            icon="tabler:lock"
                                            className="absolute left-4 top-3.5 h-5 w-5 text-zinc-400"
                                        />
                                        <input
                                            type="password"
                                            placeholder="••••••••"
                                            className="w-full pl-12 pr-4 py-3.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-full border-none outline-none focus:ring-2 focus:ring-slate-500/50 transition-all font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                                        />
                                    </div>
                                    {isRegister && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{
                                                opacity: 1,
                                                height: 'auto',
                                            }}
                                            exit={{ opacity: 0, height: 0 }}
                                        >
                                            <label className="text-xs font-semibold text-zinc-500 ml-3">
                                                Konfirmasi Password
                                            </label>
                                            <div className="relative">
                                                <Icon
                                                    icon="tabler:lock"
                                                    className="absolute left-4 top-4 h-5 w-5 text-zinc-400"
                                                />
                                                <input
                                                    type="password"
                                                    placeholder="••••••••"
                                                    className="w-full pl-12 pr-4 py-3.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-full border-none outline-none focus:ring-2 focus:ring-slate-500/50 transition-all font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                                                />
                                            </div>
                                        </motion.div>
                                    )}
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="w-full py-4 bg-black text-white font-bold rounded-full dark:bg-zinc-50 dark:text-black"
                                >
                                    {isRegister
                                        ? 'Daftar Sekarang'
                                        : 'Masuk Sekarang'}
                                </motion.button>

                                <div className="relative py-2">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t border-zinc-200 dark:border-zinc-800"></span>
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-white dark:bg-zinc-900 px-2 text-zinc-400 font-medium">
                                            Atau
                                        </span>
                                    </div>
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full py-3.5 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-full font-semibold text-zinc-700 dark:text-zinc-200 flex items-center justify-center gap-2"
                                >
                                    <Icon
                                        icon={'material-icon-theme:google'}
                                        width={20}
                                    />
                                    {isRegister
                                        ? 'Daftar dengan Google'
                                        : 'Lanjut dengan Google'}
                                </motion.button>
                            </div>

                            <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 text-center">
                                <div className="text-sm text-zinc-500 gap-1.5 flex justify-center">
                                    {!isRegister
                                        ? ' Belum punya akun?'
                                        : 'Sudah punya akun?'}
                                    <button
                                        onClick={() =>
                                            setIsRegister(!isRegister)
                                        }
                                        className="text-biru font-bold hover:underline"
                                    >
                                        {isRegister ? 'Masuk' : 'Daftar dulu'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}

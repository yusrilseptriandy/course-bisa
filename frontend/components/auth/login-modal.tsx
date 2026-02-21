'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, Transition } from 'framer-motion';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { useForm } from 'react-hook-form';
import { email, z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { authClient } from '@/app/libs/auth-client';
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

const loginSchema = z.object({
    email: email('Format email tidak valid'),
    password: z.string().min(1, 'Password wajib diisi'),
});

const registerSchema = loginSchema
    .extend({
        name: z.string().min(3, 'Nama lengkap minimal 3 karakter'),
        email: email('Email tidak valid'),
        password: z.string().min(8, 'Password minimal 8 karakter'),
        confirmPassword: z.string().min(1, 'Konfirmasi password wajib diisi'),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Password tidak cocok',
        path: ['confirmPassword'],
    });

// type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
    const [isRegister, setIsRegister] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [globalError, setGlobalError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<RegisterFormValues>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(isRegister ? registerSchema : loginSchema) as any,
        defaultValues: {
            name: '',
            email: '',
            password: '',
            confirmPassword: '',
        },
    });

    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                setIsRegister(false);
                reset();
                setGlobalError(null);
            }, 200);
        } else {
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, reset]);

    const onSubmit = async (data: RegisterFormValues) => {
        setIsLoading(true);
        setGlobalError(null);

        try {
            if (isRegister) {
                await authClient.signUp.email(
                    {
                        email: data.email,
                        password: data.password,
                        name: data.name,
                        callbackURL: '/',
                    },
                    {
                        onRequest: () => setIsLoading(true),
                        onSuccess: () => {
                            setIsLoading(false);
                            onClose();
                            // TODO: tambah toast
                        },
                        onError: (ctx) => {
                            setIsLoading(false);
                            setGlobalError(ctx.error.message);
                        },
                    },
                );
            } else {
                await authClient.signIn.email(
                    {
                        email: data.email,
                        password: data.password,
                        callbackURL: '/',
                    },
                    {
                        onRequest: () => setIsLoading(true),
                        onSuccess: () => {
                            setIsLoading(false);
                            onClose();
                        },
                        onError: (ctx) => {
                            setIsLoading(false);
                            setGlobalError(
                                ctx.error.message ||
                                    'Gagal masuk, periksa email/password',
                            );
                        },
                    },
                );
            }
        } catch {
            setIsLoading(false);
            setGlobalError('Terjadi kesalahan sistem');
        } finally {
            setIsLoading(false);
        }
    };

    // const handleGoogleLogin = async () => {
    //     await authClient.signIn.social({
    //         provider: 'google',
    //         callbackURL: '/',
    //     });
    // };
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
                                    className="absolute right-6 top-6 p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                                >
                                    <Icon icon={'proicons:cancel'} width={20} />
                                </button>

                                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
                                    {!isRegister ? ' Welcome Back' : 'Register'}
                                </h2>
                            </div>

                            <form
                                onSubmit={handleSubmit(onSubmit)}
                                className="px-8 pb-8 space-y-4"
                            >
                                {globalError && (
                                    <div className="p-3 text-red-600 dark:text-red-400 text-sm font-medium text-center flex items-center justify-center gap-1">
                                        <Icon icon={"ic:round-error"} width={18}/>
                                        {globalError}
                                    </div>
                                )}
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
                                                    {...register('name')}
                                                    type="text"
                                                    placeholder="Yusril Septriandy. N. Y"
                                                    className={`w-full pl-12 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-full border-none outline-none focus:ring-2 focus:ring-slate-500/50 transition-all font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 ${errors.name ? 'border-red-500' : 'border-transparent'}`}
                                                />
                                            </div>
                                            {errors.name && (
                                                <p className="text-red-500 text-xs mt-1 ml-3">
                                                    {errors.name.message}
                                                </p>
                                            )}
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
                                            {...register('email')}
                                            type="email"
                                            placeholder="nama@email.com"
                                            className={`w-full pl-12 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-full border-none outline-none focus:ring-2 focus:ring-slate-500/50 transition-all font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 ${errors.email ? 'border-red-500' : 'border-transparent'}`}
                                        />
                                    </div>
                                    {errors.email && (
                                        <p className="text-red-500 text-xs mt-1 ml-3">
                                            {errors.email.message}
                                        </p>
                                    )}
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
                                            {...register('password')}
                                            type="password"
                                            placeholder="••••••••"
                                            className={`w-full pl-12 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-full border-none outline-none focus:ring-2 focus:ring-slate-500/50 transition-all font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 ${errors.password ? 'border-red-500' : 'border-transparent'}`}
                                        />
                                    </div>
                                    {errors.password && (
                                        <p className="text-red-500 text-xs mt-1 ml-3">
                                            {errors.password.message}
                                        </p>
                                    )}
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
                                                    {...register(
                                                        'confirmPassword',
                                                    )}
                                                    type="password"
                                                    placeholder="••••••••"
                                                    className={`w-full pl-12 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-full border-none outline-none focus:ring-2 focus:ring-slate-500/50 transition-all font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 ${errors.confirmPassword ? 'border-red-500' : 'border-transparent'}`}
                                                />
                                            </div>
                                            {errors.confirmPassword && (
                                                <p className="text-red-500 text-xs mt-1 ml-3">
                                                    {
                                                        errors.confirmPassword
                                                            .message
                                                    }
                                                </p>
                                            )}
                                        </motion.div>
                                    )}
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.95 }}
                                    disabled={isLoading}
                                    className={`
                                        w-full h-12 rounded-full font-semibold 
                                        flex items-center justify-center
                                        transition-all duration-300 text-sm
                                        ${
                                            isLoading
                                                ? 'bg-black/60 dark:bg-zinc-50/60 cursor-not-allowed opacity-70'
                                                : 'bg-black dark:bg-zinc-50 hover:opacity-90'
                                        }
                                        text-white dark:text-black
                                    `}
                                >
                                    {isLoading ? (
                                        <Icon
                                            icon={'mingcute:loading-2-line'}
                                            width={23}
                                            className="animate-spin"
                                        />
                                    ) : isRegister ? (
                                        'Daftar'
                                    ) : (
                                        'Masuk'
                                    )}
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
                                    className="w-full py-3 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-full font-semibold text-zinc-700 dark:text-zinc-200 flex items-center justify-center gap-2"
                                >
                                    <Icon
                                        icon={'material-icon-theme:google'}
                                        width={20}
                                    />
                                    {isRegister
                                        ? 'Daftar dengan Google'
                                        : 'Lanjut dengan Google'}
                                </motion.button>
                            </form>

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

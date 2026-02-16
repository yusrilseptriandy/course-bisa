'use client';

import { Icon } from '@iconify/react';
import { useState, useRef, useEffect } from 'react';
import {
    motion,
    AnimatePresence,
    Transition,
    ValueAnimationTransition,
} from 'framer-motion';
import { ModeToggle } from './mode-toggle';
import { LoginModal } from '../auth/login-modal';
import { authClient } from '@/app/libs/auth-client';
import Link from 'next/link';
import { Manrope } from 'next/font/google';
import { LogoutModal } from './logout-modal';
import { useRouter } from 'next/navigation';

const iosSpring: Transition<ValueAnimationTransition> | undefined = {
    type: 'spring',
    stiffness: 500,
    damping: 30,
};

const MENU_ITEMS = [
    {
        label: 'Dashboard',
        icon: 'tabler:layout-dashboard',
        href: '/teacher/dashboard/course',
    },
    { label: 'Profile Saya', icon: 'tabler:user-circle', href: '/profile' },
    { label: 'Kelas Saya', icon: 'tabler:book-2', href: '/kelas' },
    { label: 'Sertifikat', icon: 'tabler:certificate', href: '/sertifikat' },
    { label: 'Favorit', icon: 'tabler:heart', href: '/favorit' },
];

const SG = Manrope();

export default function Navbar() {
    const router = useRouter();
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isDesktopMenuOpen, setIsDesktopMenuOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const desktopMenuRef = useRef<HTMLDivElement>(null);
    const { data: session, isPending } = authClient.useSession();

    const filteredMenuItems = MENU_ITEMS.filter((item) => {
        if (item.label === 'Dashboard') {
            return session?.user.role === 'teacher';
        }
        return true;
    });

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                desktopMenuRef.current &&
                !desktopMenuRef.current.contains(event.target as Node)
            ) {
                setIsDesktopMenuOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);
    //     try {
    //         setIsLoading(true);
    //         setTimeout(async () => {
    //             await authClient.signOut();
    //             setIsMobileMenuOpen(false);
    //             setIsDesktopMenuOpen(false);
    //         }, 500);
    //     } finally {
    //         setIsLoading(false);
    //     }
    // };

    const openLogoutModal = () => {
        setIsMobileMenuOpen(false);
        setIsDesktopMenuOpen(false);
        setShowLogoutModal(true);
    };
    const handleConfirmLogout = async () => {
        try {
            setIsLoading(true);
            await authClient.signOut();
            setShowLogoutModal(false);

            setTimeout(() => {
                router.push('/');
            }, 100);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <>
            <LoginModal
                isOpen={showLoginModal}
                onClose={() => setShowLoginModal(false)}
            />

            <LogoutModal
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                onConfirm={handleConfirmLogout}
                isLoading={isLoading}
            />

            <nav className="sticky top-0 z-50 w-full border-b border-zinc-100 bg-white/70 backdrop-blur-md dark:bg-black/80 dark:border-zinc-800">
                <div className="flex h-16 items-center justify-between px-4 md:px-6 gap-4">
                    <div className="flex items-center shrink-0">
                        <Icon
                            icon={'material-symbols:owl-rounded'}
                            width={34}
                            className="text-black dark:text-white"
                        />
                    </div>

                    <motion.div
                        className="flex-1 flex justify-center md:justify-start origin-left"
                        initial={false}
                        animate={{
                            width: isMobileMenuOpen ? 0 : 'auto',
                            opacity: isMobileMenuOpen ? 0 : 1,
                        }}
                        transition={iosSpring}
                    >
                        <div className="relative w-full max-w-md md:w-full! md:opacity-100! md:block!">
                            <Icon
                                icon="mingcute:search-2-line"
                                className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400"
                            />
                            <input
                                className="py-2 w-full rounded-full bg-zinc-100 pl-10 pr-4 text-sm font-medium outline-none transition-all focus:ring-2 focus:ring-zinc-500/20 dark:bg-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400"
                                placeholder="Cari pembelajaran..."
                            />
                        </div>
                    </motion.div>

                    <div className="flex items-center gap-2 shrink-0 justify-end">
                        <AnimatePresence>
                            {isMobileMenuOpen && !session && (
                                <motion.div
                                    initial={{ x: 20, opacity: 0, width: 0 }}
                                    animate={{
                                        x: 0,
                                        opacity: 1,
                                        width: 'auto',
                                    }}
                                    exit={{ x: 20, opacity: 0, width: 0 }}
                                    transition={iosSpring}
                                    className="flex items-center gap-2 md:hidden overflow-hidden whitespace-nowrap"
                                >
                                    <button
                                        onClick={() => setShowLoginModal(true)}
                                        className="h-9 px-4 rounded-full bg-zinc-900 text-sm font-medium text-white dark:bg-zinc-50 dark:text-black"
                                    >
                                        Masuk
                                    </button>
                                    <ModeToggle />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* DESKTOP SECTION */}
                        <div
                            className="hidden md:flex items-center gap-2 relative"
                            ref={desktopMenuRef}
                        >
                            {!session ? (
                                <button
                                    onClick={() => setShowLoginModal(true)}
                                    className="h-9 px-5 rounded-full bg-zinc-900 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
                                >
                                    Masuk
                                </button>
                            ) : (
                                <>
                                    {/* TRIGGER BUTTON DESKTOP */}
                                    <button
                                        onClick={() =>
                                            setIsDesktopMenuOpen(
                                                !isDesktopMenuOpen,
                                            )
                                        }
                                        className="w-min p-1 pr-3 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center gap-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all cursor-pointer"
                                    >
                                        <div className="bg-white dark:bg-zinc-600 rounded-full p-1 shadow-sm">
                                            <Icon
                                                icon="tabler:user"
                                                width={18}
                                                className="text-zinc-700 dark:text-zinc-200"
                                            />
                                        </div>
                                        <p className="text-nowrap font-semibold text-sm text-zinc-700 dark:text-zinc-200 max-25 truncate">
                                            {session.user.name}
                                        </p>
                                        <Icon
                                            icon="tabler:chevron-down"
                                            width={16}
                                            className={`text-zinc-400 transition-transform duration-200 ${isDesktopMenuOpen ? 'rotate-180' : ''}`}
                                        />
                                    </button>

                                    {/* DROPDOWN MENU DESKTOP */}
                                    <AnimatePresence>
                                        {isDesktopMenuOpen && (
                                            <motion.div
                                                initial={{
                                                    opacity: 0,
                                                    y: 10,
                                                    scale: 0.95,
                                                }}
                                                animate={{
                                                    opacity: 1,
                                                    y: 0,
                                                    scale: 1,
                                                }}
                                                exit={{
                                                    opacity: 0,
                                                    y: 10,
                                                    scale: 0.95,
                                                }}
                                                transition={{
                                                    duration: 0.15,
                                                    ease: 'easeOut',
                                                }}
                                                className={`absolute top-12 right-0 w-64 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-100 dark:border-zinc-800 p-2 overflow-hidden z-100 ${SG.className}`}
                                            >
                                                {/* Header Dropdown */}
                                                <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 mb-1">
                                                    <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 flex items-center">
                                                        Masuk sebagai{' '}
                                                        {session && (
                                                            <p className="w-max rounded-full text-green-500 ml-1">
                                                                {
                                                                    session.user
                                                                        .role
                                                                }
                                                            </p>
                                                        )}
                                                    </div>
                                                    <p className="font-bold text-zinc-900 dark:text-white truncate">
                                                        {session.user.name}
                                                    </p>
                                                    <p className="text-xs text-zinc-500 truncate">
                                                        {session.user.email}
                                                    </p>
                                                </div>

                                                {/* Menu List Desktop */}
                                                <div className="flex flex-col gap-1 py-1">
                                                    {filteredMenuItems.map(
                                                        (item, index) => (
                                                            <Link
                                                                key={index}
                                                                href={item.href}
                                                                onClick={() =>
                                                                    setIsDesktopMenuOpen(
                                                                        false,
                                                                    )
                                                                }
                                                                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm font-medium text-zinc-700 dark:text-zinc-200 transition-colors"
                                                            >
                                                                <Icon
                                                                    icon={
                                                                        item.icon
                                                                    }
                                                                    width={18}
                                                                    className="text-zinc-500 dark:text-zinc-400"
                                                                />
                                                                {item.label}
                                                            </Link>
                                                        ),
                                                    )}
                                                </div>

                                                <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1" />

                                                <button
                                                    onClick={openLogoutModal}
                                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 text-sm font-medium text-red-600 dark:text-red-400 transition-colors"
                                                >
                                                  
                                                        <Icon
                                                            icon="mingcute:align-arrow-right-line"
                                                            width={18}
                                                        />
                                                    
                                                    Keluar
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </>
                            )}
                            <ModeToggle />
                        </div>

                        {/* Hamburger Button Mobile */}
                        <button
                            onClick={() =>
                                setIsMobileMenuOpen(!isMobileMenuOpen)
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-900 bg-zinc-100 dark:text-zinc-100 dark:bg-zinc-800 md:hidden z-50 relative"
                        >
                            <Icon
                                icon={
                                    isMobileMenuOpen
                                        ? 'mingcute:close-line'
                                        : 'ci:menu-duo-md'
                                }
                                width={24}
                                className={`transition-transform duration-300 ${isMobileMenuOpen ? 'rotate-90' : 'rotate-0'}`}
                            />
                        </button>
                    </div>
                </div>
            </nav>

            {/* --- BOTTOM SHEET AREA (MOBILE ONLY) --- */}
            <AnimatePresence>
                {isMobileMenuOpen && session && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="fixed inset-0 z-60 bg-black/40 backdrop-blur-[2px] md:hidden"
                        />

                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{
                                type: 'spring',
                                damping: 25,
                                stiffness: 300,
                                mass: 0.8,
                            }}
                            drag="y"
                            dragConstraints={{ top: 0 }}
                            dragElastic={0.05}
                            onDragEnd={(_, info) => {
                                if (
                                    info.offset.y > 100 ||
                                    info.velocity.y > 500
                                )
                                    setIsMobileMenuOpen(false);
                            }}
                            className={`fixed bottom-0 left-0 right-0 z-70 flex flex-col rounded-t-4xl bg-white p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] dark:bg-zinc-900 md:hidden max-h-[85vh] overflow-y-auto ${SG.className}`}
                        >
                            <div className="absolute left-1/2 top-4 h-1.5 w-12 -translate-x-1/2 rounded-full bg-zinc-300 dark:bg-zinc-700" />

                            <div className="mt-6 flex flex-col gap-6">
                                <div className="flex items-center gap-4 justify-between">
                                    <div className="flex gap-4 items-center">
                                        <div className="h-12 w-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                                            <Icon
                                                icon="tabler:user"
                                                width={24}
                                                className="text-zinc-500"
                                            />
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="flex text-xs items-center">
                                                <span className=" font-medium text-zinc-500 dark:text-zinc-400">
                                                    Halo,
                                                </span>
                                                {session && (
                                                    <p className="w-max rounded-full text-green-500 ml-1">
                                                        {session.user.role}
                                                    </p>
                                                )}
                                            </div>
                                            <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1">
                                                {session.user.name}
                                            </p>
                                        </div>
                                    </div>
                                    <ModeToggle />
                                </div>

                                <div className="h-px w-full bg-zinc-100 dark:bg-zinc-800" />

                                <div className="flex flex-col gap-2">
                                    {filteredMenuItems.map((item, index) => (
                                        <Link
                                            key={index}
                                            href={item.href}
                                            onClick={() =>
                                                setIsMobileMenuOpen(false)
                                            }
                                            className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Icon
                                                    icon={item.icon}
                                                    width={22}
                                                    className="text-zinc-600 dark:text-zinc-400"
                                                />
                                                <span className="font-medium text-zinc-700 dark:text-zinc-200">
                                                    {item.label}
                                                </span>
                                            </div>
                                            <Icon
                                                icon="tabler:chevron-right"
                                                width={18}
                                                className="text-zinc-400"
                                            />
                                        </Link>
                                    ))}
                                </div>

                                <div className="h-px w-full bg-zinc-100 dark:bg-zinc-800" />

                                {!isPending && (
                                    <button
                                        onClick={openLogoutModal}
                                        className="group flex w-full items-center justify-between rounded-2xl bg-red-50 p-5 active:scale-[0.98] transition-all dark:bg-red-500/10"
                                    >
                                        <span className="font-semibold text-red-600 dark:text-red-400">
                                            Keluar Akun
                                        </span>
                                        {isLoading ? (
                                            <Icon
                                                icon="mingcute:loading-2-line"
                                                width={22}
                                                className="animate-spin text-red-600 dark:text-red-400"
                                            />
                                        ) : (
                                            <Icon
                                                icon="mingcute:align-arrow-right-line"
                                                width={22}
                                                className="text-red-600 dark:text-red-400 transition-transform group-active:translate-x-1"
                                            />
                                        )}
                                    </button>
                                )}
                            </div>
                            <div className="h-6 w-full shrink-0" />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
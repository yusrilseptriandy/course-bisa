'use client';

import { Icon } from '@iconify/react';
import { useState } from 'react';
import {
    motion,
    AnimatePresence,
    Transition,
    ValueAnimationTransition,
} from 'framer-motion';
import { ModeToggle } from './mode-toggle';
import { LoginModal } from '../auth/login-modal';

const iosSpring: Transition<ValueAnimationTransition> | undefined = {
    type: 'spring',
    stiffness: 500,
    damping: 30,
};

export default function Navbar() {
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <>
            <LoginModal
                isOpen={showLoginModal}
                onClose={() => setShowLoginModal(false)}
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
                        className="flex-1 flex justify-center md:justify-start  origin-left"
                        initial={false}
                        animate={{
                            width: isMobileMenuOpen ? 0 : 'auto',
                        }}
                        transition={iosSpring}
                        style={{ display: 'flex' }}
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
                        <AnimatePresence mode="popLayout">
                            {isMobileMenuOpen && (
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

                        <div className="hidden md:flex items-center gap-2">
                            <button
                                onClick={() => setShowLoginModal(true)}
                                className="h-9 px-5 rounded-full bg-zinc-900 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
                            >
                                Masuk
                            </button>
                            <ModeToggle />
                        </div>

                        <button
                            onClick={() =>
                                setIsMobileMenuOpen(!isMobileMenuOpen)
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-900 bg-zinc-100 dark:text-zinc-100 dark:bg-zinc-800 md:hidden"
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
        </>
    );
}

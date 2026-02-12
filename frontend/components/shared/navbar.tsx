'use client';
import { Icon } from '@iconify/react';
import { useState } from 'react';
import { ModeToggle } from './mode-toggle';
import { LoginModal } from '../auth/login-modal';

export default function Navbar() {
    const [showLoginModal, setShowLoginModal] = useState(false);
    return (
        <>
            <LoginModal
                isOpen={showLoginModal}
                onClose={() => setShowLoginModal(false)}
            />
            <div
                className="text-black h-16 border-b 
                        border-zinc-100 flex
                        justify-between items-center
                        px-2 dark:border-zinc-800
                        dark:text-white
                        "
            >
                <Icon icon={'mingcute:cursor-3-fill'} width={34} />
                <div
                    className="flex items-center 
                        justify-between 
                        h-full gap-2
          "
                >
                    <div className="flex items-center justify-between gap-2">
                        <button
                            onClick={() => setShowLoginModal(true)}
                            className="bg-[#171717] h-10 w-20
                                     text-white rounded-full
                                     font-medium dark:bg-zinc-50 dark:text-black
                                     "
                        >
                            Masuk
                        </button>
                        {/* <button
                        className="bg-zinc-100 h-10
                                    rounded-full font-medium
                                    px-3 dark:bg-[#171717]
                                     "
                    >
                        Register
                    </button> */}
                    </div>
                    <ModeToggle />
                </div>
            </div>
        </>
    );
}

'use client';

import { ModeToggle } from '@/components/shared/mode-toggle';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
    {
        label: 'Kelas',
        href: '/teacher/dashboard/course',
        icon: 'proicons:video',
    },
    {
        label: 'Siswa',
        href: '/teacher/dashboard/students',
        icon: 'solar:users-group-rounded-outline',
    },
    {
        label: 'Pengaturan',
        href: '/teacher/dashboard/settings',
        icon: 'solar:settings-outline',
    },
];

export function TeacherSidebar() {
    const pathname = usePathname();

    return (
        <>
            <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 md:flex md:flex-col">
                <div className="flex h-16 items-center border-b border-zinc-200 px-6 dark:border-zinc-800 w-full">
                    <div className="flex items-center justify-between w-full gap-2 font-bold text-xl tracking-tight text-zinc-900 dark:text-zinc-100">
                        <span className=" font-extrabold">CourseBisa</span>
                        <ModeToggle />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-3 py-6">
                    <nav className="flex flex-col gap-1">
                        {NAV_ITEMS.map((item) => {
                            const isActive = pathname.startsWith(item.href)

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`group flex items-center gap-3 rounded-full px-3 py-2.5 text-sm font-semibold transition-all duration-200 hover:bg-zinc-100 hover:dark:bg-white/20 hover:dark:text-white ${
                                        isActive &&
                                        'dark:bg-white/20 bg-zinc-100'
                                    }`}
                                >
                                    <Icon icon={item.icon} width={22} />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="border-t border-zinc-200 h-16 flex items-center px-8 dark:border-zinc-800">
                    <Link
                        href="/"
                        className="rounded-full flex hover:scale-105 "
                    >
                        <div className="flex items-center gap-3">
                            <Icon icon="mingcute:home-5-fill" />
                            <div className="flex flex-col overflow-hidden">
                                <span className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                    Beranda
                                </span>
                            </div>
                        </div>
                    </Link>
                </div>
            </aside>

            {/* MOBILE BOTTOM NAV  */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-zinc-200 bg-white/80 backdrop-blur-lg dark:border-zinc-800 dark:bg-zinc-950/80 md:hidden pb-safe">
                {NAV_ITEMS.map((item) => {
                     const isActive = pathname.startsWith(item.href)

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-1 flex-col items-center justify-center gap-1 h-full w-full ${
                                !isActive &&
                                'text-zinc-500 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-300'
                            }`}
                        >
                            <div
                                className={`relative p-1 rounded-full transition-all ${isActive && 'dark:bg-white/20 bg-zinc-200'}`}
                            >
                                <Icon
                                    icon={item.icon}
                                    width={24}
                                    className="transition-transform active:scale-95"
                                />
                            </div>
                            <span className="text-[10px] font-medium leading-none">
                                {item.label}
                            </span>
                        </Link>
                    );
                })}

                <Link
                    href="/"
                    className={`flex flex-1 flex-col items-center justify-center gap-1 h-full w-full ${
                        pathname === '/'
                            ? 'text-[#6b2275]'
                            : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-300'
                    }`}
                >
                    <div
                        className={`relative p-1 rounded-xl transition-all ${pathname === '/' ? 'bg-white dark:bg-blue-900/20' : ''}`}
                    >
                        <Icon
                            icon={
                                pathname === '/'
                                    ? 'mingcute:home-5-fill'
                                    : 'mingcute:home-5-line'
                            }
                            width={24}
                            className="transition-transform active:scale-95"
                        />
                    </div>
                    <span className="text-[10px] font-medium leading-none">
                        Beranda
                    </span>
                </Link>
            </nav>
        </>
    );
}

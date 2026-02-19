'use client';

import { Icon } from '@iconify/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const isUUID = (uuid: string) => {
    const regex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return regex.test(uuid);
};

export default function Header() {
    const pathname = usePathname();
    const pathSegments = pathname.split('/');
    const potentialId = pathSegments[4];

    const shoulShowButtonBack = potentialId && isUUID(potentialId);
    return (
        <div className="w-full h-16 border-b px-3 md:pl-8 flex items-center border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 sticky top-0 z-50">
            {shoulShowButtonBack && (
                <div className='flex justify-between w-full'>
                    <button className="flex items-center justify-center gap-2">
                        <Icon icon={'proicons:arrow-left'} />
                        <Link
                            href={
                                'http://localhost:3000/teacher/dashboard/course'
                            }
                            className="text-sm"
                        >
                            Kembali
                        </Link>
                    </button>
                    <div className="flex items-center gap-4 mr-8">
                        <button className="flex items-center hover:scale-95 cursor-pointer text-red-600 text-xs gap-1">
                            <Icon icon={'proicons:delete'} width={20} />
                            Hapus
                        </button>
                        <button className="py-2 px-4 cursor-pointer hover:scale-95 dark:bg-white rounded-full bg-zinc-200 text-slate-850 dark:text-black font-semibold hover:dark:bg-slate-200 flex items-center gap-2 text-xs">
                            <Icon icon={"bx:world"} width={18}/>
                            Publish
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

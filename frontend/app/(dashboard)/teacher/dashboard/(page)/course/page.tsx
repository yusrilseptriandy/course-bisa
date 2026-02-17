import { Icon } from '@iconify/react';

export default function page() {
    return (
        <div className="">
            <button className="bg-black text-white p-2 flex items-center justify-center gap-1 dark:bg-white dark:text-black rounded-full">
                <Icon icon={'lucide:plus'} width={20} />
                <p className="pr-1 text-sm font-semibold tracking-tight">
                    Kelas baru
                </p>
            </button>

            
        </div>
    );
}

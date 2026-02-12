'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Icon } from '@iconify/react';

export function ModeToggle() {
    const [mounted, setMounted] = useState(false);
    const { theme, setTheme } = useTheme();

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <Icon
                icon={'mingcute:loading-2-line'}
                width={23}
                className="animate-spin"
            />
        );
    }
    return (
        <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-gray-800"
        >
            {theme === 'dark' ? (
                <Icon icon="mingcute:moon-line" width={25} />
            ) : (
                <Icon icon="mingcute:sun-line" width={25} />
            )}
        </button>
    );
}

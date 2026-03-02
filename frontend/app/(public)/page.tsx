'use client';
import CardCourse from '@/components/shared/card-course';
import { useCourseData } from '../hooks/use-course-data';
import { useState } from 'react';

export default function Home() {
    const { categories } = useCourseData();
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const handleClickCategory = (id: string | null) => {
        setActiveCategory((prev) => (prev === id ? null : id));
    };
    return (
        <div className="flex flex-col min-h-screen w-full dark:bg-black bg-white">
            {categories && (
                <div className="px-5 md:px-20 mt-4">
                    <div
                        className="
                            grid grid-rows-1 grid-flow-col
                            gap-3
                            overflow-x-auto
                            no-scrollbar
                            md:flex md:flex-wrap
                            pb-2
                        "
                    >
                        <button
                            onClick={() => handleClickCategory(null)}
                            className={`
                                px-4 py-2
                                whitespace-nowrap
                                rounded-full
                                text-sm font-semibold
                                transition-all duration-200
                                ${
                                    activeCategory === null
                                        ? 'bg-orange-500 text-white'
                                        : 'bg-white border dark:border-0 border-zinc-200 text-zinc-700 hover:scale-95 dark:bg-zinc-900 dark:text-zinc-200'
                                }
                            `}
                        >
                            Semua
                        </button>
                        {categories.map((category) => {
                            const isActive = activeCategory === category.id;

                            return (
                                <button
                                    key={category.id}
                                    onClick={() =>
                                        handleClickCategory(category.id)
                                    }
                                    className={`
                                        px-4 py-2
                                        whitespace-nowrap
                                        rounded-full
                                        text-sm font-semibold
                                        transition-all duration-200
                                        border
                                        ${
                                            isActive
                                                ? 'bg-orange-500 text-white border-0'
                                                : 'bg-white dark:border-0 border-zinc-200 text-zinc-700   hover:scale-95 dark:bg-zinc-900 dark:text-zinc-200 dark:border-zinc-800'
                                        }
                                    `}
                                >
                                    {category.name}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
            {/* Card course */}
            <CardCourse />
        </div>
    );
}

// components/ImageWithSkeleton.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { ComponentProps } from 'react';

type ImageWithSkeletonProps = ComponentProps<typeof Image> & {
    wrapperClassName?: string;
    skeletonClassName?: string;
};

export default function ImageWithSkeleton({
    wrapperClassName,
    skeletonClassName,
    className,
    alt,
    ...props
}: ImageWithSkeletonProps) {
    const [isLoading, setIsLoading] = useState(true);

    return (
        <div className={`relative overflow-hidden ${wrapperClassName}`}>
            {isLoading && (
                <div
                    className={`absolute inset-0 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse ${skeletonClassName}`}
                />
            )}

            <Image
                {...props}
                alt={alt}
                sizes="(max-width: 768px) 100vw, 388px"
                priority
                fetchPriority="high"
                className={`${className ?? ''} ${
                    isLoading ? 'opacity-0' : 'opacity-100'
                } transition-opacity duration-300`}
                onLoadingComplete={() => setIsLoading(false)}
            />
        </div>
    );
}

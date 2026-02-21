import { Icon } from '@iconify/react';
import Image from 'next/image';

export default function CardCourse() {
    const courses = [1, 2, 3, 4, 5];

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full h-max py-10 px-5 md:px-20">
            {courses.map((item, index) => (
                <div
                    key={index}
                    className="dark:bg-[#171717] bg-white rounded-2xl overflow-hidden p-3 flex flex-col gap-3 "
                >
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden">
                        <Image
                            src="/c1.jpg"
                            alt="Course Thumbnail"
                            fill
                            className="object-cover"
                            priority
                        />
                    </div>

                    {/* CONTENT SECTION */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-1">
                            <Icon
                                icon={'lucide:play'}
                                className="text-xs"
                            />
                            <span className="text-[10px] font-bold ">100k</span>
                            <Icon
                                icon={'proicons:thumbs-up'}
                                className="text-xs ml-1"
                            />
                            <span className="text-[10px] font-bold ">12k</span>

                            {/* COMMENTS */}
                            <Icon
                                icon={'proicons:comment'}
                                className="text-xs ml-1"
                            />
                            <span className="text-[10px] font-bold ">1200</span>
                        </div>

                        <h3 className="text-sm font-semibold dark:text-white leading-tight line-clamp-2">
                            Creative practices: from idea to final layout using
                            Figma
                        </h3>

                        <div className="flex items-center justify-between text-[10px] ">
                            <div className="flex items-center gap-1">
                                <Icon icon={'proicons:video'} width={15} />
                                <span>04 hr 40 mins</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Icon icon={'proicons:calendar'} width={15} />
                                <span>14-04-2025</span>
                            </div>
                        </div>
                    </div>

                    <hr className="dark:border-zinc-800 border-zinc-200" />

                    {/* FOOTER */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gray-600"></div>
                            <span className="text-[10px] font-bold dark:text-gray-300">
                                Jordan Clark
                            </span>
                        </div>
                        <span className="text-sm font-bold">Rp240.000</span>
                    </div>
                </div>
            ))}
        </div>
    );
}

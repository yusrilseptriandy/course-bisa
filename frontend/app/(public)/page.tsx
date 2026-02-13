import { Icon } from '@iconify/react';
import { Inter } from 'next/font/google';
import Image from 'next/image';

const fonstCustome = Inter();

export default function Home() {
    return (
        <div className="flex min-h-screen w-full justify-center ">
            <div className="w-full h-min flex flex-col md:flex-row p-3">
                <section className="w-full lg:w-5/12 flex flex-col lg:pl-20">
                    <div className="w-max bg-zinc-100 dark:bg-slate-900  rounded-full pr-4  flex items-center ">
                        <Icon
                            icon={'bi:dot'}
                            className="text-sky-600 animate-pulse text-4xl "
                        />
                        <p
                            className={`text-zinc-800 text-sm font-bold dark:text-white ${fonstCustome.className} uppercase`}
                        >
                            platform belajar #1 di indonesia
                        </p>
                    </div>

                    <h1 className=" mt-6 text-5xl font-extrabold  text-zinc-900 dark:text-white text-nowrap">
                        Kuasai Ilmu <br />{' '}
                        <span className="text-sky-600">Tanpa Batas.</span>
                    </h1>
                    <p className="mt-4 font-semibold text-sm text-zinc-700 dark:text-zinc-300">
                        Tingkatkan karir Anda dengan ribuan kelas online
                        interaktif. Belajar coding, desain, marketing, dan
                        bisnis langsung dari praktisi industri terkemuka.
                    </p>
                </section>
                <section className="w-full lg:w-7/12 items-center justify-center flex">
                    <Image
                        src={'/hero.png'}
                        width={600}
                        height={25}
                        alt="ilustasi"
                    />
                </section>
            </div>
        </div>
    );
}

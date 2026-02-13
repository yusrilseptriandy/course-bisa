import { Icon } from '@iconify/react';
import { Inter } from 'next/font/google';

const fonstCustome = Inter();

export default function Home() {
    return (
        <div className="flex min-h-screen w-full justify-center ">
            <div className="w-full h-min flex">
                <section className="w-full lg:w-5/12 flex flex-col p-8 lg:pl-20">
                    <div className="w-max bg-zinc-100 dark:bg-slate-900  rounded-full pr-4 py-1 flex items-center ">
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

                    <div className="relative">
                        <Icon
                            icon="mingcute:search-2-line"
                            className="absolute left-4 top-11.5 h-5 w-5 text-zinc-400"
                        />
                        <div className="w-full mt-8 pl-12 pr-4 py-3 bg-zinc-100 dark:bg-zinc-800/50 rounded-full ">
                            <p className="font-medium text-zinc-400 dark:text-zinc-100">
                                Cari pembelajaran disini...
                            </p>
                        </div>
                    </div>
                </section>
                <section className="w-full lg:w-7/12 dark:bg-zinc-900 items-center justify-center hidden md:block">
                    <p>Area Kanan (Lebih Luas)</p>
                </section>
            </div>
        </div>
    );
}

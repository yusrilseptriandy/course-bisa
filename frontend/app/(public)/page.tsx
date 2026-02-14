import ImageWithSkeleton from '@/components/shared/image-with-skeleton';
import { Icon } from '@iconify/react';
import {Inter, Manrope } from 'next/font/google';

const fonstCustome = Inter();
const SG = Manrope()

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
                   <div className={`${SG.className} flex flex-col gap-1 p-3 items-start font-extrabold`}>
                    <div className='flex items-center gap-2'>
                        <div className=' bg-green-600 rounded-full'>
                        <Icon icon={"proicons:checkmark"} className='text-white'/>
                      </div>
                        <p className=' text-zinc-800 dark:text-white'>Sertifikat Resmi</p>
                    </div>

                   <div className='flex items-center gap-2'>
                      <div className=' bg-green-600 rounded-full'>
                        <Icon icon={"proicons:checkmark"} className='text-white'/>
                    </div>
                    <p className=' text-zinc-800 dark:text-white'>Akses Seumur Hidup</p>
                   </div>
                   </div>
                </section>
                <section className="w-full lg:w-7/12 items-center justify-center flex">
                    <ImageWithSkeleton
                        src="/hero.png"
                        width={600}
                        height={400}
                        alt="Ilustrasi halaman utama aplikasi"
                        wrapperClassName="rounded-xl"
                        className="rounded-xl shadow-lg"
                    />
                </section>
            </div>
        </div>
    );
}

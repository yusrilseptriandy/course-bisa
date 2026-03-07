'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCourseData } from '@/app/hooks/use-course-data';
import { useTransaction } from '@/app/hooks/use-transaction';
import Image from 'next/image';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { authClient } from '@/app/libs/auth-client';
import LessonList from '../lesson-list';
import QRISModal from '../../../../components/qris-modal';
import { LoginModal } from '@/components/auth/login-modal';

const PLAN_ORDER = ['DAILY', 'WEEKLY', 'MONTHLY', 'LIFETIME'];
const PLAN_META: Record<string, { label: string; suffix: string }> = {
    DAILY: { label: 'Harian', suffix: '/hari' },
    WEEKLY: { label: 'Mingguan', suffix: '/minggu' },
    MONTHLY: { label: 'Bulanan', suffix: '/bulan' },
    LIFETIME: { label: 'Selamanya', suffix: '' },
};
const formatIDR = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
const Skeleton = ({ className }: { className: string }) => (
    <div className={`animate-pulse bg-zinc-200 dark:bg-zinc-800 rounded ${className}`} />
);

export default function CourseDetailPage() {
    const [expandedDesc, setExpandedDesc] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<{ id: string; type: string; price: number; durationDays?: number | null } | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [loginModalOpen, setLoginModalOpen] = useState(false);

    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;

    const { data: session } = authClient.useSession();
    const user = session?.user;

    const { publicCourse, publicCourses, isPublicCourseLoading } = useCourseData(id, true);
    const { accessData, checkout, isCheckingOut, activePurchase, paymentStatus, resetPurchase } = useTransaction(id);

    const isOwner = !!user && user.id === publicCourse?.owner?.id;
    const hasAccess = isOwner || !!accessData?.hasAccess;

    const handleSelectPlan = (plan: typeof selectedPlan) => {
        if (!user){ 
            setLoginModalOpen(true) 
            return;
        }
        setSelectedPlan(plan);
        setModalOpen(true);
        resetPurchase();
    };

    const handleCheckout = () => {
        if (!selectedPlan) return;
        checkout.mutate({ planId: selectedPlan.id });
    };

    const handleCloseLoginModal = () => {
        setLoginModalOpen(false);
    };
    
    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedPlan(null);
        resetPurchase();
    };

    if (isPublicCourseLoading) {
        return (
            <div className="flex dark:bg-abu flex-col lg:flex-row gap-6 px-4 md:px-10 py-6 max-w-350 mx-auto">
                <div className="flex-1 space-y-4">
                    <Skeleton className="w-full aspect-video rounded-xl" />
                    <Skeleton className="h-7 w-2/3" />
                    <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-5">
                        <div className="flex items-center gap-3">
                            <Skeleton className="w-10 h-10 rounded-full" />
                            <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-16" /></div>
                        </div>
                    </div>
                    <Skeleton className="h-24 w-full rounded-xl" />
                </div>
                <div className="w-full lg:w-96 space-y-4">
                    <Skeleton className="h-72 w-full rounded-2xl" />
                </div>
            </div>
        );
    }

    if (!publicCourse) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 py-24 text-zinc-400">
                <Icon icon="solar:video-frame-cut-bold-duotone" width={40} />
                <p className="text-sm">Course tidak ditemukan</p>
                <button onClick={() => router.back()} className="text-xs font-semibold px-4 py-2 rounded-full border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                    Kembali
                </button>
            </div>
        );
    }

    const plans = [...(publicCourse.plans ?? [])].sort((a, b) => PLAN_ORDER.indexOf(a.type) - PLAN_ORDER.indexOf(b.type));
    const featuredPlan = plans.find((p) => p.type === 'MONTHLY') ?? plans[Math.floor(plans.length / 2)] ?? plans[0] ?? null;
    const otherCourses = (publicCourses ?? []).filter((c) => c.id !== publicCourse.id).slice(0, 5);

    return (
        <>
            <QRISModal
                isOpen={modalOpen}
                onClose={handleCloseModal}
                plan={selectedPlan}
                qrString={activePurchase?.qrString}
                expiresAt={activePurchase?.expiresAt}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                paymentStatus={(paymentStatus ?? activePurchase?.status) as any}
                isLoading={isCheckingOut}
                onCheckout={handleCheckout}
            />
              <LoginModal 
                isOpen={loginModalOpen} 
                onClose={handleCloseLoginModal} 
            />


            <div className="flex dark:bg-abu flex-col lg:flex-row gap-6 px-4 md:px-10 py-6 max-w-350 mx-auto">
                <div className="flex-1 min-w-0">
                    <LessonList courseId={id} lessons={publicCourse.lessons ?? []} hasAccess={hasAccess} />

                    <h1 className="text-2xl font-bold mt-6 tracking-tight">{publicCourse.name}</h1>

                    <div className="flex items-center justify-between mt-4 border-b border-gray-100 dark:border-zinc-800 pb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-zinc-200 dark:bg-zinc-800 rounded-full flex items-center justify-center">
                                <Icon icon="solar:user-bold" className="text-zinc-500" />
                            </div>
                            <div>
                                <div className="flex items-center gap-1">
                                    <p className="font-medium text-sm">{publicCourse.owner?.name}</p>
                                    <Icon icon="stash:badge-verified-solid" width={18} className="text-orange-500" />
                                </div>
                                <p className="text-xs text-zinc-500">Instructor</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-400 font-medium">
                            <div className="flex items-center gap-1.5 bg-orange-50 dark:bg-orange-950/50 rounded-full py-1.5 px-3 cursor-pointer hover:scale-95 transition-transform">
                                <Icon icon="heroicons-solid:thumb-up" width={16} className="text-orange-500" />
                                <p className="font-semibold text-orange-500">{publicCourse._count?.likes ?? 0}</p>
                            </div>
                            <div className="flex items-center gap-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full py-1.5 px-3 text-black dark:text-white text-nowrap">
                                <Icon icon="proicons:calendar" width={16} />
                                {publicCourse.createdAt ? new Date(publicCourse.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                            </div>
                        </div>
                    </div>

                    <div className="mt-6">
                        <h2 className="text-sm font-semibold text-zinc-400 mb-3">Deskripsi</h2>
                        <div className="bg-zinc-100 dark:bg-abu-second rounded-xl p-5 text-sm leading-relaxed">
                            <AnimatePresence initial={false}>
                                <motion.div key={expandedDesc ? 'exp' : 'col'} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                                    <p className={`whitespace-pre-line text-zinc-600 dark:text-zinc-400 ${expandedDesc ? '' : 'line-clamp-3'}`}>
                                        {publicCourse.desc || 'Tidak ada deskripsi untuk kursus ini.'}
                                    </p>
                                </motion.div>
                            </AnimatePresence>
                            {(publicCourse.desc?.length ?? 0) > 150 && (
                                <button onClick={() => setExpandedDesc((v) => !v)} className="mt-3 font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1 hover:underline text-sm">
                                    {expandedDesc ? 'Tampilkan sedikit' : 'Selengkapnya'}
                                    <Icon icon={expandedDesc ? 'solar:alt-arrow-up-linear' : 'solar:alt-arrow-down-linear'} />
                                </button>
                            )}
                        </div>

                        {(publicCourse.attachments?.length ?? 0) > 0 && (
                            <div className="mt-6">
                                <h2 className="text-sm font-semibold text-zinc-400 mb-3">Lampiran Materi</h2>
                                <div className="space-y-2">
                                    {publicCourse.attachments.map((file) => (
                                        <a key={file.id ?? file.url} href={file.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all group">
                                            <div className="flex items-center gap-3">
                                                <Icon icon="solar:document-text-bold-duotone" className="text-orange-500 w-5 h-5" />
                                                <p className="text-sm font-medium group-hover:text-orange-500 transition-colors break-all">{file.name}</p>
                                            </div>
                                            <Icon icon="solar:download-bold" className="w-4 h-4 text-zinc-400 group-hover:text-orange-500 transition-colors" />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="w-full lg:w-96 flex flex-col gap-6 shrink-0">
                    {/* Sudah punya akses */}
                    {hasAccess && !isOwner && (
                        <div className="rounded-2xl  bg-emerald-50 dark:bg-emerald-950/70 p-5 flex items-center gap-3">
                            <Icon icon="solar:verified-check-bold-duotone" width={28} className="text-emerald-500 shrink-0" />
                            <div>
                                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Akses Aktif</p>
                                {accessData?.purchase?.endDate ? (
                                    <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">
                                        Hingga {new Date(accessData.purchase.endDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                                    </p>
                                ) : (
                                    <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">Akses selamanya</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Pricing card */}
                    {!hasAccess && plans.length > 0 && (
                        <div className="border border-zinc-200 dark:border-0 rounded-2xl p-6 bg-white dark:bg-abu-second">
                            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Akses Kursus</h3>
                            <p className="text-xs text-zinc-500 mt-1 mb-5">Pilih paket yang sesuai kebutuhan kamu</p>
                            <div className="space-y-3">
                                {plans.map((plan) => {
                                    const isFeatured = plan.id === featuredPlan?.id;
                                    const meta = PLAN_META[plan.type] ?? { label: plan.type, suffix: '' };
                                    return (
                                        <div key={plan.id} className={`rounded-2xl p-4 border transition-all ${isFeatured ? 'border-orange-400/40' : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'}`}>
                                            <div className="flex items-center justify-between">
                                                <p className={`text-[11px] font-semibold ${isFeatured ? 'text-orange-600' : 'text-zinc-500'}`}>Akses {meta.label}</p>
                                                {isFeatured && <span className="text-[9px] px-1 py-1 bg-orange-500 text-white rounded-full font-bold"><Icon icon="solar:cup-star-bold" width={20} /></span>}
                                            </div>
                                            <div className="mt-1.5 flex items-baseline gap-1">
                                                <span className="text-xl font-bold text-zinc-900 dark:text-white">{formatIDR(plan.price)}</span>
                                                {meta.suffix && <span className="text-xs text-zinc-500">{meta.suffix}</span>}
                                            </div>
                                            <button
                                                onClick={() => handleSelectPlan(plan)}
                                                className={`w-full mt-3 py-3 text-[13px] font-semibold rounded-full transition-all ${isFeatured ? 'dark:bg-white dark:text-black bg-black hover:scale-95 text-white' : 'border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-900 hover:text-white dark:hover:bg-white dark:hover:text-black'}`}
                                            >
                                                {isFeatured ? 'Beli Sekarang' : 'Pilih Paket'}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-center gap-2 text-xs text-zinc-400">
                                <Icon icon="solar:qr-code-bold-duotone" className="w-4 h-4" />
                                <p>Pembayaran via <span className="font-semibold text-zinc-600 dark:text-zinc-300">QRIS</span></p>
                            </div>
                        </div>
                    )}

                    {/* Other courses */}
                    {otherCourses.length > 0 && (
                        <div className="flex flex-col gap-3">
                            <h3 className="text-xs font-bold text-zinc-400 px-1">Lainnya</h3>
                            {otherCourses.map((course) => (
                                <div key={course.id} onClick={() => router.push(`/courses/${course.id}`)} className="flex gap-3 cursor-pointer group">
                                    <div className="relative w-32 aspect-video rounded-lg overflow-hidden shrink-0 bg-zinc-100 dark:bg-zinc-800">
                                        <Image src={course.thumbnail || '/c1.jpg'} alt={course.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                                    </div>
                                    <div className="flex flex-col justify-center gap-0.5 min-w-0">
                                        <p className="font-semibold text-xs line-clamp-2 leading-tight group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">{course.name}</p>
                                        <p className="text-zinc-400 text-[10px] font-medium">{course.owner?.name}</p>
                                        {(course.plans?.length ?? 0) > 0 && (
                                            <p className="text-[10px] font-semibold text-orange-500">Mulai {formatIDR(Math.min(...course.plans!.map((p) => p.price)))}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Icon } from '@iconify/react';
import {
    useCourseData,
    SubscriptionType,
    SubscriptionPlan,
} from '@/app/hooks/use-course-data';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import CourseNotFound from '@/app/(dashboard)/teacher/components/course-not-found';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const PLAN_CONFIG: Record<
    SubscriptionType,
    { label: string; icon: string; defaultDays: number | null; desc: string }
> = {
    DAILY: {
        label: 'Harian',
        icon: 'lucide:sun',
        defaultDays: 1,
        desc: 'Akses selama 1 hari',
    },
    WEEKLY: {
        label: 'Mingguan',
        icon: 'lucide:calendar',
        defaultDays: 7,
        desc: 'Akses selama 7 hari',
    },
    MONTHLY: {
        label: 'Bulanan',
        icon: 'lucide:calendar-days',
        defaultDays: 30,
        desc: 'Akses selama 30 hari',
    },
    LIFETIME: {
        label: 'Selamanya',
        icon: 'lucide:infinity',
        defaultDays: null,
        desc: 'Akses tanpa batas waktu',
    },
};

const ALL_TYPES = Object.keys(PLAN_CONFIG) as SubscriptionType[];

function formatPrice(price: number) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(price);
}

function PlanCard({
    plan,
    onEdit,
    onDelete,
    onToggle,
    isToggling,
}: {
    plan: SubscriptionPlan;
    onEdit: (plan: SubscriptionPlan) => void;
    onDelete: (plan: SubscriptionPlan) => void;
    onToggle: (plan: SubscriptionPlan) => void;
    isToggling: boolean;
}) {
    const config = PLAN_CONFIG[plan.type];

    return (
        <div
            className={`rounded-2xl border p-5 flex flex-col gap-4 transition-all ${
                plan.isActive
                    ? 'border-zinc-200 dark:border-0 bg-white dark:bg-abu-second'
                    : 'border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 opacity-60'
            }`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
                        <Icon
                            icon={config.icon}
                            className="text-orange-500"
                            width={18}
                        />
                    </div>
                    <div>
                        <p className="text-sm font-semibold">{config.label}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            {config.desc}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                    <button
                        onClick={() => onToggle(plan)}
                        disabled={isToggling}
                        title={plan.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition ${
                            plan.isActive &&
                            'text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                        }`}
                    >
                        <Icon
                            icon={
                                plan.isActive ? 'lucide:eye' : 'lucide:eye-off'
                            }
                            width={14}
                        />
                    </button>

                    <button
                        onClick={() => onEdit(plan)}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                    >
                        <Icon icon="lucide:pencil" width={14} />
                    </button>

                    <button
                        onClick={() => onDelete(plan)}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                    >
                        <Icon icon="lucide:trash-2" width={14} />
                    </button>
                </div>
            </div>

            <div className="flex items-end justify-between">
                <p className="text-2xl font-bold tracking-tight">
                    {formatPrice(plan.price)}
                </p>
                {!plan.isActive && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-500">
                        Nonaktif
                    </span>
                )}
            </div>
        </div>
    );
}

function PlanModal({
    existingTypes,
    editPlan,
    onClose,
    onSubmit,
    isLoading,
}: {
    existingTypes: SubscriptionType[];
    editPlan: SubscriptionPlan | null;
    onClose: () => void;
    onSubmit: (data: {
        type: SubscriptionType;
        price: number;
        durationDays?: number;
    }) => void;
    isLoading: boolean;
}) {
    const isEdit = !!editPlan;
    const availableTypes = isEdit
        ? ALL_TYPES
        : ALL_TYPES.filter((t) => !existingTypes.includes(t));

    const [type, setType] = useState<SubscriptionType>(
        editPlan?.type ?? availableTypes[0],
    );
    const [priceRaw, setPriceRaw] = useState(
        editPlan ? String(editPlan.price) : '',
    );
    const [durationDays, setDurationDays] = useState<string>(
        editPlan?.durationDays
            ? String(editPlan.durationDays)
            : String(PLAN_CONFIG[type]?.defaultDays ?? ''),
    );

    const handleTypeChange = (t: SubscriptionType) => {
        setType(t);
        const defaultDays = PLAN_CONFIG[t].defaultDays;
        setDurationDays(defaultDays !== null ? String(defaultDays) : '');
    };

    const handleSubmit = () => {
        const price = Number(priceRaw.replace(/\D/g, ''));
        if (!price || price <= 0) {
            toast.error('Harga harus diisi');
            return;
        }
        onSubmit({
            type,
            price,
            durationDays: durationDays ? Number(durationDays) : undefined,
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Animasi Overlay */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Animasi Modal Container */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                className="relative z-10 w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-6 space-y-5"
            >
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold">
                        {isEdit ? 'Edit Paket' : 'Tambah Paket'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-zinc-400 hover:text-zinc-600"
                    >
                        <Icon icon="lucide:x" width={18} />
                    </button>
                </div>

                {/* Tipe */}
                {!isEdit && (
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-500">
                            Tipe Plan
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {availableTypes.map((t) => (
                                <button
                                    key={t}
                                    onClick={() => handleTypeChange(t)}
                                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition ${
                                        type === t
                                            ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
                                            : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300'
                                    }`}
                                >
                                    <Icon
                                        icon={PLAN_CONFIG[t].icon}
                                        width={14}
                                    />
                                    {PLAN_CONFIG[t].label}
                                </button>
                            ))}
                        </div>
                        {availableTypes.length === 0 && (
                            <p className="text-xs text-zinc-400">
                                Semua tipe plan sudah dibuat.
                            </p>
                        )}
                    </div>
                )}

                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-500">
                        Harga
                    </label>
                    <div className="flex items-center gap-2 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3">
                        <span className="text-sm font-medium text-zinc-400">
                            Rp
                        </span>
                        <input
                            type="text"
                            inputMode="numeric"
                            placeholder="0"
                            value={
                                priceRaw
                                    ? new Intl.NumberFormat('id-ID').format(
                                          Number(priceRaw.replace(/\D/g, '')),
                                      )
                                    : ''
                            }
                            onChange={(e) =>
                                setPriceRaw(e.target.value.replace(/\D/g, ''))
                            }
                            className="flex-1 bg-transparent outline-none text-sm font-semibold"
                        />
                    </div>
                </div>

                {type !== SubscriptionType.LIFETIME && (
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-500">
                            Durasi (hari)
                        </label>
                        <input
                            type="number"
                            min={1}
                            value={durationDays}
                            onChange={(e) => setDurationDays(e.target.value)}
                            className="w-full border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm bg-transparent outline-none"
                        />
                    </div>
                )}

                <button
                    onClick={handleSubmit}
                    disabled={isLoading || availableTypes.length === 0}
                    className="w-full py-3 rounded-full dark:bg-white dark:text-black bg-black text-white text-sm flex items-center justify-center font-medium gap-2 hover:opacity-90 disabled:opacity-50 transition"
                >
                    {isLoading ? (
                        <Icon
                            icon="mingcute:loading-2-line"
                            className="animate-spin"
                            width={18}
                        />
                    ) : isEdit ? (
                        'Simpan Perubahan'
                    ) : (
                        'Tambah Plan'
                    )}
                </button>
            </motion.div>
        </div>
    );
}

export default function PlansPage() {
    const params = useParams();
    const courseId = params.id as string;

    const { course, isLoading, isError, createPlan, updatePlan, deletePlan } =
        useCourseData(courseId, false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editPlan, setEditPlan] = useState<SubscriptionPlan | null>(null);
    const [planToDelete, setPlanToDelete] = useState<SubscriptionPlan | null>(
        null,
    );

    const plans = course?.plans ?? [];
    const existingTypes = plans.map((p) => p.type);

    const handleSubmit = (data: {
        type: SubscriptionType;
        price: number;
        durationDays?: number;
    }) => {
        if (editPlan) {
            updatePlan.mutate(
                {
                    planId: editPlan.id,
                    price: data.price,
                    durationDays: data.durationDays,
                },
                {
                    onSuccess: () => {
                        setEditPlan(null);
                        setIsModalOpen(false);
                    },
                },
            );
        } else {
            createPlan.mutate(data, {
                onSuccess: () => setIsModalOpen(false),
            });
        }
    };

    const handleToggle = (plan: SubscriptionPlan) => {
        updatePlan.mutate({ planId: plan.id, isActive: !plan.isActive });
    };

    // Ganti handleConfirmDelete
    const handleConfirmDelete = () => {
        if (!planToDelete) return;
        deletePlan.mutate(planToDelete.id, {
            onSuccess: () => setPlanToDelete(null),
        });
    };

    if (isLoading)
        return (
            <div className="p-10 flex items-center justify-center">
                <Icon
                    icon="mingcute:loading-2-line"
                    className="animate-spin"
                    width={28}
                />
            </div>
        );

    if (isError || !course) return <CourseNotFound />;

    const canAddMore = existingTypes.length < ALL_TYPES.length;

    return (
        <div className="max-w-3xl mx-auto px-6 pb-16 md:pb-0 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold">Pilihan Paket</h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Atur harga dan paket akses untuk kursus ini
                    </p>
                </div>
                {canAddMore && (
                    <button
                        onClick={() => {
                            setEditPlan(null);
                            setIsModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 rounded-full dark:bg-white dark:text-black bg-black text-white text-nowrap text-sm hover:opacity-90 active:scale-95 transition font-medium"
                    >
                        <Icon icon="lucide:plus" width={16} />
                        Tambah Paket
                    </button>
                )}
            </div>

            {/* Info jika course belum publish */}
            {!course.isPublish && (
                <div className="flex items-start gap-2 p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 text-xs">
                    <Icon
                        icon="lucide:alert-triangle"
                        width={14}
                        className="mt-0.5 shrink-0"
                    />
                    <span>
                        Paket yang dibuat di sini akan aktif setelah course
                        dipublikasikan.
                    </span>
                </div>
            )}

            {/* Plan cards */}
            {plans.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {plans.map((plan) => (
                        <PlanCard
                            key={plan.id}
                            plan={plan}
                            onEdit={(p) => {
                                setEditPlan(p);
                                setIsModalOpen(true);
                            }}
                            onDelete={setPlanToDelete}
                            onToggle={handleToggle}
                            isToggling={updatePlan.isPending}
                        />
                    ))}
                </div>
            ) : (
                <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 p-12 flex flex-col items-center gap-3 text-zinc-400">
                    <Icon icon="lucide:tag" width={32} />
                    <p className="text-sm text-center">
                        Belum ada paket. Tambahkan paket untuk mengatur harga
                        kursus.
                    </p>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="mt-2 text-sm font-semibold text-orange-500 hover:underline"
                    >
                        + Tambah Plan Pertama
                    </button>
                </div>
            )}

            {/* Modal tambah/edit dengan AnimatePresence */}
            <AnimatePresence>
                {isModalOpen && (
                    <PlanModal
                        existingTypes={editPlan ? [] : existingTypes}
                        editPlan={editPlan}
                        onClose={() => {
                            setIsModalOpen(false);
                            setEditPlan(null);
                        }}
                        onSubmit={handleSubmit}
                        isLoading={createPlan.isPending || updatePlan.isPending}
                    />
                )}
            </AnimatePresence>

            {/* Confirm delete */}
            <ConfirmModal
                isOpen={!!planToDelete}
                onClose={() => setPlanToDelete(null)}
                onConfirm={handleConfirmDelete}
                isLoading={deletePlan.isPending}
                title="Hapus Plan?"
                buttomConfirm="Hapus"
                description={`Plan "${planToDelete ? PLAN_CONFIG[planToDelete.type].label : ''}" akan dihapus permanen.`}
            />
        </div>
    );
}

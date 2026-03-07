'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import QRCode from 'react-qr-code';

interface Plan {
    id: string;
    type: string;
    price: number;
    durationDays?: number | null;
}

interface QRISModalProps {
    isOpen: boolean;
    onClose: () => void;
    plan: Plan | null;
    qrString?: string;
    expiresAt?: string;
    paymentStatus?: 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED';
    isLoading?: boolean;
    onCheckout: () => void;
}

const PLAN_META: Record<string, { label: string; suffix: string }> = {
    DAILY: { label: 'Harian', suffix: '/hari' },
    WEEKLY: { label: 'Mingguan', suffix: '/minggu' },
    MONTHLY: { label: 'Bulanan', suffix: '/bulan' },
    LIFETIME: { label: 'Selamanya', suffix: '' },
};

const formatIDR = (n: number) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(n);

function useTimer(expiresAt?: string) {
    const [display, setDisplay] = useState({ m: 5, s: 0, expired: false });

    useEffect(() => {
        if (!expiresAt) return;

        const tick = () => {
            const diff = Math.max(
                0,
                Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000),
            );
            setDisplay({ m: Math.floor(diff / 60), s: diff % 60, expired: diff === 0 });
        };

        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [expiresAt]);

    return display;
}

export default function QRISModal({
    isOpen,
    onClose,
    plan,
    qrString,
    expiresAt,
    paymentStatus,
    isLoading = false,
    onCheckout,
}: QRISModalProps) {
    const timer = useTimer(expiresAt);
    const meta = plan ? (PLAN_META[plan.type] ?? { label: plan.type, suffix: '' }) : null;

    const isPaid = paymentStatus === 'PAID';
    const isExpired = paymentStatus === 'EXPIRED' || timer.expired;
    const isFailed = paymentStatus === 'FAILED';

    // Tutup modal otomatis 3 detik setelah paid
    useEffect(() => {
        if (isPaid) {
            const t = setTimeout(onClose, 3000);
            return () => clearTimeout(t);
        }
    }, [isPaid, onClose]);

    // Tentukan state aktif — hanya satu yang aktif pada satu waktu
    const activeState: 'paid' | 'error' | 'loading' | 'qr' | 'confirm' = isPaid
        ? 'paid'
        : isExpired || isFailed
        ? 'error'
        : isLoading && !qrString
        ? 'loading'
        : qrString
        ? 'qr'
        : 'confirm';

    return (
        <>
            {/* ── Backdrop ── */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        key="modal"
                        initial={{ opacity: 0, y: 40, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.97 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none"
                    >
                        <div className="pointer-events-auto w-full sm:max-w-sm bg-white dark:bg-abu-second rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">

                            {/* Header */}
                            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                                <div>
                                    <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
                                        Pembayaran QRIS
                                    </h2>
                                    {plan && meta && (
                                        <p className="text-xs text-zinc-500 mt-0.5">
                                            Akses {meta.label} — {formatIDR(plan.price)}
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                >
                                    <Icon icon="lucide:x" width={16} className="text-zinc-500" />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="px-6 py-6 flex flex-col items-center gap-5">
                                <AnimatePresence mode="wait">

                                    {/* ── PAID ── */}
                                    {activeState === 'paid' && (
                                        <motion.div
                                            key="paid"
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            transition={{ duration: 0.2 }}
                                            className="flex flex-col items-center gap-3 py-6"
                                        >
                                            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                                <Icon icon="solar:check-circle-bold" width={36} className="text-emerald-500" />
                                            </div>
                                            <p className="font-bold text-zinc-900 dark:text-white">
                                                Pembayaran Berhasil!
                                            </p>
                                            <p className="text-xs text-zinc-500 text-center">
                                                Akses kursus kamu sudah aktif. Selamat belajar 🎉
                                            </p>
                                        </motion.div>
                                    )}

                                    {activeState === 'error' && (
                                        <motion.div
                                            key="error"
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="flex flex-col items-center gap-3 py-4"
                                        >
                                            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                                                <Icon icon="solar:close-circle-bold" width={36} className="text-red-400" />
                                            </div>
                                            <p className="font-bold text-zinc-900 dark:text-white text-sm">
                                                {isFailed ? 'Pembayaran Gagal' : 'QRIS Kadaluarsa'}
                                            </p>
                                            <p className="text-xs text-zinc-500 text-center">
                                                {isFailed
                                                    ? 'Terjadi kesalahan pada pembayaran kamu.'
                                                    : 'Waktu pembayaran habis. Buat order baru.'}
                                            </p>
                                            <button
                                                onClick={onCheckout}
                                                className="mt-2 px-5 py-2.5 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-black text-sm font-semibold hover:scale-95 transition-transform"
                                            >
                                                Coba Lagi
                                            </button>
                                        </motion.div>
                                    )}

                                    {/* ── LOADING ── */}
                                    {activeState === 'loading' && (
                                        <motion.div
                                            key="loading"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.15 }}
                                            className="flex flex-col items-center gap-3 py-8"
                                        >
                                            <Icon
                                                icon="mingcute:loading-2-line"
                                                width={32}
                                                className="animate-spin text-zinc-400"
                                            />
                                            <p className="text-xs text-zinc-500">Membuat QRIS...</p>
                                        </motion.div>
                                    )}

                                    {/* ── QR CODE ── */}
                                    {activeState === 'qr' && (
                                        <motion.div
                                            key="qr"
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ duration: 0.2 }}
                                            className="flex flex-col items-center gap-4 w-full"
                                        >
                                            <div className="relative p-4 rounded-2xl bg-white border-2 border-zinc-100 dark:border-zinc-700 shadow-inner">
                                                <QRCode
                                                    value={qrString!}
                                                    size={200}
                                                    bgColor="#ffffff"
                                                    fgColor="#18181b"
                                                    level="M"
                                                />
                                                <div className="absolute inset-0 rounded-2xl border-2 border-orange-400/40 animate-pulse pointer-events-none" />
                                            </div>

                                            <div className="flex items-center gap-2 text-xs text-zinc-500">
                                                <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                                                <span>Menunggu pembayaran</span>
                                                <span className="font-mono font-bold text-zinc-700 dark:text-zinc-300">
                                                    {String(timer.m).padStart(2, '0')}:{String(timer.s).padStart(2, '0')}
                                                </span>
                                            </div>

                                            <p className="text-[11px] text-zinc-400 text-center leading-relaxed">
                                                Scan QR di atas menggunakan aplikasi<br />
                                                m-Banking atau dompet digital kamu
                                            </p>
                                        </motion.div>
                                    )}

                                    {/* ── KONFIRMASI ── */}
                                    {activeState === 'confirm' && (
                                        <motion.div
                                            key="confirm"
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="w-full flex flex-col gap-4"
                                        >
                                            <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-800 p-4 space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-zinc-500">Paket</span>
                                                    <span className="font-semibold text-zinc-900 dark:text-white">
                                                        Akses {meta?.label}
                                                    </span>
                                                </div>
                                                {plan?.durationDays && (
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-zinc-500">Durasi</span>
                                                        <span className="font-semibold text-zinc-900 dark:text-white">
                                                            {plan.durationDays} hari
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between text-sm border-t border-zinc-200 dark:border-zinc-700 pt-2 mt-2">
                                                    <span className="text-zinc-500">Total</span>
                                                    <span className="font-bold text-orange-500 text-base">
                                                        {formatIDR(plan?.price ?? 0)}
                                                    </span>
                                                </div>
                                            </div>

                                            <button
                                                onClick={onCheckout}
                                                disabled={isLoading}
                                                className="w-full py-3.5 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-black text-sm font-bold hover:scale-[0.98] transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                <Icon icon="solar:qr-code-bold" width={18} />
                                                Bayar dengan QRIS
                                            </button>
                                        </motion.div>
                                    )}

                                </AnimatePresence>
                            </div>

                            {/* Footer */}
                            {activeState === 'qr' && (
                                <div className="px-6 pb-6 flex items-center justify-center gap-2 text-[10px] text-zinc-400">
                                    <Icon
                                        icon="solar:shield-check-bold-duotone"
                                        width={14}
                                        className="text-emerald-500"
                                    />
                                    <span>Transaksi diproses oleh Xendit</span>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/app/libs/axios';
import toast from 'react-hot-toast';

const BASE_URL = 'http://localhost:4000/api/transactions';

export interface PurchaseData {
    purchaseId: string;
    externalId: string;
    qrString: string;
    qrId: string;
    amount: number;
    expiresAt: string;
    status: 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED' | 'CANCELLED';
}

export interface AccessData {
    hasAccess: boolean;
    purchase: {
        id: string;
        subscriptionType: string;
        endDate: string | null;
        status: string;
    } | null;
}

interface StatusResponse {
    id: string;
    status: 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED' | 'CANCELLED';
    paidAt?: string | null;
    endDate?: string | null;
}

export function useTransaction(courseId?: string) {
    const queryClient = useQueryClient();
    const [activePurchase, setActivePurchase] = useState<PurchaseData | null>(null);
    const handledStatus = useRef<string | null>(null);

    const accessQuery = useQuery({
        queryKey: ['course-access', courseId],
        queryFn: async (): Promise<AccessData> => {
            const res = await api.get(`${BASE_URL}/access/${courseId}`);
            return res.data.data;
        },
        enabled: !!courseId,
        staleTime: 0,
        refetchOnMount: true,
        refetchOnWindowFocus: true,
    });

    const historyQuery = useQuery({
        queryKey: ['transaction-history'],
        queryFn: async () => {
            const res = await api.get(`${BASE_URL}/history`);
            return res.data.data;
        },
        enabled: !courseId,
    });

    const checkout = useMutation({
        mutationFn: async ({ planId }: { planId: string }) => {
            const res = await api.post(`${BASE_URL}/checkout`, { courseId, planId });
            return res.data.data as PurchaseData;
        },
        onSuccess: (data) => {
            console.log(data)
            handledStatus.current = null;
            setActivePurchase(null);
            setTimeout(() => {
                setActivePurchase(data);      // ← baru set yang baru
            }, 50);
        },
        onError: (err) => {
            const msg = err?.message ?? 'Gagal membuat order';
            toast.error(msg);
        },
    });

    const statusQuery = useQuery<StatusResponse>({
        queryKey: ['purchase-status', activePurchase?.purchaseId],
        queryFn: async () => {
            const res = await api.get(`${BASE_URL}/${activePurchase!.purchaseId}/status`);
            return res.data.data as StatusResponse;
        },
        enabled: !!activePurchase?.purchaseId && activePurchase.status === 'PENDING',
        refetchInterval: (query) => {
            const status = query.state.data?.status;
            if (status === 'PAID' || status === 'FAILED' || status === 'EXPIRED') return false;
            return 3000;
        },
    });

    const polledStatus = statusQuery.data?.status;

    useEffect(() => {
        if (!polledStatus) return;
        if (handledStatus.current === polledStatus) return;

        if (polledStatus === 'PAID') {
            handledStatus.current = 'PAID';
            setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ['course-access', courseId] });
                queryClient.invalidateQueries({ queryKey: ['public-course', courseId] });
            }, 3000);
        } else if (polledStatus === 'EXPIRED') {
            handledStatus.current = 'EXPIRED';
            toast.error('QRIS sudah kadaluarsa. Silakan buat order baru.');
        } else if (polledStatus === 'FAILED') {
            handledStatus.current = 'FAILED';
            toast.error('Pembayaran gagal.');
        }
    }, [polledStatus, courseId, queryClient]);

    useEffect(() => {
        if (!polledStatus) return;
        if (!activePurchase) return;
        if (activePurchase.status === polledStatus) return;

        const t = setTimeout(() => {
            setActivePurchase((prev) =>
                prev ? { ...prev, status: polledStatus } : prev,
            );
        }, 0);
        return () => clearTimeout(t);
    }, [polledStatus, activePurchase]);

    const resetPurchase = () => {
        handledStatus.current = null;
        setActivePurchase(null);
    };

    return {
        accessData: accessQuery.data as AccessData | undefined,
        isAccessLoading: accessQuery.isLoading,

        history: historyQuery.data,
        isHistoryLoading: historyQuery.isLoading,

        checkout,
        isCheckingOut: checkout.isPending,

        activePurchase,
        paymentStatus: polledStatus,
        resetPurchase,
    };
}
import { Elysia, t } from 'elysia';
import { authMiddleware } from '../middleware/auth';
import { prisma } from '../libs/prisma';
import { redisPlugin } from '../libs/plugins/redis.plugin';
import axios from 'axios';

const XENDIT_SECRET_KEY = process.env.XENDIT_SECRET_KEY!;
const XENDIT_WEBHOOK_TOKEN = process.env.XENDIT_WEBHOOK_TOKEN!;

const xendit = axios.create({
    baseURL: 'https://api.xendit.co',
    auth: { username: XENDIT_SECRET_KEY, password: '' },
    headers: { 'Content-Type': 'application/json' },
});

async function hasActivePurchase(userId: string, courseId: string) {
    const now = new Date();
    return prisma.purchase.findFirst({
        where: {
            userId,
            courseId,
            status: 'PAID',
            OR: [{ endDate: null }, { endDate: { gt: now } }],
        },
    });
}

export const transactionRoutes = new Elysia({ prefix: '/api/transactions' })
    .use(redisPlugin)
    .use(authMiddleware)
    // ─────────────────────────────────────────
    // POST /api/transactions/checkout
    // Buat order + generate QRIS via Xendit
    // ─────────────────────────────────────────
    .post(
    '/checkout',
    async ({ body, user, set }) => {
        if (!user) {
            set.status = 401;
            return { error: 'Unauthorized' };
        }

        const { courseId, planId } = body;

        const plan = await prisma.subscriptionPlan.findUnique({
            where: { id: planId },
            include: { course: true },
        });

        if (!plan || !plan.isActive) {
            set.status = 404;
            return { error: 'Plan tidak ditemukan atau tidak aktif' };
        }

        if (plan.courseId !== courseId) {
            set.status = 400;
            return { error: 'Plan tidak sesuai dengan course ini' };
        }

        if (!plan.course.isPublish) {
            set.status = 400;
            return { error: 'Course belum dipublikasikan' };
        }

        const activePurchase = await hasActivePurchase(user.id, courseId);
        if (activePurchase) {
            if (activePurchase.subscriptionType === 'LIFETIME') {
                set.status = 409;
                return { error: 'Kamu sudah memiliki akses permanent untuk course ini' };
            }
            set.status = 409;
            return {
                error: 'Akses kamu masih aktif',
                data: { endDate: activePurchase.endDate },
            };
        }

        await prisma.purchase.updateMany({
            where: {
                userId: user.id,
                courseId,
                planId,
                status: 'PENDING',
                createdAt: {
                    lt: new Date(Date.now() - 1 * 60 * 1000),
                },
            },
            data: { status: 'EXPIRED' },
        });

        const activePending = await prisma.purchase.findFirst({
            where: {
                userId: user.id,
                courseId,
                planId,
                status: 'PENDING',
            },
        });

        if (activePending) {
            const createdAt = new Date(activePending.createdAt).getTime();
            return {
                success: true,
                data: {
                    purchaseId: activePending.id,
                    externalId: activePending.externalId,
                    qrString: activePending.paymentUrl,
                    qrId: null,
                    amount: activePending.amount,
                    expiresAt: new Date(createdAt + 1 * 60 * 1000).toISOString(),
                    status: 'PENDING',
                },
            };
        }

        const startDate = new Date();
        let endDate: Date | null = null;

        if (plan.type !== 'LIFETIME' && plan.durationDays) {
            endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + plan.durationDays);
        }

        const externalId = `habitz-${user.id}-${courseId}-${Date.now()}`;

        const purchase = await prisma.purchase.create({
            data: {
                userId: user.id,
                courseId,
                planId,
                subscriptionType: plan.type,
                amount: plan.price,
                currency: 'IDR',
                status: 'PENDING',
                externalId,
                startDate,
                endDate,
            },
        });

        try {
            const xenditRes = await xendit.post('/qr_codes', {
                external_id: externalId,
                type: 'DYNAMIC',
                amount: plan.price,
                currency: 'IDR',
                expires_at: new Date(Date.now() + 1 * 60 * 1000).toISOString(),
                callback_url: `${process.env.BACKEND_URL}/api/transactions/webhook/xendit`,
                metadata: {
                    purchase_id: purchase.id,
                    course_id: courseId,
                    user_id: user.id,
                },
            });

            const qrData = xenditRes.data;

            await prisma.purchase.update({
                where: { id: purchase.id },
                data: { paymentUrl: qrData.qr_string },
            });

            return {
                success: true,
                data: {
                    purchaseId: purchase.id,
                    externalId,
                    qrString: qrData.qr_string,
                    qrId: qrData.id,
                    amount: plan.price,
                    expiresAt: new Date(Date.now() + 1 * 60 * 1000).toISOString(),
                    status: 'PENDING',
                },
            };
        } catch (err: any) {
            await prisma.purchase.delete({ where: { id: purchase.id } });
            console.error('Xendit error:', err?.response?.data ?? err);
            set.status = 500;
            return { error: 'Gagal membuat QRIS. Coba lagi.' };
        }
    },
    {
        body: t.Object({
            courseId: t.String(),
            planId: t.String(),
        }),
    },
)
    // ─────────────────────────────────────────
    // GET /api/transactions/:purchaseId/status
    // Cek status transaksi
    // ─────────────────────────────────────────
    .get(
        '/:purchaseId/status',
        async ({ params: { purchaseId }, user, set }) => {
            if (!user) {
                set.status = 401;
                return { error: 'Unauthorized' };
            }

            const purchase = await prisma.purchase.findUnique({
                where: {
                    id: purchaseId,
                },
                include: {
                    course: {
                        select: { id: true, name: true, thumbnail: true },
                    },
                    plan: {
                        select: { type: true, price: true, durationDays: true },
                    },
                },
            });
            if (!purchase) {
                set.status = 404;
                return { error: 'Transaksi tidak ditemukan' };
            }
            if (purchase.userId !== user.id) {
                set.status = 403;
                return { error: 'Forbidden' };
            }
            return { success: true, data: purchase };
        },
        { params: t.Object({ purchaseId: t.String() }) },
    )
    .get('/history', async ({ user, set }) => {
        if (!user) {
            set.status = 401;
            return { error: 'Unauthorized' };
        }

        const purchases = await prisma.purchase.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            include: {
                course: {
                    select: {
                        id: true,
                        name: true,
                        thumbnail: true,
                        owner: { select: { name: true } },
                    },
                },
                plan: {
                    select: { type: true, price: true, durationDays: true },
                },
            },
        });

        return { success: true, data: purchases };
    })
    .get(
        '/access/:courseId',
        async ({ params: { courseId }, user, set }) => {
            if (!user) {
                set.status = 401;
                return { error: 'Unauthorized' };
            }

            const active = await hasActivePurchase(user.id, courseId);

            return {
                success: true,
                data: {
                    hasAccess: !!active,
                    purchase: active ?? null,
                },
            };
        },
        { params: t.Object({ courseId: t.String() }) },
    )
    .post(
        '/webhook/xendit',
        async ({ request, body, set }) => {
            const token = request.headers.get('x-callback-token');
            if (token !== XENDIT_WEBHOOK_TOKEN) {
                set.status = 403;
                return { error: 'Invalid webhook token' };
            }

            const event = body as any;

            if (event.event !== 'qr.payment') {
                return { success: true, message: 'Event diabaikan' };
            }

            const externalId: string =
                event.external_id ??
                event.qr_code?.external_id ??
                event.data?.external_id;
            const status: string = event.status ?? event.data?.status;

            if (!externalId) {
                set.status = 400;
                return { error: 'external_id tidak ditemukan' };
            }

            const purchase = await prisma.purchase.findUnique({
                where: { externalId },
            });

            if (!purchase) {
                set.status = 404;
                return { error: 'Purchase tidak ditemukan' };
            }

            // Idempotency
            if (purchase.status === 'PAID') {
                return { success: true, message: 'Already paid' };
            }

            if (status === 'SUCCEEDED' || status === 'COMPLETED') {
                await prisma.purchase.update({
                    where: { id: purchase.id },
                    data: {
                        status: 'PAID',
                        paidAt: new Date(),
                    },
                });

            } else if (status === 'FAILED' || status === 'EXPIRED') {
                await prisma.purchase.update({
                    where: { id: purchase.id },
                    data: {
                        status: status === 'EXPIRED' ? 'EXPIRED' : 'FAILED',
                    },
                });
            }

            return { success: true };
        },
        {
            body: t.Any(),
        },
    );

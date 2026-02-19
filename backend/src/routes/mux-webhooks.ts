import { Elysia } from 'elysia';
import { prisma } from '../libs/prisma';

export const muxWebhookRoutes = new Elysia({ prefix: '/api/webhooks' })
    .post('/mux', async ({ body, set }) => {
        try {
            const event = body as any;
            const type = event.type;
            const data = event.data;

            console.log("Mux Event Received:", type);

            if (type === 'video.asset.ready') {
                const uploadId = data.upload_id; 
                
                if (uploadId) {
                    await prisma.course.updateMany({
                        where: { muxUploadId: uploadId },
                        data: {
                            videoStatus: 'READY',
                            muxAssetId: data.id,
                            muxPlaybackId: data.playback_ids?.[0]?.id,
                        }
                    });
                    console.log(`Course updated to READY for uploadId: ${uploadId}`);
                }
            }

            if (type === 'video.asset.errored') {
                 const uploadId = data.upload_id;
                 if (uploadId) {
                    await prisma.course.updateMany({
                        where: { muxUploadId: uploadId },
                        data: { videoStatus: 'FAILED' }
                    });
                 }
            }

            return { received: true };

        } catch (error) {
            console.error("Webhook Error:", error);
            set.status = 500;
            return { error: "Webhook processing failed" };
        }
    });
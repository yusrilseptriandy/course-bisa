import { Elysia, t } from 'elysia';
import { authMiddleware } from '../middleware/auth';
import { UTApi } from 'uploadthing/server';
import { prisma } from '../libs/prisma';
import Mux from '@mux/mux-node';
import { redisPlugin } from '../libs/plugins/redis.plugin';

const utapi = new UTApi();

const mux = new Mux({
    tokenId: process.env.MUX_TOKEN_ID,
    tokenSecret: process.env.MUX_TOKEN_SECRET,
});

const getCourseKey = (id: string) => `draft:course:${id}`;

export const courseRoutes = new Elysia({ prefix: '/api/courses' })
    .use(redisPlugin)
    .get('/:id', async ({ params: { id }, set, redis }) => {
        const key = getCourseKey(id);
        const draftRaw = await redis.get(key);
        let course = await prisma.course.findUnique({
            where: { id },
            include: { attachments: true },
        });
        if (!course) {
            if (draftRaw) {
                const draft = JSON.parse(draftRaw);
                return {
                    success: true,
                    data: draft,
                    isDraft: true,
                };
            }
            if (!course) {
                set.status = 404;
                return {
                    success: false,
                    error: 'Course tidak ditemukan di mana pun',
                };
            }
        }

        return { success: true, data: course };
    })
    .get('/categories', async () => {
        const categories = await prisma.category.findMany({
            orderBy: {
                name: 'asc',
            },
        });
        return { success: true, data: categories };
    })
    .use(authMiddleware)
    .post(
        '/',
        async ({ body, user, redis, set }) => {
            if (!user || user.role !== 'teacher') {
                set.status = 403;
                return { error: 'Forbidden' };
            }

            const courseId = crypto.randomUUID();
            const key = getCourseKey(courseId);
            const draftData = {
                id: courseId,
                name: body.name,
                ownerId: user.id,
                status: 'DRAFT',
                attachments: [],
            };

            await redis.set(key, JSON.stringify(draftData), 'EX', 86400);

            return {
                success: true,
                message: 'Draft kursus dibuat di penyimpanan sementara',
                data: draftData,
            };
        },
        {
            body: t.Object({ name: t.String() }),
        },
    )
    .patch(
        '/:id',
        async ({ params: { id }, body, user, redis, set }) => {
            const key = getCourseKey(id);
            const existingRaw = await redis.get(key);

            if (!user || user.role !== 'teacher') {
                set.status = 403;
                return { error: 'Forbidden' };
            }

            if (!existingRaw) {
                set.status = 404;
                return {
                    error: 'Draft tidak ditemukan atau sudah kadaluwarsa',
                };
            }

            const currentDraft = JSON.parse(existingRaw);

            if (currentDraft.ownerId !== user.id) {
                set.status = 403;
                return { error: 'Anda tidak memiliki akses ke data ini' };
            }

            let imageUrl = currentDraft.thumbnail;
            if (body.thumbnail) {
                const thumbnailUploadResponse = await utapi.uploadFiles(
                    body.thumbnail,
                );
                if (thumbnailUploadResponse.data) {
                    imageUrl = thumbnailUploadResponse.data.ufsUrl;
                }
            }

            const updatedDraft = {
                ...currentDraft,
                name: body.name ?? currentDraft.name,
                desc: body.desc ?? currentDraft.desc,
                price:
                    body.price !== undefined
                        ? Number(body.price)
                        : currentDraft.price,
                categoryId: body.categoryId ?? currentDraft.categoryId,
                thumbnail: imageUrl,
            };

            await redis.set(key, JSON.stringify(updatedDraft), 'EX', 86400);
            return {
                success: true,
                message: 'Draft diperbarui di Redis',
                data: updatedDraft,
            };
        },
        {
            body: t.Object({
                name: t.Optional(t.String()),
                desc: t.Optional(t.String()),
                price: t.Optional(t.Numeric()),
                categoryId: t.Optional(t.String()),
                thumbnail: t.Optional(t.File()),
            }),
        },
    )
    .post(
        '/:id/video',
        async ({ params: { id }, redis, user, set }) => {
            const key = getCourseKey(id);
            const draftRaw = await redis.get(key);

            if (!draftRaw)
                return ((set.status = 404), { error: 'Draft tidak ditemukan' });

            const draft = JSON.parse(draftRaw);
            if (draft.ownerId !== user?.id)
                return ((set.status = 401), { error: 'Unauthorized' });

            try {
                const upload = await mux.video.uploads.create({
                    new_asset_settings: {
                        playback_policies: ['public'],
                        inputs: [
                            {
                                generated_subtitles: [
                                    { language_code: 'en', name: 'English' },
                                ],
                            },
                        ],
                    },
                    cors_origin: '*',
                });

                const updatedDraft = {
                    ...draft,
                    muxPlaybackId: upload.id,
                    muxAssetId: upload.asset_id,
                    videoStatus: 'PROCESSING',
                };
                await redis.set(key, JSON.stringify(updatedDraft), 'EX', 86400);
                return { url: upload.url, data: updatedDraft };
            } catch (error) {
                set.status = 500;
                return { error: 'Mux Error' };
            }
        },
        {
            params: t.Object({ id: t.String() }),
        },
    )
    .post(
        '/:id/attachments',
        async ({ params: { id }, body, redis, user, set }) => {
            const key = getCourseKey(id);
            const draftRaw = await redis.get(key);

            if (!user || user.role !== 'teacher') {
                set.status = 403;
                return { error: 'Forbidden' };
            }

            if (!draftRaw)
                return ((set.status = 404), { error: 'Draft not found' });
            const draft = JSON.parse(draftRaw);

            if (draft.ownerId !== user.id) {
                set.status = 403;
                return { error: 'Anda bukan pemilik draft ini' };
            }

            const response = await utapi.uploadFiles(body.files);
            const successfulUploads = response
                .filter((r) => r.data)
                .map((r) => ({
                    name: r.data!.name,
                    url: r.data!.ufsUrl,
                }));

            if (successfulUploads.length === 0) {
                set.status = 400;
                return { error: 'Gagal mengunggah file' };
            }

            const updatedDraft = {
                ...draft,
                attachment: [...(draft.attachment || []), ...successfulUploads],
            };

            await redis.set(key, JSON.stringify(updatedDraft), 'EX', 86400);
            return { success: true, data: successfulUploads };
        },
        {
            body: t.Object({
                name: t.Optional(t.String()),
                files: t.Files(),
            }),
            params: t.Object({
                id: t.String(),
            }),
        },
    )
    .post(
        '/:id/publish',
        async ({ params: { id }, user, redis, set }) => {
            const key = getCourseKey(id);
            const draftRaw = await redis.get(key);

            if (!draftRaw)
                return ((set.status = 400), { error: 'Tidak ada draft' });

            const draft = JSON.parse(draftRaw);

            if (!user || draft.ownerId !== user.id) {
                set.status = 401;
                return { error: 'Unauthorized: Anda bukan pemilik draft ini' };
            }

            try {
                const finalDataCourse = await prisma.$transaction(
                    async (tx) => {
                        const course = await tx.course.create({
                            data: {
                                id: draft.id,
                                name: draft.name,
                                desc: draft.desc || '',
                                price: draft.price || 0,
                                thumbnail: draft.thumbnail,
                                categoryId: draft.categoryId,
                                ownerId: draft.ownerId,
                                muxPlaybackId: draft.muxPlaybackId,
                                muxAssetId: draft.muxAssetId,
                                videoStatus: draft.videoStatus,
                                courseStatus: 'PUBLISHED',
                            },
                        });

                        // if (draft.attachments?.length > 0) {
                        //     await tx.attachment.createMany({
                        //         data: draft.attachments.map((a: any) => ({
                        //             ...a,
                        //             courseId: course.id,
                        //         })),
                        //     });
                        // }

                        const attachmentsData =
                            draft.attachments || draft.attachment;

                        if (attachmentsData && attachmentsData.length > 0) {
                            await tx.attachment.createMany({
                                data: attachmentsData.map((a: any) => ({
                                    name: a.name,
                                    url: a.url,
                                    courseId: course.id, // Relasi ke ID kursus yang baru dibuat
                                })),
                            });
                        }
                        return course;
                    },
                );
                await redis.del(key);
                return { success: true, data: finalDataCourse };
            } catch (error) {
                set.status = 500;
                return { error: 'Gagal publish' };
            }
        },
        {
            params: t.Object({ id: t.String() }),
        },
    );

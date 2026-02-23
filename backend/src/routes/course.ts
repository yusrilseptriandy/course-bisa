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
        const dbCourse = await prisma.course.findUnique({
            where: { id },
            include: {
                category: true,
                attachments: true,
            },
        });
        if (!dbCourse || dbCourse.isDeleted) {
            set.status = 404;
            return { error: 'Kursus tidak ditemukan atau telah dihapus' };
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
    .get('/owner', async ({ user, redis, set }) => {
        if (!user || user.role !== 'teacher') {
            set.status = 403;
            return { error: 'Forbidden' };
        }

        try {
            const keys = await redis.keys('draft:course:*');
            const drafts: any[] = [];

            for (const key of keys) {
                const data = await redis.get(key);
                if (data) {
                    const parsed = JSON.parse(data);
                    if (parsed.ownerId === user.id) {
                        drafts.push({
                            ...parsed,
                            isPublish: false,
                            isDeleted: false
                        });
                    }
                }
            }

            const publishedCourses = await prisma.course.findMany({
                where: {
                    ownerId: user.id,
                    isDeleted: false
                },
                orderBy: {
                    updatedAt: 'desc',
                },
            });
            const formattedPublished = publishedCourses.map((c) => ({
                ...c,
                isPublish: true,
            }));

            const allCourses = [...drafts, ...formattedPublished];

            return {
                success: true,
                data: allCourses,
            };
        } catch (error) {
            set.status = 500;
            return { error: 'Gagal mengambil daftar kursus' };
        }
    })
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
                    muxUploadId: upload.id,
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
    .post('/:id/video/status', async ({ params: { id }, redis }) => {
        const key = getCourseKey(id);
        const draftRaw = await redis.get(key);
        if (!draftRaw) return { error: 'Draft not found' };

        const draft = JSON.parse(draftRaw);

        if (!draft.muxUploadId) {
            return { error: 'Upload belum dibuat' };
        }
        const upload = await mux.video.uploads.retrieve(draft.muxUploadId);
        if (!upload.asset_id) {
            return { status: 'UPLOADING' };
        }
        const asset = await mux.video.assets.retrieve(upload.asset_id);

        const playbackId = asset.playback_ids?.[0]?.id;
        let mappedStatus: 'PROCESSING' | 'READY';

        if (asset.status === 'ready') {
            mappedStatus = 'READY';
        } else {
            mappedStatus = 'PROCESSING';
        }

        const updatedDraft = {
            ...draft,
            muxAssetId: upload.asset_id,
            muxPlaybackId: playbackId,
            durationSeconds: Math.round(asset.duration || 0),
            videoStatus: mappedStatus,
        };

        await redis.set(key, JSON.stringify(updatedDraft), 'EX', 86400);

        return updatedDraft;
    })
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
    .delete(
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

            const fileToDelete = draft.attachment.find(
                (file: any) => file.url === body.url,
            );

            console.log(fileToDelete);

            if (fileToDelete) {
                try {
                    const fileKey = fileToDelete.url.split('/').pop();
                    if (fileKey) {
                        await utapi.deleteFiles(fileKey);
                    }
                } catch (error) {
                    console.error(
                        'Gagal menghapus file di UploadThing:',
                        error,
                    );
                }
            }

            const updatedAttachments = draft.attachment.filter(
                (file: any) => file.url !== body.url,
            );
            const updatedDraft = {
                ...draft,
                attachment: updatedAttachments,
            };

            await redis.set(key, JSON.stringify(updatedDraft), 'EX', 86400);
            return { success: true };
        },
        {
            params: t.Object({
                id: t.String(),
            }),
            body: t.Object({
                url: t.String(),
            }),
        },
    )
    .delete(
        '/:id',
        async ({ params: { id }, user, redis, set }) => {
            const key = getCourseKey(id);

            const draftRaw = await redis.get(key);

            const dbCourse = await prisma.course.findUnique({
                where: { id },
                include: { attachments: true },
            });

            if (!draftRaw && !dbCourse) {
                set.status = 404;
                return { error: 'Course atau Draft tidak ditemukan' };
            }

            if (draftRaw) {
                const draft = JSON.parse(draftRaw);

                if (draft.ownerId !== user?.id) {
                    set.status = 403;
                    return { error: 'Forbidden: Anda bukan pemilik draf ini' };
                }

                try {
                    if (draft.muxAssetId) {
                        await mux.video.assets
                            .delete(draft.muxAssetId)
                            .catch((err) =>
                                console.error('Mux delete failed:', err),
                            );
                    }

                    const fileKeys: string[] = [];
                    if (
                        draft.thumbnail &&
                        typeof draft.thumbnail === 'string'
                    ) {
                        const thumbKey = draft.thumbnail.split('/').pop();
                        if (thumbKey) fileKeys.push(thumbKey);
                    }

                    const attachments = draft.attachment || [];
                    attachments.forEach((file: any) => {
                        if (file?.url) {
                            const fileKey = file.url.split('/').pop();
                            if (fileKey) fileKeys.push(fileKey);
                        }
                    });

                    if (fileKeys.length > 0) {
                        await utapi
                            .deleteFiles(fileKeys)
                            .catch((err) =>
                                console.error(
                                    'UploadThing delete failed:',
                                    err,
                                ),
                            );
                    }

                    await redis.del(key);

                    return {
                        success: true,
                        message:
                            'Draft dan semua aset berhasil dihapus permanen dari Redis',
                    };
                } catch (error) {
                    console.error('Redis Delete Error:', error);
                    set.status = 500;
                    return { error: 'Gagal menghapus draf' };
                }
            }

            if (dbCourse) {
                if (dbCourse.ownerId !== user?.id) {
                    set.status = 403;
                    return {
                        error: 'Forbidden: Anda bukan pemilik kursus ini',
                    };
                }

                try {
                    await prisma.course.update({
                        where: { id },
                        data: { isDeleted: true },
                    });

                    return {
                        success: true,
                        message:
                            'Kursus berhasil dipindahkan ke tempat sampah (Soft Delete)',
                    };
                } catch (error) {
                    console.error('Database Delete Error:', error);
                    set.status = 500;
                    return {
                        error: 'Gagal memproses penghapusan kursus di database',
                    };
                }
            }
        },
        {
            params: t.Object({ id: t.String() }),
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

            if (draft.videoStatus !== 'READY') {
                set.status = 400;
                return {
                    error: 'Video belum siap. Tunggu hingga status READY sebelum publish.',
                };
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
                                durationSeconds: draft.durationSeconds,
                                ownerId: draft.ownerId,
                                muxPlaybackId: draft.muxPlaybackId,
                                muxAssetId: draft.muxAssetId,
                                videoStatus: draft.videoStatus,
                                courseStatus: 'PUBLISHED',
                            },
                        });

                        const attachmentsData = draft.attachment;

                        if (attachmentsData && attachmentsData.length > 0) {
                            await tx.attachment.createMany({
                                data: attachmentsData.map((a: any) => ({
                                    name: a.name,
                                    url: a.url,
                                    courseId: course.id,
                                })),
                            });
                        }
                        return course;
                    },
                );
                await redis.del(key);
                return { success: true, data: finalDataCourse };
            } catch (error) {
                console.error(error);
                set.status = 500;
                return { error: 'Gagal publish' };
            }
        },
        {
            params: t.Object({ id: t.String() }),
        },
    );

import { Elysia, t } from 'elysia';
import { authMiddleware } from '../middleware/auth';
import { UTApi } from 'uploadthing/server';
import { prisma } from '../libs/prisma';
import Mux from '@mux/mux-node';

const utapi = new UTApi();

const mux = new Mux({
    tokenId: process.env.MUX_TOKEN_ID,
    tokenSecret: process.env.MUX_TOKEN_SECRET,
});

export const courseRoutes = new Elysia({ prefix: '/api/courses' })
    .get('/:id', async ({ params: { id }, set }) => {
        const course = await prisma.course.findUnique({
            where: { id },
            include: { attachments: true },
        });
        if (!course) {
            set.status = 404;
            return { success: false, error: 'Course not found' };
        }
        return { success: true, data: course };
    })
    .get('/categories', async ()=> {
        const categories = await prisma.category.findMany({
            orderBy: {
                name: 'asc'
            }
        });
        return { success: true, data: categories };
    })
    .use(authMiddleware)
.patch('/:id', async ({ params: { id }, body, user, set }) => {
    if (!user || user.role !== 'teacher') {
        set.status = 403;
        return { success: false, error: 'Hanya instruktur yang dapat mengubah kursus' };
    }

    try {
        const existingCourse = await prisma.course.findUnique({
            where: { id }
        });

        if (!existingCourse) {
            set.status = 404;
            return { success: false, error: 'Kursus tidak ditemukan' };
        }

        if (existingCourse.ownerId !== user.id) {
            set.status = 401;
            return { success: false, error: 'Anda bukan pemilik kursus ini' };
        }

        let imageUrl = existingCourse.thumbnail;
        if (body.thumbnail) {
            const uploadResponse = await utapi.uploadFiles(body.thumbnail);
            if (uploadResponse.data) {
                imageUrl = uploadResponse.data.ufsUrl;
            }
        }

        const updatedCourse = await prisma.course.update({
            where: { id },
            data: {
                name: body.name ?? undefined,
                desc: body.desc ?? undefined,
                price: body.price !== undefined ? Number(body.price) : undefined,
                categoryId: body.categoryId ?? undefined,
                thumbnail: imageUrl,
            }
        });

        return {
            success: true,
            message: 'Berhasil memperbarui kursus',
            data: updatedCourse
        };

    } catch (error) {
        console.error('Update Error:', error);
        set.status = 500;
        return { success: false, error: 'Terjadi kesalahan pada server' };
    }
}, {
    params: t.Object({
        id: t.String()
    }),
    body: t.Object({
        name: t.Optional(t.String()),
        desc: t.Optional(t.String()),
        price: t.Optional(t.Numeric()),
        categoryId: t.Optional(t.String()),
        thumbnail: t.Optional(t.File()),
    })
})
    .post(
        '/:id/video',
        async ({ params: { id }, body,user, set }) => {
            if (!user || user.role !== 'teacher') {
                set.status = 403;
                return { error: 'Forbidden' };
            }

            try {
                const course = await prisma.course.findUnique({
                    where: { id },
                });
                if (!course) {
                    set.status = 404;
                    return { error: 'Course not found' };
                }
                if (course.ownerId !== user.id) {
                    set.status = 401;
                    return { error: 'Unauthorized' };
                }

                // let imageUrl = course.thumbnail;
                // if (body.thumbnail) {
                //     const response = await utapi.uploadFiles(body.thumbnail);
                //         if (response.data) {
                //             imageUrl = response.data.ufsUrl;
                //         }
                //     }

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

               const updatedCourse = await prisma.course.update({
                    where: { id },
                    data: {
                        // desc: body.desc,
                        // price: body.price ? Number(body.price) : undefined,
                        // categoryId: body.categoryId,
                        // thumbnail: imageUrl,
                        muxPlaybackId: upload.id,
                        muxAssetId: upload.asset_id,
                        videoStatus: 'PROCESSING',
                    },
                });

                return {
                    message: 'Course updated and video upload initialized',
                    url: upload.url,
                    uploadId: upload.id,
                    data: updatedCourse
                };
            } catch (error) {
                console.error('Mux Error:', error);
                set.status = 500;
                return { error: 'Gagal inisialisasi upload video' };
            }
        },
        {
            params: t.Object({
                id: t.String(),
            })
        },
    )
    .post(
        '/',
        async ({ body, user, set }) => {
            if (!user) {
                set.status = 401;
                return { error: 'Unauthorized: Please login first' };
            }

            if (user.role !== 'teacher') {
                set.status = 403;
                return { error: 'Forbidden: Only teachers can create courses' };
            }

            try {
        

                const newCourse = await prisma.course.create({
                    data: {
                        name: body.name,
                        ownerId: user.id,
                        videoStatus: 'PROCESSING',
                    },
                });

                set.status = 201;
                return {
                    success: true,
                    message: 'Course created successfully',
                    data: newCourse,
                };
            } catch (error) {
                console.error('Server Error:', error);
                set.status = 500;
                return {
                    error:
                        error instanceof Error
                            ? error.message
                            : 'Internal Server Error',
                };
            }
        },
        {
            body: t.Object({
                name: t.String(),
            }),
        },
    )
    .post(
        '/:id/attachments',
        async ({ params: { id }, body, user, set }) => {
            if (!user || user.role !== 'teacher') {
                set.status = 403;
                return { error: 'Forbidden' };
            }

            try {
                const course = await prisma.course.findUnique({
                    where: { id },
                });
                if (!course) {
                    set.status = 404;
                    return { error: 'Course not found' };
                }
                if (course?.ownerId !== user.id) {
                    set.status = 401;
                    return { error: 'Unauthorized' };
                }

                const response = await utapi.uploadFiles(body.files);
                const successfulUploads = response.filter((r) => r.data);

                if (successfulUploads.length === 0) {
                    throw new Error('Gagal mengupload file');
                }

                const attachmentsData = successfulUploads.map((upload) => ({
                    name: upload.data!.name,
                    url: upload.data!.ufsUrl,
                    courseId: id,
                }));

                const savedAttachments = await prisma.attachment.createMany({
                    data: attachmentsData,
                });
                set.status = 201;
                return { success: true, data: savedAttachments };
            } catch (error) {
                console.error(error);
                set.status = 500;
                return { error: 'Internal Server Error' };
            }
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
    );

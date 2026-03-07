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
const getLessonKey = (id: string) => `draft:lesson:${id}`;
const PUBLIC_COURSES_CACHE_KEY = 'courses:published:all';

export const courseRoutes = new Elysia({ prefix: '/api/courses' })
    .use(redisPlugin)

    // ─────────────────────────────────────────
    // PUBLIC — Get all published courses
    // ─────────────────────────────────────────
    .get('/', async ({ redis }) => {
        const cached = await redis.get(PUBLIC_COURSES_CACHE_KEY);
        if (cached) {
            return { success: true, data: JSON.parse(cached), source: 'redis' };
        }

        const courses = await prisma.course.findMany({
            where: {
                isDeleted: false,
                courseStatus: 'PUBLISHED',
                lessons: { some: { videoStatus: 'READY' } },
            },
            include: {
                category: true,
                owner: { select: { id: true, name: true, image: true } },
                lessons: { select: { durationSeconds: true } },
                _count: { select: { likes: true, comments: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        const coursesWithMeta = courses.map((course) => ({
            ...course,
            totalDurationSeconds: course.lessons.reduce(
                (sum, l) => sum + (l.durationSeconds ?? 0),
                0,
            ),
            totalLessons: course.lessons.length,
        }));

        await redis.set(
            PUBLIC_COURSES_CACHE_KEY,
            JSON.stringify(coursesWithMeta),
            'EX',
            60 * 5,
        );

        return { success: true, data: coursesWithMeta, source: 'database' };
    })

    // ─────────────────────────────────────────
    // PUBLIC — Get course detail
    // ─────────────────────────────────────────
    .get('/publik/:id', async ({ params: { id }, set }) => {
        const course = await prisma.course.findFirst({
            where: {
                id,
                isDeleted: false,
                courseStatus: 'PUBLISHED',
                lessons: { some: { videoStatus: 'READY' } },
            },
            include: {
                category: true,
                owner: { select: { id: true, name: true, image: true } },
                attachments: true,
                plans: {
                    where: { isActive: true },
                    select: {
                        id: true,
                        type: true,
                        price: true,
                        durationDays: true,
                    },
                },
                lessons: {
                    where: { videoStatus: 'READY' },
                    orderBy: { order: 'asc' },
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        order: true,
                        durationSeconds: true,
                        isFree: true,
                        muxPlaybackId: true,
                        videoStatus: true,
                    },
                },
                _count: { select: { likes: true, comments: true } },
            },
        });

        if (!course) {
            set.status = 404;
            return { error: 'Course tidak ditemukan' };
        }

        return {
            success: true,
            data: {
                ...course,
                totalDurationSeconds: course.lessons.reduce(
                    (sum, l) => sum + (l.durationSeconds ?? 0),
                    0,
                ),
                totalLessons: course.lessons.length,
            },
        };
    })
    .get('/categories', async ({ redis }) => {
        const key = 'categories:all';
        const cached = await redis.get(key);
        if (cached) {
            return { success: true, data: JSON.parse(cached), source: 'redis' };
        }

        const categories = await prisma.category.findMany({
            orderBy: { name: 'asc' },
        });

        await redis.set(key, JSON.stringify(categories), 'EX', 60 * 60 * 6);
        return { success: true, data: categories, source: 'database' };
    })

    // ─────────────────────────────────────────
    // AUTH REQUIRED from here
    // ─────────────────────────────────────────
    .use(authMiddleware)

    // ─────────────────────────────────────────
    // Get all categories
    // ─────────────────────────────────────────

    // ─────────────────────────────────────────
    // TEACHER — Get owned courses (draft + published)
    // ─────────────────────────────────────────
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
                            totalLessons: parsed.lessons?.length ?? 0,
                            totalDurationSeconds:
                                parsed.lessons?.reduce(
                                    (sum: number, l: any) =>
                                        sum + (l.durationSeconds ?? 0),
                                    0,
                                ) ?? 0,
                            isPublish: false,
                            isDeleted: false,
                        });
                    }
                }
            }

            const publishedCourses = await prisma.course.findMany({
                where: { ownerId: user.id, isDeleted: false },
                orderBy: { updatedAt: 'desc' },
                include: {
                    lessons: {
                        select: {
                            id: true,
                            title: true,
                            order: true,
                            durationSeconds: true,
                            videoStatus: true,
                        },
                    },
                    plans: {
                        select: {
                            id: true,
                            type: true,
                            price: true,
                            durationDays: true,
                            isActive: true,
                        },
                    },
                    _count: { select: { likes: true, comments: true } },
                },
            });

            const formattedPublished = publishedCourses.map((c) => ({
                ...c,
                totalDurationSeconds: c.lessons.reduce(
                    (sum, l) => sum + (l.durationSeconds ?? 0),
                    0,
                ),
                totalLessons: c.lessons.length,
                isPublish: true,
            }));

            return {
                success: true,
                data: [...drafts, ...formattedPublished],
            };
        } catch (error) {
            set.status = 500;
            return { error: 'Gagal mengambil daftar kursus' };
        }
    })

    // ─────────────────────────────────────────
    // TEACHER — Get course by ID (owner only)
    // ─────────────────────────────────────────
    .get('/:id', async ({ params: { id }, set, redis, user }) => {
        const draftRaw = await redis.get(getCourseKey(id));
        if (draftRaw) {
            const draft = JSON.parse(draftRaw);
            if (draft.ownerId !== user?.id) {
                set.status = 403;
                return { error: 'Forbidden' };
            }
            return { success: true, data: draft, isDraft: true };
        }

        const course = await prisma.course.findUnique({
            where: { id },
            include: {
                category: true,
                attachments: true,
                plans: true,
                lessons: {
                    orderBy: { order: 'asc' },
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        order: true,
                        durationSeconds: true,
                        isFree: true,
                        muxAssetId: true,
                        muxPlaybackId: true,
                        videoStatus: true,
                        createdAt: true,
                    },
                },
                _count: { select: { likes: true, comments: true } },
            },
        });

        if (!course || course.isDeleted) {
            set.status = 404;
            return { error: 'Kursus tidak ditemukan atau telah dihapus' };
        }

        if (course.ownerId !== user?.id) {
            set.status = 403;
            return { error: 'Forbidden' };
        }

        return {
            success: true,
            data: {
                ...course,
                totalDurationSeconds: course.lessons.reduce(
                    (sum, l) => sum + (l.durationSeconds ?? 0),
                    0,
                ),
                totalLessons: course.lessons.length,
            },
            isDraft: false,
        };
    })

    // ─────────────────────────────────────────
    // TEACHER — Create course draft
    // ─────────────────────────────────────────
    .post(
        '/',
        async ({ body, user, redis, set }) => {
            if (!user || user.role !== 'teacher') {
                set.status = 403;
                return { error: 'Forbidden' };
            }

            const courseId = crypto.randomUUID();
            const draftData = {
                id: courseId,
                name: body.name,
                ownerId: user.id,
                courseStatus: 'DRAFT',
                lessons: [],
                attachments: [],
                totalLessons: 0,
                totalDurationSeconds: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            await redis.set(
                getCourseKey(courseId),
                JSON.stringify(draftData),
                'EX',
                86400,
            );

            return {
                success: true,
                message: 'Draft kursus dibuat',
                data: draftData,
            };
        },
        { body: t.Object({ name: t.String() }) },
    )

    // ─────────────────────────────────────────
    // TEACHER — Update course draft
    // ─────────────────────────────────────────
    .patch(
        '/:id',
        async ({ params: { id }, body, user, redis, set }) => {
            if (!user || user.role !== 'teacher') {
                set.status = 403;
                return { error: 'Forbidden' };
            }

            const key = getCourseKey(id);
            const existingRaw = await redis.get(key);

            if (existingRaw) {
                const currentDraft = JSON.parse(existingRaw);

                if (currentDraft.ownerId !== user.id) {
                    set.status = 403;
                    return { error: 'Anda tidak memiliki akses ke data ini' };
                }

                let imageUrl = currentDraft.thumbnail;
                if (body.thumbnail) {
                    if (currentDraft.thumbnail) {
                        const oldKey = currentDraft.thumbnail.split('/').pop();
                        if (oldKey)
                            await utapi
                                .deleteFiles(oldKey)
                                .catch(console.error);
                    }
                    const res = await utapi.uploadFiles(body.thumbnail);
                    if (res.data) imageUrl = res.data.ufsUrl;
                }

                const updatedDraft = {
                    ...currentDraft,
                    name: body.name ?? currentDraft.name,
                    desc: body.desc ?? currentDraft.desc,
                    categoryId: body.categoryId ?? currentDraft.categoryId,
                    thumbnail: imageUrl,
                    updatedAt: new Date().toISOString(),
                };

                await redis.set(key, JSON.stringify(updatedDraft), 'EX', 86400);
                return {
                    success: true,
                    message: 'Draft diperbarui',
                    data: updatedDraft,
                };
            }

            const dbCourse = await prisma.course.findUnique({ where: { id } });

            if (!dbCourse || dbCourse.isDeleted) {
                set.status = 404;
                return { error: 'Course tidak ditemukan' };
            }

            if (dbCourse.ownerId !== user.id) {
                set.status = 403;
                return { error: 'Anda tidak memiliki akses ke data ini' };
            }

            let imageUrl = dbCourse.thumbnail;
            if (body.thumbnail) {
                if (dbCourse.thumbnail) {
                    const oldKey = dbCourse.thumbnail.split('/').pop();
                    if (oldKey)
                        await utapi.deleteFiles(oldKey).catch(console.error);
                }
                const res = await utapi.uploadFiles(body.thumbnail);
                if (res.data) imageUrl = res.data.ufsUrl;
            }

            const updated = await prisma.course.update({
                where: { id },
                data: {
                    name: body.name ?? dbCourse.name,
                    desc: body.desc ?? dbCourse.desc,
                    categoryId: body.categoryId ?? dbCourse.categoryId,
                    thumbnail: imageUrl,
                },
            });

            await redis.del(PUBLIC_COURSES_CACHE_KEY);

            return {
                success: true,
                message: 'Course diperbarui',
                data: updated,
            };
        },
        {
            body: t.Object({
                name: t.Optional(t.String()),
                desc: t.Optional(t.String()),
                categoryId: t.Optional(t.String()),
                thumbnail: t.Optional(t.File()),
            }),
        },
    )

    // ─────────────────────────────────────────
    // TEACHER — Add lesson to course draft
    // ─────────────────────────────────────────
    .post(
  '/:id/lessons',
  async ({ params: { id }, body, user, redis, set }) => {
    if (!user || user.role !== 'teacher') {
      set.status = 403;
      return { error: 'Forbidden' };
    }

    const courseKey = getCourseKey(id);

    const courseRaw = await redis.get(courseKey);
    if (courseRaw) {
      const courseDraft = JSON.parse(courseRaw);

      if (courseDraft.ownerId !== user.id) {
        set.status = 403;
        return { error: 'Forbidden' };
      }

      const upload = await mux.video.uploads.create({
        new_asset_settings: {
          playback_policies: ['public'],
        },
        cors_origin: '*',
      });

      const lessonId = crypto.randomUUID();

      const newLesson = {
        id: lessonId,
        courseId: id,
        title: body.title,
        description: body.description ?? null,
        order: (courseDraft.lessons?.length ?? 0) + 1,
        isFree: body.isFree ?? false,
        durationSeconds: 0,
        muxUploadId: upload.id,
        muxAssetId: null,
        muxPlaybackId: null,
        videoStatus: 'PROCESSING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await redis.set(
        getLessonKey(lessonId),
        JSON.stringify(newLesson),
        'EX',
        86400,
      );

      const updatedLessons = [
        ...(courseDraft.lessons ?? []),
        newLesson,
      ];

      await redis.set(
        courseKey,
        JSON.stringify({
          ...courseDraft,
          lessons: updatedLessons,
          totalLessons: updatedLessons.length,
          updatedAt: new Date().toISOString(),
        }),
        'EX',
        86400,
      );

      return {
        success: true,
        source: 'redis',
        uploadUrl: upload.url,
        data: newLesson,
      };
    }

    const courseFromDb = await prisma.course.findUnique({
      where: { id },
      include: { lessons: true },
    });

    if (!courseFromDb) {
      set.status = 404;
      return { error: 'Course tidak ditemukan' };
    }

    if (courseFromDb.ownerId !== user.id) {
      set.status = 403;
      return { error: 'Forbidden' };
    }

    const upload = await mux.video.uploads.create({
      new_asset_settings: {
        playback_policies: ['public'],
      },
      cors_origin: '*',
    });

    const newLesson = await prisma.lesson.create({
      data: {
        title: body.title,
        description: body.description ?? null,
        order: (courseFromDb.lessons?.length ?? 0) + 1,
        isFree: body.isFree ?? false,
        durationSeconds: 0,
        muxPlaybackId: upload.id,
        videoStatus: 'PROCESSING',
        courseId: id,
      },
    });

    return {
      success: true,
      source: 'database',
      uploadUrl: upload.url,
      data: newLesson,
    };
  },
        {
            params: t.Object({ id: t.String() }),
            body: t.Object({
                title: t.String(),
                description: t.Optional(t.String()),
                isFree: t.Optional(t.Boolean()),
            }),
        },
    )

    // ─────────────────────────────────────────
    // TEACHER — Update lesson draft
    // ─────────────────────────────────────────
    .patch(
        '/:id/lessons/:lessonId',
        async ({ params: { id, lessonId }, body, user, redis, set }) => {
            if (!user || user.role !== 'teacher') {
                set.status = 403;
                return { error: 'Forbidden' };
            }

            const courseKey = getCourseKey(id);
            const courseRaw = await redis.get(courseKey);

            if (!courseRaw) {
                set.status = 404;
                return { error: 'Draft course tidak ditemukan' };
            }

            const courseDraft = JSON.parse(courseRaw);

            if (courseDraft.ownerId !== user.id) {
                set.status = 403;
                return { error: 'Forbidden' };
            }

            const lessonKey = getLessonKey(lessonId);
            const lessonRaw = await redis.get(lessonKey);

            if (!lessonRaw) {
                set.status = 404;
                return { error: 'Draft lesson tidak ditemukan' };
            }

            const lessonDraft = JSON.parse(lessonRaw);

            if (lessonDraft.courseId !== id) {
                set.status = 400;
                return { error: 'Lesson tidak ditemukan di course ini' };
            }

            const updatedLesson = {
                ...lessonDraft,
                title: body.title ?? lessonDraft.title,
                description: body.description ?? lessonDraft.description,
                isFree: body.isFree ?? lessonDraft.isFree,
                updatedAt: new Date().toISOString(),
            };

            await redis.set(
                lessonKey,
                JSON.stringify(updatedLesson),
                'EX',
                86400,
            );

            const updatedLessons =
                courseDraft.lessons?.map((l: any) =>
                    l.id === lessonId ? updatedLesson : l,
                ) ?? [];

            await redis.set(
                courseKey,
                JSON.stringify({
                    ...courseDraft,
                    lessons: updatedLessons,
                    updatedAt: new Date().toISOString(),
                }),
                'EX',
                86400,
            );

            return { success: true, data: updatedLesson };
        },
        {
            params: t.Object({ id: t.String(), lessonId: t.String() }),
            body: t.Object({
                title: t.Optional(t.String()),
                description: t.Optional(t.String()),
                isFree: t.Optional(t.Boolean()),
            }),
        },
    )

    // ─────────────────────────────────────────
    // TEACHER — Delete lesson from draft
    // ─────────────────────────────────────────
    .delete(
        '/:id/lessons/:lessonId',
        async ({ params: { id, lessonId }, user, redis, set }) => {
            if (!user || user.role !== 'teacher') {
                set.status = 403;
                return { error: 'Forbidden' };
            }

            const courseKey = getCourseKey(id);
            const courseRaw = await redis.get(courseKey);

            if (!courseRaw) {
                set.status = 404;
                return { error: 'Draft course tidak ditemukan' };
            }

            const courseDraft = JSON.parse(courseRaw);

            if (courseDraft.ownerId !== user.id) {
                set.status = 403;
                return { error: 'Forbidden' };
            }

            const lessonKey = getLessonKey(lessonId);
            const lessonRaw = await redis.get(lessonKey);

            if (!lessonRaw) {
                set.status = 404;
                return { error: 'Draft lesson tidak ditemukan' };
            }

            const lessonDraft = JSON.parse(lessonRaw);

            if (lessonDraft.courseId !== id) {
                set.status = 400;
                return { error: 'Lesson tidak ditemukan di course ini' };
            }

            if (lessonDraft.muxAssetId) {
                await mux.video.assets
                    .delete(lessonDraft.muxAssetId)
                    .catch(console.error);
            }

            await redis.del(lessonKey);

            const updatedLessons = (courseDraft.lessons ?? [])
                .filter((l: any) => l.id !== lessonId)
                .map((l: any, index: number) => ({ ...l, order: index + 1 }));

            await redis.set(
                courseKey,
                JSON.stringify({
                    ...courseDraft,
                    lessons: updatedLessons,
                    totalLessons: updatedLessons.length,
                    totalDurationSeconds: updatedLessons.reduce(
                        (sum: number, l: any) => sum + (l.durationSeconds ?? 0),
                        0,
                    ),
                    updatedAt: new Date().toISOString(),
                }),
                'EX',
                86400,
            );

            return { success: true, message: 'Lesson berhasil dihapus' };
        },
        {
            params: t.Object({ id: t.String(), lessonId: t.String() }),
        },
    )

    // ─────────────────────────────────────────
    // TEACHER — Poll video status per lesson
    // ─────────────────────────────────────────
    .post(
        '/:id/lessons/:lessonId/video/status',
        async ({ params: { id, lessonId }, redis, user, set }) => {
            if (!user || user.role !== 'teacher') {
                set.status = 403;
                return { error: 'Forbidden' };
            }

            const lessonKey = getLessonKey(lessonId);
            const lessonRaw = await redis.get(lessonKey);

            if (!lessonRaw) {
                set.status = 404;
                return { error: 'Draft lesson tidak ditemukan' };
            }

            const lessonDraft = JSON.parse(lessonRaw);

            if (lessonDraft.courseId !== id) {
                set.status = 400;
                return { error: 'Lesson tidak ditemukan di course ini' };
            }

            if (!lessonDraft.muxUploadId) {
                set.status = 400;
                return { error: 'Upload belum dibuat' };
            }

            const upload = await mux.video.uploads.retrieve(
                lessonDraft.muxUploadId,
            );

            if (!upload.asset_id) {
                return { status: 'UPLOADING', data: lessonDraft };
            }

            const asset = await mux.video.assets.retrieve(upload.asset_id);
            const playbackId = asset.playback_ids?.[0]?.id;
            const mappedStatus: 'PROCESSING' | 'READY' =
                asset.status === 'ready' ? 'READY' : 'PROCESSING';

            const updatedLesson = {
                ...lessonDraft,
                muxAssetId: upload.asset_id,
                muxPlaybackId: playbackId,
                durationSeconds: Math.round(asset.duration || 0),
                videoStatus: mappedStatus,
                updatedAt: new Date().toISOString(),
            };

            await redis.set(
                lessonKey,
                JSON.stringify(updatedLesson),
                'EX',
                86400,
            );

            const courseKey = getCourseKey(id);
            const courseRaw = await redis.get(courseKey);
            if (courseRaw) {
                const courseDraft = JSON.parse(courseRaw);
                const updatedLessons =
                    courseDraft.lessons?.map((l: any) =>
                        l.id === lessonId ? updatedLesson : l,
                    ) ?? [];

                await redis.set(
                    courseKey,
                    JSON.stringify({
                        ...courseDraft,
                        lessons: updatedLessons,
                        totalDurationSeconds: updatedLessons.reduce(
                            (sum: number, l: any) =>
                                sum + (l.durationSeconds ?? 0),
                            0,
                        ),
                        updatedAt: new Date().toISOString(),
                    }),
                    'EX',
                    86400,
                );
            }

            return { success: true, data: updatedLesson };
        },
        {
            params: t.Object({ id: t.String(), lessonId: t.String() }),
        },
    )

    // ─────────────────────────────────────────
    // TEACHER — Add attachments to course draft
    // ─────────────────────────────────────────
    .post(
        '/:id/attachments',
        async ({ params: { id }, body, redis, user, set }) => {
            if (!user || user.role !== 'teacher') {
                set.status = 403;
                return { error: 'Forbidden' };
            }

            const key = getCourseKey(id);
            const draftRaw = await redis.get(key);

            const response = await utapi.uploadFiles(body.files);
            const successfulUploads = response
                .filter((r) => r.data)
                .map((r) => ({ name: r.data!.name, url: r.data!.ufsUrl }));

            if (successfulUploads.length === 0) {
                set.status = 400;
                return { error: 'Gagal mengunggah file' };
            }

            if (draftRaw) {
                const draft = JSON.parse(draftRaw);

                if (draft.ownerId !== user.id) {
                    set.status = 403;
                    return { error: 'Anda bukan pemilik draft ini' };
                }

                await redis.set(
                    key,
                    JSON.stringify({
                        ...draft,
                        attachments: [
                            ...(draft.attachments ?? []),
                            ...successfulUploads,
                        ],
                        updatedAt: new Date().toISOString(),
                    }),
                    'EX',
                    86400,
                );

                return { success: true, data: successfulUploads };
            }

            const dbCourse = await prisma.course.findUnique({ where: { id } });

            if (!dbCourse || dbCourse.isDeleted) {
                set.status = 404;
                return { error: 'Course tidak ditemukan' };
            }

            if (dbCourse.ownerId !== user.id) {
                set.status = 403;
                return { error: 'Anda bukan pemilik course ini' };
            }

            await prisma.attachment.createMany({
                data: successfulUploads.map((f) => ({
                    name: f.name,
                    url: f.url,
                    courseId: id,
                })),
            });

            return { success: true, data: successfulUploads };
        },
        {
            params: t.Object({ id: t.String() }),
            body: t.Object({ files: t.Files() }),
        },
    )

    // ─────────────────────────────────────────
    // TEACHER — Delete attachment from course draft
    // ─────────────────────────────────────────
    .delete(
        '/:id/attachments',
        async ({ params: { id }, body, redis, user, set }) => {
            if (!user || user.role !== 'teacher') {
                set.status = 403;
                return { error: 'Forbidden' };
            }

            const key = getCourseKey(id);
            const draftRaw = await redis.get(key);

            if (draftRaw) {
                const draft = JSON.parse(draftRaw);

                if (draft.ownerId !== user.id) {
                    set.status = 403;
                    return { error: 'Anda bukan pemilik draft ini' };
                }

                const fileToDelete = draft.attachments?.find(
                    (f: any) => f.url === body.url,
                );
                if (!fileToDelete) {
                    set.status = 404;
                    return { error: 'File tidak ditemukan di draft ini' };
                }

                const fileKey = fileToDelete.url.split('/').pop();
                if (fileKey)
                    await utapi.deleteFiles(fileKey).catch(console.error);

                await redis.set(
                    key,
                    JSON.stringify({
                        ...draft,
                        attachments: draft.attachments.filter(
                            (f: any) => f.url !== body.url,
                        ),
                        updatedAt: new Date().toISOString(),
                    }),
                    'EX',
                    86400,
                );

                return { success: true };
            }

            const dbCourse = await prisma.course.findUnique({ where: { id } });

            if (!dbCourse || dbCourse.isDeleted) {
                set.status = 404;
                return { error: 'Course tidak ditemukan' };
            }

            if (dbCourse.ownerId !== user.id) {
                set.status = 403;
                return { error: 'Anda bukan pemilik course ini' };
            }

            const attachment = await prisma.attachment.findFirst({
                where: { courseId: id, url: body.url },
            });

            if (!attachment) {
                set.status = 404;
                return { error: 'File tidak ditemukan' };
            }

            const fileKey = body.url.split('/').pop();
            if (fileKey) await utapi.deleteFiles(fileKey).catch(console.error);

            await prisma.attachment.delete({ where: { id: attachment.id } });

            return { success: true };
        },
        {
            params: t.Object({ id: t.String() }),
            body: t.Object({ url: t.String() }),
        },
    )

    // ─────────────────────────────────────────
    // TEACHER — Create subscription plan
    // ─────────────────────────────────────────
    .post(
        '/:id/plans',
        async ({ params: { id }, body, user, set, redis }) => {
            if (!user || user.role !== 'teacher') {
                set.status = 403;
                return { error: 'Forbidden' };
            }

            const courseKey = getCourseKey(id);
            const draftRaw = await redis.get(courseKey);

            if (draftRaw) {
                const draft = JSON.parse(draftRaw);

                if (draft.ownerId !== user.id) {
                    set.status = 403;
                    return { error: 'Forbidden' };
                }

                const isDuplicate = draft.plans?.some(
                    (p: any) => p.type === body.type,
                );
                if (isDuplicate) {
                    set.status = 409;
                    return {
                        error: `Plan tipe ${body.type} sudah ada di draft ini`,
                    };
                }

                const newPlan = {
                    id: crypto.randomUUID(),
                    type: body.type,
                    price: body.price,
                    durationDays: body.durationDays ?? null,
                    isActive: true,
                };

                const updatedDraft = {
                    ...draft,
                    plans: [...(draft.plans ?? []), newPlan],
                    updatedAt: new Date().toISOString(),
                };

                await redis.set(
                    courseKey,
                    JSON.stringify(updatedDraft),
                    'EX',
                    86400,
                );

                return { success: true, data: newPlan, isDraft: true };
            }

            const dbCourse = await prisma.course.findUnique({
                where: { id },
                select: { ownerId: true, isDeleted: true },
            });

            if (!dbCourse || dbCourse.isDeleted) {
                set.status = 404;
                return { error: 'Course tidak ditemukan' };
            }

            if (dbCourse.ownerId !== user.id) {
                set.status = 403;
                return { error: 'Forbidden' };
            }

            try {
                const plan = await prisma.subscriptionPlan.create({
                    data: {
                        courseId: id,
                        type: body.type,
                        price: body.price,
                        durationDays: body.durationDays ?? null,
                    },
                });

                return { success: true, data: plan, isDraft: false };
            } catch (error: any) {
                if (error.code === 'P2002') {
                    set.status = 409;
                    return {
                        error: `Plan tipe ${body.type} sudah ada untuk course ini`,
                    };
                }
                set.status = 500;
                return { error: 'Gagal membuat plan di database' };
            }
        },
        {
            params: t.Object({ id: t.String() }),
            body: t.Object({
                type: t.Union([
                    t.Literal('DAILY'),
                    t.Literal('WEEKLY'),
                    t.Literal('MONTHLY'),
                    t.Literal('LIFETIME'),
                ]),
                price: t.Number(),
                durationDays: t.Optional(t.Number()),
            }),
        },
    )

    // ─────────────────────────────────────────
    // TEACHER — Update subscription plan
    // ─────────────────────────────────────────
    .patch(
        '/:id/plans/:planId',
        async ({ params: { id, planId }, body, user, set, redis }) => {
            if (!user || user.role !== 'teacher') {
                set.status = 403;
                return { error: 'Forbidden' };
            }

            const courseKey = getCourseKey(id);
            const draftRaw = await redis.get(courseKey);

            if (draftRaw) {
                const draft = JSON.parse(draftRaw);

                if (draft.ownerId !== user.id) {
                    set.status = 403;
                    return { error: 'Forbidden' };
                }

                const planIndex = draft.plans?.findIndex(
                    (p: any) => p.id === planId,
                );

                if (planIndex === -1 || planIndex === undefined) {
                    set.status = 404;
                    return { error: 'Plan tidak ditemukan di draft' };
                }

                const updatedPlan = {
                    ...draft.plans[planIndex],
                    price: body.price ?? draft.plans[planIndex].price,
                    durationDays:
                        body.durationDays ??
                        draft.plans[planIndex].durationDays,
                    isActive: body.isActive ?? draft.plans[planIndex].isActive,
                };

                draft.plans[planIndex] = updatedPlan;
                draft.updatedAt = new Date().toISOString();

                await redis.set(courseKey, JSON.stringify(draft), 'EX', 86400);

                return { success: true, data: updatedPlan, isDraft: true };
            }

            const plan = await prisma.subscriptionPlan.findUnique({
                where: { id: planId },
                include: { course: true },
            });

            if (!plan) {
                set.status = 404;
                return { error: 'Plan tidak ditemukan' };
            }

            if (plan.course.ownerId !== user.id || plan.courseId !== id) {
                set.status = 403;
                return { error: 'Forbidden' };
            }

            const updated = await prisma.subscriptionPlan.update({
                where: { id: planId },
                data: {
                    price: body.price ?? plan.price,
                    durationDays: body.durationDays ?? plan.durationDays,
                    isActive: body.isActive ?? plan.isActive,
                },
            });

            return { success: true, data: updated, isDraft: false };
        },
        {
            params: t.Object({ id: t.String(), planId: t.String() }),
            body: t.Object({
                price: t.Optional(t.Number()),
                durationDays: t.Optional(t.Number()),
                isActive: t.Optional(t.Boolean()),
            }),
        },
    )
    .delete(
        '/:id/plans/:planId',
        async ({ params: { id, planId }, user, set, redis }) => {
            if (!user || user.role !== 'teacher') {
                set.status = 403;
                return { error: 'Forbidden' };
            }

            const courseKey = getCourseKey(id);
            const draftRaw = await redis.get(courseKey);

            // =========================
            // 1️⃣ CEK DRAFT (REDIS)
            // =========================
            if (draftRaw) {
                const draft = JSON.parse(draftRaw);

                if (draft.ownerId !== user.id) {
                    set.status = 403;
                    return { error: 'Forbidden' };
                }

                if (!draft.plans || draft.plans.length === 0) {
                    set.status = 404;
                    return { error: 'Draft tidak memiliki plan' };
                }

                const planIndex = draft.plans.findIndex(
                    (p: any) => p.id === planId,
                );

                if (planIndex === -1) {
                    set.status = 404;
                    return { error: 'Plan tidak ditemukan di draft' };
                }

                const deletedPlan = draft.plans[planIndex];

                draft.plans.splice(planIndex, 1);
                draft.updatedAt = new Date().toISOString();

                await redis.set(courseKey, JSON.stringify(draft), 'EX', 86400);

                return {
                    success: true,
                    message: 'Plan draft berhasil dihapus',
                    data: deletedPlan,
                    isDraft: true,
                };
            }

            // =========================
            // 2️⃣ CEK DATABASE
            // =========================
            const plan = await prisma.subscriptionPlan.findUnique({
                where: { id: planId },
                include: { course: true },
            });

            if (!plan) {
                set.status = 404;
                return { error: 'Plan tidak ditemukan' };
            }

            if (plan.course.ownerId !== user.id || plan.courseId !== id) {
                set.status = 403;
                return { error: 'Forbidden' };
            }

            await prisma.subscriptionPlan.delete({
                where: { id: planId },
            });

            return {
                success: true,
                message: 'Plan berhasil dihapus',
                isDraft: false,
            };
        },
        { params: t.Object({ id: t.String(), planId: t.String() }) },
    )
    // ─────────────────────────────────────────
    // TEACHER — Hapus course draft atau soft-delete DB
    // ─────────────────────────────────────────
    .delete(
        '/:id',
        async ({ params: { id }, user, redis, set }) => {
            if (!user || user.role !== 'teacher') {
                set.status = 403;
                return { error: 'Forbidden' };
            }

            const key = getCourseKey(id);
            const draftRaw = await redis.get(key);
            const dbCourse = await prisma.course.findUnique({
                where: { id },
                include: { attachments: true, lessons: true },
            });

            if (!draftRaw && !dbCourse) {
                set.status = 404;
                return { error: 'Course atau Draft tidak ditemukan' };
            }

            if (draftRaw) {
                const draft = JSON.parse(draftRaw);

                if (draft.ownerId !== user.id) {
                    set.status = 403;
                    return { error: 'Forbidden: Anda bukan pemilik draf ini' };
                }

                try {
                    const lessons = draft.lessons ?? [];

                    await Promise.allSettled(
                        lessons
                            .filter((l: any) => l.muxAssetId)
                            .map((l: any) =>
                                mux.video.assets.delete(l.muxAssetId),
                            ),
                    );

                    await Promise.allSettled(
                        lessons.map((l: any) => redis.del(getLessonKey(l.id))),
                    );

                    const fileKeys: string[] = [];
                    if (draft.thumbnail) {
                        const k = draft.thumbnail.split('/').pop();
                        if (k) fileKeys.push(k);
                    }
                    (draft.attachments ?? []).forEach((f: any) => {
                        const k = f?.url?.split('/').pop();
                        if (k) fileKeys.push(k);
                    });

                    if (fileKeys.length > 0) {
                        await utapi.deleteFiles(fileKeys).catch(console.error);
                    }

                    await redis.del(key);

                    return {
                        success: true,
                        message: 'Draft dan semua aset berhasil dihapus',
                    };
                } catch (error) {
                    console.error('Draft Delete Error:', error);
                    set.status = 500;
                    return { error: 'Gagal menghapus draf' };
                }
            }

            if (dbCourse) {
                if (dbCourse.ownerId !== user.id) {
                    set.status = 403;
                    return {
                        error: 'Forbidden: Anda bukan pemilik kursus ini',
                    };
                }

                try {
                    await prisma.course.update({
                        where: { id },
                        data: { isDeleted: true, deletedAt: new Date() },
                    });

                    await redis.del(PUBLIC_COURSES_CACHE_KEY);

                    return {
                        success: true,
                        message: 'Kursus berhasil dipindahkan ke tempat sampah',
                    };
                } catch (error) {
                    console.error('DB Delete Error:', error);
                    set.status = 500;
                    return { error: 'Gagal menghapus kursus' };
                }
            }
        },
        { params: t.Object({ id: t.String() }) },
    )

    // ─────────────────────────────────────────
    // TEACHER — Publish course draft ke DB
    // ─────────────────────────────────────────
    .post('/:id/publish', async ({ params: { id }, user, redis, set }) => {
        if (!user || user.role !== 'teacher') {
            set.status = 403;
            return { error: 'Forbidden' };
        }

        const key = getCourseKey(id);
        const draftRaw = await redis.get(key);

        if (!draftRaw) {
            set.status = 400;
            return { error: 'Draft tidak ditemukan' };
        }

        const draft = JSON.parse(draftRaw);

        if (draft.ownerId !== user.id) {
            set.status = 403;
            return { error: 'Forbidden: Anda bukan pemilik draft ini' };
        }

        if (!draft.name) {
            set.status = 400;
            return { error: 'Nama course wajib diisi' };
        }

        if (!draft.lessons || draft.lessons.length === 0) {
            set.status = 400;
            return {
                error: 'Course harus memiliki minimal 1 lesson sebelum publish',
            };
        }

        const notReady = draft.lessons.filter(
            (l: any) => l.videoStatus !== 'READY',
        );
        if (notReady.length > 0) {
            set.status = 400;
            return {
                error: `${notReady.length} lesson belum siap. Tunggu hingga semua video berstatus READY.`,
            };
        }

        try {
            const finalCourse = await prisma.$transaction(async (tx) => {
                const course = await tx.course.create({
                    data: {
                        id: draft.id,
                        name: draft.name,
                        desc: draft.desc ?? '',
                        thumbnail: draft.thumbnail ?? null,
                        categoryId: draft.categoryId ?? null,
                        ownerId: draft.ownerId,
                        courseStatus: 'PUBLISHED',
                        isPublish: true,
                    },
                });

                await tx.lesson.createMany({
                    data: draft.lessons.map((l: any) => ({
                        id: l.id,
                        courseId: course.id,
                        title: l.title,
                        description: l.description ?? null,
                        order: l.order,
                        durationSeconds: l.durationSeconds ?? 0,
                        isFree: l.isFree ?? false,
                        muxAssetId: l.muxAssetId,
                        muxPlaybackId: l.muxPlaybackId,
                        videoStatus: l.videoStatus,
                    })),
                });

                if (draft.attachments?.length > 0) {
                    await tx.attachment.createMany({
                        data: draft.attachments.map((a: any) => ({
                            name: a.name,
                            url: a.url,
                            courseId: course.id,
                        })),
                    });
                }

                // ── Tambahkan ini ──
                if (draft.plans?.length > 0) {
                    await tx.subscriptionPlan.createMany({
                        data: draft.plans.map((p: any) => ({
                            id: p.id,
                            courseId: course.id,
                            type: p.type,
                            price: p.price,
                            durationDays: p.durationDays ?? null,
                            isActive: p.isActive ?? true,
                        })),
                    });
                }

                return course;
            });

            // cleanup Redis
            await Promise.allSettled([
                redis.del(key),
                redis.del(PUBLIC_COURSES_CACHE_KEY),
                ...draft.lessons.map((l: any) => redis.del(getLessonKey(l.id))),
            ]);

            return { success: true, data: finalCourse };
        } catch (error) {
            console.error('Publish Error:', error);
            set.status = 500;
            return { error: 'Gagal publish course' };
        }
    });

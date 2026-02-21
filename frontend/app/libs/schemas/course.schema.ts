import { z } from "zod";

export const createNameCourseSchema = z.object({
  name: z.string().min(3, "Nama kursus minimal 3 karakter"),
});

export const courseSchema = z.object({
  name: z.string().min(3, 'Judul minimal 3 karakter').max(100, 'Judul maksimal 100 karakter'),
  desc: z.string().min(10, 'Deskripsi minimal 10 karakter'),
  categoryId: z.string().min(1, 'Kategori harus dipilih'),
  price: z.coerce.number<number>().min(0, 'Harga tidak boleh negatif'),
  thumbnail: z.union([
        z.instanceof(File, { message: "Thumbnail wajib diisi" }),
        z.string().min(1, "Thumbnail wajib diisi")
    ], {
        error: "Thumbnail wajib diisi",
    })
})

export type CreateCourseName = z.infer<typeof createNameCourseSchema>;
export type CourseSchemaType = z.infer<typeof courseSchema>;
import { Icon } from '@iconify/react';

export default function CourseNotFound() {
    return (
        <div className="min-h-[70vh] flex items-center justify-center px-6">
            <div className="text-center max-w-md">
                <div className="mx-auto mb-6 w-20 h-20 flex items-center justify-center rounded-full bg-gray-100 dark:bg-zinc-800">
                    <Icon
                        icon="lucide:book-x"
                        width={40}
                        className="text-gray-400"
                    />
                </div>

                <h2 className="text-2xl font-bold mb-2">
                    Course Tidak Ditemukan
                </h2>

                <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6">
                    Data kursus yang kamu cari tidak tersedia atau sudah
                    dihapus.
                </p>

                <button
                    onClick={() => window.history.back()}
                    className="px-6 py-3 rounded-full bg-black text-white dark:bg-white dark:text-black font-semibold hover:scale-95 transition-all"
                >
                    Kembali
                </button>
            </div>
        </div>
    );
}

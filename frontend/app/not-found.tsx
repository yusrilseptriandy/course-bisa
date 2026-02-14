import Image from 'next/image'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center ">
      <div className="relative mb-8">
        <Image 
          src="/notfound.png" 
          alt="404 Not Found" 
          width={400} 
          height={200}
          className="object-contain"
          priority // Mempercepat loading gambar utama
        />
      </div>

      <h2 className="text-3xl font-bold text-gray-800 mb-2 dark:text-white">
        Halaman Tidak Ditemukan
      </h2>
      <p className="text-gray-600 mb-8 max-w-md dark:text-white">
        Waduh, sepertinya kamu tersesat! Halaman yang kamu cari tidak ada atau telah dipindahkan.
      </p>

      <Link 
        href="/" 
        className="px-8 py-3 bg-black text-white rounded-full font-medium transition-transform hover:scale-105 active:scale-95 shadow-lg"
      >
        Kembali ke Beranda
      </Link>
    </div>
  )
}
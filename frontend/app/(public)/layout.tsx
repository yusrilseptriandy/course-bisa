import Navbar from '@/components/shared/navbar';

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-svh flex-col">
            <Navbar />
            <main className='w-full h-full'>{children}</main>
        </div>
    );
}

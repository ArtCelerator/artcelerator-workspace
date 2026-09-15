import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 p-4">
      <div className="text-center space-y-6">
        <div className="text-6xl mb-4">📋</div>
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-6xl">
          Content Planner
        </h1>
        <p className="text-lg leading-8 text-zinc-600 max-w-md mx-auto">
          Kelola konten & agensi kamu dengan mudah
        </p>
        <div className="flex items-center justify-center gap-x-4 mt-8">
          <Link href="/login" className={buttonVariants({ size: "lg" })}>Masuk</Link>
            
          
          <Link href="/register" className={buttonVariants({ variant: "outline", size: "lg" })}>Daftar</Link>
            
          
        </div>
      </div>
    </div>
  );
}

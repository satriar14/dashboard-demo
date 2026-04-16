import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-indigo-100 p-4 rounded-full text-indigo-600 mb-6">
        <Search size={48} />
      </div>
      <h1 className="text-4xl font-bold text-slate-900 mb-2">Halaman Tidak Ditemukan</h1>
      <p className="text-slate-500 mb-8 max-w-md">
        Maaf, sumber daya yang Anda cari telah dipindahkan, dihapus, atau tidak pernah ada.
      </p>
      <Link href="/">
        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 h-12 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all">
          Kembali ke Dashboard
        </Button>
      </Link>
    </div>
  );
}

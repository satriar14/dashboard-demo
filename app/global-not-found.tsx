import { Poppins } from "next/font/google";
import "@/app/globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata = {
  title: '404 - SIGAP Analytics',
  description: 'Halaman tidak ditemukan.',
};

export default function GlobalNotFound() {
  return (
    <html lang="id" className={`${poppins.variable} h-full antialiased`}>
      <body className="font-sans bg-white text-slate-900 border-t-4 border-indigo-600">
        <div className="flex flex-col items-center justify-center min-h-screen px-4">
          <div className="text-[120px] font-black text-slate-100 absolute -z-10 select-none">
            404
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-4">Akses Terputus</h1>
          <p className="text-slate-500 mb-8 font-medium">Resource yang Anda minta tidak tersedia di sistem SIGAP.</p>
          <a 
            href="/" 
            className="px-6 py-3 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors shadow-xl"
          >
            Kembali ke Root
          </a>
        </div>
      </body>
    </html>
  );
}

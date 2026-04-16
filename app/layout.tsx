import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "SADAR Analytics | BAPENDA KALTENG",
  description: "Sistem Analitik Data untuk Aksi Responsif Pajak Kendaraan (SADAR) - Bapenda Kalimantan Tengah",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${poppins.variable} h-full antialiased`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}


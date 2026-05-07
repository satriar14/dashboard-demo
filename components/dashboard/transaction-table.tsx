"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  User,
  MapPin,
  Search,
  Filter as FilterIcon,
  Eye,
  X,
  Calendar,
  CreditCard,
  Printer,
  ExternalLink,
  Car,
  ShieldCheck,
  Phone,
  Sparkles,
  Activity,
  Info
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { DetailedData, formatNumber } from "@/lib/data";
import { motion, AnimatePresence } from "framer-motion";

function TransactionDetailModal({
  transaction,
  onClose
}: {
  transaction: DetailedData;
  onClose: () => void;
}) {
  const total = (transaction.pokok || 0) +
    (transaction.denda || 0) +
    (transaction.opsen || 0) +
    (transaction.bbnkb || 0) +
    (transaction.opsen_bbnkb || 0) +
    (transaction.swdkllj || 0) +
    (transaction.denda_swdkllj || 0);

  const fullAddress = transaction.alamat || [
    transaction.desa_kelurahan,
    transaction.kecamatan,
    transaction.kabupaten
  ].filter(Boolean).join(', ');

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr || "-"; // Fallback to raw string if possible
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm cursor-pointer"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-white/20"
      >
        <div className="p-6 pb-0 flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className={`text-[10px] font-bold uppercase tracking-wider
                  ${transaction.status === 'Lunas' ? 'bg-emerald-50 text-emerald-600' :
                    transaction.status === 'Tertunggak' ? 'bg-amber-50 text-amber-600' :
                      'bg-rose-50 text-rose-600'}`}
              >
                {transaction.status}
              </Badge>
              <span className="text-[10px] font-bold text-slate-400">ID: {transaction.id}</span>
            </div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">{transaction.nopol}</h3>
            <p className="text-[10px] font-bold text-indigo-600 uppercase">{transaction.merek} {transaction.tipe}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-slate-100">
            <X size={20} />
          </Button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[80vh]">
          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100 space-y-3">
            <div className="flex items-start gap-3">
              <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100">
                <User size={18} className="text-indigo-600" />
              </div>
              <div className="space-y-1">
                <p className="text-[13px] font-bold text-slate-400 uppercase tracking-widest leading-none">Pemilik Kendaraan</p>
                <p className="text-sm font-bold text-slate-800 uppercase">{transaction.pemilik}</p>
                <div className="flex items-start gap-1 text-[13px] text-slate-500 leading-tight">
                  <MapPin size={10} className="mt-0.5 shrink-0" /> {fullAddress}
                </div>
                <div className="flex items-center gap-3 mt-2 border-t border-slate-100 pt-2">
                  <div className="flex items-center gap-1 text-[13px] text-indigo-600 font-bold">
                    <ShieldCheck size={10} /> {transaction.nik || '-'}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-indigo-600 font-bold">
                    <Phone size={10} /> {transaction.no_hp || '-'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <Calendar size={14} />
                <span className="text-[9px] font-bold uppercase tracking-wider">Tanggal Bayar</span>
              </div>
              <p className="text-xs font-bold text-slate-800">{formatDate(transaction.date)}</p>
            </div>
            <div className="space-y-1 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <FilterIcon size={14} />
                <span className="text-[9px] font-bold uppercase tracking-wider">Samsat</span>
              </div>
              <p className="text-xs font-bold text-slate-800 uppercase truncate">{transaction.samsat || '-'}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-900 mb-2">
              <Car size={16} className="text-indigo-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider">Informasi Kendaraan</h4>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[8px] font-bold text-slate-400 uppercase">Tahun Buat</p>
                <p className="text-xs font-bold text-slate-800">{transaction.tahun_buat || '-'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[8px] font-bold text-slate-400 uppercase">Jenis</p>
                <p className="text-xs font-bold text-slate-800 uppercase truncate">{transaction.jenis_kendaraan || '-'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[8px] font-bold text-slate-400 uppercase">Bahan Bakar</p>
                <p className="text-xs font-bold text-slate-800">{transaction.bahan_bakar || '-'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[8px] font-bold text-slate-400 uppercase">Warna Plat</p>
                <p className="text-xs font-bold text-slate-800">{transaction.warna_plat || '-'}</p>
              </div>
            </div>
            <div className="p-3 bg-indigo-50/30 rounded-xl border border-indigo-100/50">
              <p className="text-[8px] font-bold text-indigo-400 uppercase mb-1">Masa Pajak Sampai</p>
              <p className="text-xs font-bold text-indigo-700">
                {transaction.masa_pajak_sampai ? new Date(transaction.masa_pajak_sampai).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
              </p>
            </div>
            <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-400 font-bold uppercase">No. Rangka</span>
                <span className="text-slate-700 font-mono font-bold uppercase">{transaction.nomor_rangka || '-'}</span>
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-400 font-bold uppercase">No. Mesin</span>
                <span className="text-slate-700 font-mono font-bold uppercase">{transaction.nomor_mesin || '-'}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-900 mb-2">
              <Sparkles size={16} className="text-indigo-600 fill-indigo-100" />
              <h4 className="text-xs font-bold uppercase tracking-wider">AI Strategy & Treatment</h4>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="bg-white p-1.5 rounded-lg shadow-sm">
                    <Activity size={14} className="text-indigo-600" />
                  </div>
                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Segmentation & Insight</p>
                </div>
                <div className="grid grid-cols-1 gap-2 border-t border-indigo-100/30 pt-2 mt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Segmen</span>
                    <Badge className="bg-indigo-600 text-white border-none text-[9px] uppercase h-5 px-2">{transaction.segmen_nama || 'General'}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Kepatuhan</span>
                    <span className="text-[10px] font-black text-slate-700 uppercase">{transaction.segmen_kepatuhan || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Usia Kendaraan</span>
                    <span className="text-[10px] font-black text-slate-700 uppercase">{transaction.usia_kendaraan} Tahun</span>
                  </div>
                </div>
                <div className="bg-white/50 p-3 rounded-lg mt-2 border border-indigo-100/50">
                  <p className="text-[8px] font-bold text-indigo-400 uppercase mb-1">Aksi Utama</p>
                  <p className="text-xs font-bold text-slate-700 leading-tight">
                    {transaction.treatment_aksi_utama || 'Analisis AI sedang diproses...'}
                  </p>
                </div>
                <div className="bg-white/50 p-3 rounded-lg border border-indigo-100/50">
                  <p className="text-[8px] font-bold text-indigo-400 uppercase mb-1">Kanal Penanganan</p>
                  <p className="text-xs font-bold text-slate-700 leading-tight">
                    {transaction.treatment_kanal_utama || '-'}
                  </p>
                </div>
              </div>
              <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="bg-white p-1.5 rounded-lg shadow-sm">
                    <Sparkles size={14} className="text-emerald-600" />
                  </div>
                  <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Kebijakan Amnesti & Konversi</p>
                </div>
                <div className="space-y-3 pt-1">
                  <div className="bg-white/50 p-3 rounded-lg border border-emerald-100/50">
                    <p className="text-[8px] font-bold text-emerald-500 uppercase mb-1">Rekomendasi Kebijakan</p>
                    <p className="text-[11px] font-bold text-slate-700 leading-relaxed">
                      {transaction.treatment_kebijakan_amnesti || 'Gunakan strategi standar.'}
                    </p>
                  </div>
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[9px] font-bold text-emerald-600 uppercase">Perkiraan Konversi</span>
                    <Badge variant="outline" className="text-emerald-700 border-emerald-200 bg-white text-[10px] font-black">
                      {transaction.treatment_perkiraan_konversi}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-900 mb-2">
              <CreditCard size={16} className="text-indigo-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider">Rincian Pembayaran</h4>
            </div>
            <div className="space-y-2 border-t border-slate-100 pt-3">
              <div className="flex justify-between text-xs font-medium text-slate-500">
                <span>Pokok PKB</span>
                <span>Rp {formatNumber(transaction.pokok)}</span>
              </div>
              <div className="flex justify-between text-xs font-medium text-slate-500">
                <span>Opsen PKB</span>
                <span>Rp {formatNumber(transaction.opsen)}</span>
              </div>
              <div className="flex justify-between text-xs font-medium text-slate-500">
                <span>Pokok BBNKB</span>
                <span>Rp {formatNumber(transaction.bbnkb || 0)}</span>
              </div>
              <div className="flex justify-between text-xs font-medium text-slate-500">
                <span>Pokok SWDKLLJ</span>
                <span>Rp {formatNumber(transaction.swdkllj || 0)}</span>
              </div>
              <div className="flex justify-between text-xs font-medium text-slate-500">
                <span>Denda SWDKLLJ</span>
                <span className={(transaction.denda_swdkllj || 0) > 0 ? 'text-rose-500' : ''}>Rp {formatNumber(transaction.denda_swdkllj || 0)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-900">Total Pembayaran</span>
                <span className="text-lg font-black text-indigo-600">Rp {formatNumber(total)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
          <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl h-11" size="sm">
            <Printer size={16} className="mr-2" /> Cetak Bukti
          </Button>
          <Button variant="outline" className="flex-1 border-slate-200 text-slate-600 font-bold rounded-xl h-11" size="sm">
            <ExternalLink size={16} className="mr-2" /> Detail UPT
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

interface TransactionTableProps {
  data: DetailedData[];
  currentPage: number;
  totalCount: number;
  onPageChange: (page: number) => void;
}

export function TransactionTable({ data, currentPage, totalCount, onPageChange }: TransactionTableProps) {
  const [localSearch, setLocalSearch] = useState('');
  const [selectedDetail, setSelectedDetail] = useState<DetailedData | null>(null);
  const itemsPerPage = 20; // Matches backend limit

  const filteredData = useMemo(() => {
    if (!localSearch) return data;
    const query = localSearch.toLowerCase();
    return data.filter(item =>
      item.nopol.toLowerCase().includes(query) ||
      item.pemilik.toLowerCase().includes(query) ||
      item.id.toLowerCase().includes(query)
    );
  }, [data, localSearch]);

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const startIdx = totalCount > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endIdx = Math.min(currentPage * itemsPerPage, totalCount);

  return (
    <>
      <Card className="border-slate-200/60 shadow-sm overflow-hidden">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-50 bg-slate-50/30 gap-4">
          <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Data Transaksi Lengkap</CardTitle>
          <div className="flex items-center gap-3">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <Input
                placeholder="Cari di tabel ini..."
                value={localSearch}
                onChange={(e) => {
                  setLocalSearch(e.target.value);
                  onPageChange(1); // reset to first page on search
                }}
                className="pl-9 h-9 bg-white border-slate-200 text-xs rounded-lg focus-visible:ring-indigo-500"
              />
            </div>
            <Badge variant="outline" className="bg-white whitespace-nowrap">{filteredData.length} Data</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto scrollbar-visible">
            <Table className="table-fixed">
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest">ID</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest ">Samsat</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest ">NOPOL</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest ">Pemilik & Alamat</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest ">Pokok PKB</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest ">Segmentasi</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest ">Kepatuhan</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest min-w-[280px]">Aksi Utama & Kanal</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest w-[70px] text-center">Usia</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest w-[120px] text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length > 0 ? (
                  filteredData.map((row) => (
                    <TableRow key={row.id} className="hover:bg-slate-50/50 transition-colors group">
                      <TableCell className="text-[10px] font-bold text-slate-400 truncate whitespace-normal">{row.id}</TableCell>
                      <TableCell className="text-xs font-semibold text-slate-600 truncate whitespace-normal">{row.samsat}</TableCell>
                      <TableCell className="truncate whitespace-normal">
                        <div className="flex flex-col overflow-hidden">
                          <span className="text-sm font-bold text-slate-900 truncate">{row.nopol}</span>
                          <span className="text-[10px] text-slate-400 font-medium uppercase truncate">{row.merek} {row.tipe}</span>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-normal">
                        <div className="flex flex-col overflow-hidden">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1 truncate">
                            <User size={10} className="text-indigo-500 shrink-0" /> {row.pemilik}
                          </span>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1 truncate">
                            <MapPin size={10} className="shrink-0" /> {row.alamat}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-bold text-slate-700">Rp {formatNumber(row.pokok)}</TableCell>
                      <TableCell className="whitespace-normal">
                        <div className="flex flex-col overflow-hidden">
                          <span className="text-[10px] font-bold text-indigo-600 uppercase truncate">{row.segmen_nama || '-'}</span>
                          <span className="text-[9px] text-slate-400 uppercase truncate">{row.segment_wilayah || '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`text-[9px] font-bold uppercase tracking-wider
                            ${row.segmen_kepatuhan === 'Patuh' ? 'bg-emerald-50 text-emerald-600' :
                              row.segmen_kepatuhan === 'Tertunggak' ? 'bg-amber-50 text-amber-600' :
                                'bg-rose-50 text-rose-600'}`}
                        >
                          {row.segmen_kepatuhan || 'Review'}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-normal">
                        <TooltipProvider>
                          <div className="flex flex-col gap-1 w-full overflow-hidden">
                            {row.treatment_aksi_utama ? (
                              <>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Badge variant="outline" className="bg-indigo-50/30 text-indigo-700 border-indigo-100 text-[9px] py-0.5 px-2 font-bold flex items-center gap-1.5 rounded-md w-full cursor-help overflow-hidden">
                                      <Sparkles size={9} className="text-indigo-500 fill-indigo-500 shrink-0" />
                                      <span className="truncate block">{row.treatment_aksi_utama}</span>
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-[300px] text-xs p-3 bg-slate-900 text-white border-0 shadow-xl" side="top">
                                    <p className="font-bold mb-1 text-indigo-300 flex items-center gap-1.5">
                                      <Sparkles size={10} /> Aksi Utama
                                    </p>
                                    {row.treatment_aksi_utama}
                                  </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                  <TooltipTrigger>
                                    <div className="flex items-center gap-1 text-[9px] text-slate-400 font-medium italic pl-1 cursor-help w-full overflow-hidden">
                                      <Phone size={8} className="shrink-0" />
                                      <span className="truncate block">{row.treatment_kanal_utama}</span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-[300px] text-[11px] p-2 bg-slate-800 text-white border-0" side="bottom">
                                    {row.treatment_kanal_utama}
                                  </TooltipContent>
                                </Tooltip>
                              </>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic font-medium">No strategy defined</span>
                            )}
                          </div>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell className="text-center font-bold text-xs text-slate-600">{row.usia_kendaraan} Thn</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedDetail(row)}
                            className="h-8 text-[10px] font-bold text-indigo-600 bg-indigo-50/50 hover:bg-indigo-100 border border-indigo-100/50 rounded-lg transition-all"
                          >
                            <Eye size={14} className="mr-1.5" /> Lihat Detail
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={12} className="h-32 text-center text-slate-400 italic">
                      Tidak ada data ditemukan.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          <div className="p-4 border-t border-slate-50 flex items-center justify-between">
            <p className="text-[10px] font-medium text-slate-400">
              Menampilkan <span className="text-slate-900 font-bold">{startIdx}-{endIdx}</span> dari <span className="text-slate-900 font-bold">{totalCount}</span>
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft size={16} />
              </Button>
              <div className="text-xs font-bold text-slate-600">
                {currentPage} / {totalPages || 1}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="h-8 w-8 p-0"
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <AnimatePresence>
        {selectedDetail && (
          <TransactionDetailModal
            transaction={selectedDetail}
            onClose={() => setSelectedDetail(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

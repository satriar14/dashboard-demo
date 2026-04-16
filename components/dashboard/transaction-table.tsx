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
  Filter as FilterIcon
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { DetailedData, formatNumber } from "@/lib/data";

interface TransactionTableProps {
  data: DetailedData[];
}

export function TransactionTable({ data }: TransactionTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return data.slice(start, start + itemsPerPage);
  }, [data, currentPage]);

  const startIdx = (currentPage - 1) * itemsPerPage + 1;
  const endIdx = Math.min(currentPage * itemsPerPage, data.length);

  return (
    <Card className="border-slate-200/60 shadow-sm overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 bg-slate-50/30">
        <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Data Transaksi Lengkap</CardTitle>
        <div className="flex items-center gap-2">
           <Badge variant="outline" className="bg-white">{data.length} Total</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">ID</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Samsat</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">NOPOL</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest w-[300px]">Pemilik & Alamat</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest">Pokok PKB</TableHead>
                <TableHead className="font-bold uppercase text-[10px] tracking-widest text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length > 0 ? (
                paginatedData.map((row) => (
                  <TableRow key={row.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="text-[10px] font-bold text-slate-400">{row.id}</TableCell>
                    <TableCell className="text-xs font-semibold text-slate-600">{row.samsat}</TableCell>
                    <TableCell className="text-sm font-bold text-slate-900">{row.nopol}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                          <User size={10} className="text-indigo-500" /> {row.pemilik}
                        </span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <MapPin size={10} /> {row.alamat}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-bold text-slate-700">Rp {formatNumber(row.pokok)}</TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant="secondary"
                        className={`text-[9px] font-bold uppercase tracking-wider
                          ${row.status === 'Lunas' ? 'bg-emerald-50 text-emerald-600' : 
                            row.status === 'Tertunggak' ? 'bg-amber-50 text-amber-600' : 
                            row.status === 'Critical' ? 'bg-rose-50 text-rose-600' :
                            'bg-indigo-50 text-indigo-600'}`}
                      >
                        {row.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-slate-400 italic">
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
            Menampilkan <span className="text-slate-900 font-bold">{startIdx}-{endIdx}</span> dari <span className="text-slate-900 font-bold">{data.length}</span>
          </p>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
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
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="h-8 w-8 p-0"
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

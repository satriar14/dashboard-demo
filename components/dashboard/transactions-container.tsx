"use client";

import { useState, useEffect } from 'react';
import { TransactionTable } from "./transaction-table";
import { TableSkeleton } from "./skeleton-loader";
import { getTransactions, getTotalTransactions, DashboardFilters } from "@/lib/api-actions";
import { DetailedData } from "@/lib/data";

interface TransactionsContainerProps {
  filters: DashboardFilters;
}

export function TransactionsContainer({ filters }: TransactionsContainerProps) {
  const [data, setData] = useState<DetailedData[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTransactions = async (page: number) => {
    setIsLoading(true);
    try {
      // Sequentialize fetches to reduce database pressure
      const transRes = await getTransactions(filters, page);
      const totalRes = await getTotalTransactions(filters);
      setData(transRes);
      setTotalCount(totalRes);
      setCurrentPage(page);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions(1);
  }, [filters]);

  if (isLoading) {
    return <TableSkeleton />;
  }

  return (
    <TransactionTable 
      data={data} 
      currentPage={currentPage}
      totalCount={totalCount}
      onPageChange={(page) => fetchTransactions(page)}
    />
  );
}

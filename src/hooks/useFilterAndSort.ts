import { useState, useMemo } from "react";

export interface UseFilterAndSortOptions<T> {
  data: T[];
  searchFields?: (keyof T)[];
  sortOptions?: {
    field: keyof T;
    direction: 'asc' | 'desc';
  };
}

export function useFilterAndSort<T extends Record<string, any>>({
  data,
  searchFields = [],
}: UseFilterAndSortOptions<T>) {
  const [searchValue, setSearchValue] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    // Search filter
    if (searchValue) {
      result = result.filter((item) =>
        searchFields.some((field) => {
          const value = item[field];
          return value?.toString().toLowerCase().includes(searchValue.toLowerCase());
        })
      );
    }

    // Status filter
    if (selectedStatus && selectedStatus !== "all") {
      result = result.filter((item) => item.status === selectedStatus);
    }

    // Date range filter
    if (startDate) {
      result = result.filter((item) => {
        if (!item.created_at) return false;
        const itemDate = new Date(item.created_at);
        return itemDate >= startDate;
      });
    }

    if (endDate) {
      result = result.filter((item) => {
        if (!item.created_at) return false;
        const itemDate = new Date(item.created_at);
        return itemDate <= endDate;
      });
    }

    // Sorting
    if (sortBy) {
      const [field, direction] = sortBy.split('-');
      result.sort((a, b) => {
        const aVal = a[field];
        const bVal = b[field];
        
        if (aVal === bVal) return 0;
        
        const comparison = aVal < bVal ? -1 : 1;
        return direction === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [data, searchValue, selectedStatus, sortBy, startDate, endDate, searchFields]);

  const clearFilters = () => {
    setSearchValue("");
    setSelectedStatus("all");
    setSortBy("");
    setStartDate(undefined);
    setEndDate(undefined);
  };

  return {
    filteredData: filteredAndSortedData,
    searchValue,
    setSearchValue,
    selectedStatus,
    setSelectedStatus,
    sortBy,
    setSortBy,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    clearFilters,
  };
}

export function usePagination<T>(data: T[], initialItemsPerPage: number = 10) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = data.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  return {
    paginatedData,
    currentPage,
    totalPages,
    totalItems: data.length,
    itemsPerPage,
    handlePageChange,
    handleItemsPerPageChange,
  };
}

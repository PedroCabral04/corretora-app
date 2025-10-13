import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFilterAndSort, usePagination } from '@/hooks/useFilterAndSort';

describe('useFilterAndSort', () => {
  const mockData = [
    { id: 1, name: 'João Silva', email: 'joao@example.com', status: 'active', created_at: '2024-01-15' },
    { id: 2, name: 'Maria Santos', email: 'maria@example.com', status: 'inactive', created_at: '2024-02-20' },
    { id: 3, name: 'Pedro Oliveira', email: 'pedro@example.com', status: 'active', created_at: '2024-03-10' },
    { id: 4, name: 'Ana Costa', email: 'ana@example.com', status: 'pending', created_at: '2024-01-25' },
    { id: 5, name: 'Carlos Lima', email: 'carlos@example.com', status: 'active', created_at: '2024-02-05' },
  ];

  describe('Initial State', () => {
    it('should initialize with all data', () => {
      const { result } = renderHook(() =>
        useFilterAndSort({
          data: mockData,
          searchFields: ['name', 'email'],
        })
      );

      expect(result.current.filteredData).toHaveLength(5);
      expect(result.current.searchValue).toBe('');
      expect(result.current.selectedStatus).toBe('all');
      expect(result.current.sortBy).toBe('');
      expect(result.current.startDate).toBeUndefined();
      expect(result.current.endDate).toBeUndefined();
    });

    it('should handle empty data array', () => {
      const { result } = renderHook(() =>
        useFilterAndSort({
          data: [],
          searchFields: ['name'],
        })
      );

      expect(result.current.filteredData).toHaveLength(0);
    });
  });

  describe('Search Filtering', () => {
    it('should filter by name', () => {
      const { result } = renderHook(() =>
        useFilterAndSort({
          data: mockData,
          searchFields: ['name', 'email'],
        })
      );

      act(() => {
        result.current.setSearchValue('João');
      });

      expect(result.current.filteredData).toHaveLength(1);
      expect(result.current.filteredData[0].name).toBe('João Silva');
    });

    it('should filter by email', () => {
      const { result } = renderHook(() =>
        useFilterAndSort({
          data: mockData,
          searchFields: ['name', 'email'],
        })
      );

      act(() => {
        result.current.setSearchValue('maria@example');
      });

      expect(result.current.filteredData).toHaveLength(1);
      expect(result.current.filteredData[0].email).toBe('maria@example.com');
    });

    it('should be case insensitive', () => {
      const { result } = renderHook(() =>
        useFilterAndSort({
          data: mockData,
          searchFields: ['name'],
        })
      );

      act(() => {
        result.current.setSearchValue('JOÃO');
      });

      expect(result.current.filteredData).toHaveLength(1);
      expect(result.current.filteredData[0].name).toBe('João Silva');
    });

    it('should filter by partial match', () => {
      const { result } = renderHook(() =>
        useFilterAndSort({
          data: mockData,
          searchFields: ['name'],
        })
      );

      act(() => {
        result.current.setSearchValue('Silva');
      });

      expect(result.current.filteredData).toHaveLength(1);
      expect(result.current.filteredData[0].name).toContain('Silva');
    });

    it('should return empty array when no match', () => {
      const { result } = renderHook(() =>
        useFilterAndSort({
          data: mockData,
          searchFields: ['name'],
        })
      );

      act(() => {
        result.current.setSearchValue('XYZ123');
      });

      expect(result.current.filteredData).toHaveLength(0);
    });

    it('should handle empty search value', () => {
      const { result } = renderHook(() =>
        useFilterAndSort({
          data: mockData,
          searchFields: ['name'],
        })
      );

      act(() => {
        result.current.setSearchValue('João');
      });

      expect(result.current.filteredData).toHaveLength(1);

      act(() => {
        result.current.setSearchValue('');
      });

      expect(result.current.filteredData).toHaveLength(5);
    });

    it('should search across multiple fields', () => {
      const { result } = renderHook(() =>
        useFilterAndSort({
          data: mockData,
          searchFields: ['name', 'email'],
        })
      );

      act(() => {
        result.current.setSearchValue('example');
      });

      expect(result.current.filteredData).toHaveLength(5);
    });
  });

  describe('Status Filtering', () => {
    it('should filter by active status', () => {
      const { result } = renderHook(() =>
        useFilterAndSort({
          data: mockData,
          searchFields: ['name'],
        })
      );

      act(() => {
        result.current.setSelectedStatus('active');
      });

      expect(result.current.filteredData).toHaveLength(3);
      result.current.filteredData.forEach(item => {
        expect(item.status).toBe('active');
      });
    });

    it('should filter by inactive status', () => {
      const { result } = renderHook(() =>
        useFilterAndSort({
          data: mockData,
          searchFields: ['name'],
        })
      );

      act(() => {
        result.current.setSelectedStatus('inactive');
      });

      expect(result.current.filteredData).toHaveLength(1);
      expect(result.current.filteredData[0].status).toBe('inactive');
    });

    it('should filter by pending status', () => {
      const { result } = renderHook(() =>
        useFilterAndSort({
          data: mockData,
          searchFields: ['name'],
        })
      );

      act(() => {
        result.current.setSelectedStatus('pending');
      });

      expect(result.current.filteredData).toHaveLength(1);
      expect(result.current.filteredData[0].status).toBe('pending');
    });

    it('should show all when status is "all"', () => {
      const { result } = renderHook(() =>
        useFilterAndSort({
          data: mockData,
          searchFields: ['name'],
        })
      );

      act(() => {
        result.current.setSelectedStatus('active');
      });

      expect(result.current.filteredData).toHaveLength(3);

      act(() => {
        result.current.setSelectedStatus('all');
      });

      expect(result.current.filteredData).toHaveLength(5);
    });
  });

  describe('Date Range Filtering', () => {
    it('should filter by start date', () => {
      const { result } = renderHook(() =>
        useFilterAndSort({
          data: mockData,
          searchFields: ['name'],
        })
      );

      act(() => {
        result.current.setStartDate(new Date('2024-02-01'));
      });

      expect(result.current.filteredData).toHaveLength(3);
    });

    it('should filter by end date', () => {
      const { result } = renderHook(() =>
        useFilterAndSort({
          data: mockData,
          searchFields: ['name'],
        })
      );

      act(() => {
        result.current.setEndDate(new Date('2024-02-01'));
      });

      expect(result.current.filteredData).toHaveLength(2);
    });

    it('should filter by date range', () => {
      const { result } = renderHook(() =>
        useFilterAndSort({
          data: mockData,
          searchFields: ['name'],
        })
      );

      act(() => {
        result.current.setStartDate(new Date('2024-02-01'));
        result.current.setEndDate(new Date('2024-02-28'));
      });

      expect(result.current.filteredData).toHaveLength(2);
    });

    it('should handle items without created_at', () => {
      const dataWithoutDates = [
        { id: 1, name: 'Test', status: 'active' },
        { id: 2, name: 'Test2', status: 'active', created_at: '2024-02-15' },
      ];

      const { result } = renderHook(() =>
        useFilterAndSort({
          data: dataWithoutDates,
          searchFields: ['name'],
        })
      );

      act(() => {
        result.current.setStartDate(new Date('2024-02-01'));
      });

      expect(result.current.filteredData).toHaveLength(1);
    });
  });

  describe('Sorting', () => {
    it('should sort by name ascending', () => {
      const { result } = renderHook(() =>
        useFilterAndSort({
          data: mockData,
          searchFields: ['name'],
        })
      );

      act(() => {
        result.current.setSortBy('name-asc');
      });

      const names = result.current.filteredData.map(item => item.name);
      expect(names[0]).toBe('Ana Costa');
      expect(names[names.length - 1]).toBe('Pedro Oliveira');
    });

    it('should sort by name descending', () => {
      const { result } = renderHook(() =>
        useFilterAndSort({
          data: mockData,
          searchFields: ['name'],
        })
      );

      act(() => {
        result.current.setSortBy('name-desc');
      });

      const names = result.current.filteredData.map(item => item.name);
      expect(names[0]).toBe('Pedro Oliveira');
      expect(names[names.length - 1]).toBe('Ana Costa');
    });

    it('should sort by id ascending', () => {
      const { result } = renderHook(() =>
        useFilterAndSort({
          data: mockData,
          searchFields: ['name'],
        })
      );

      act(() => {
        result.current.setSortBy('id-asc');
      });

      const ids = result.current.filteredData.map(item => item.id);
      expect(ids).toEqual([1, 2, 3, 4, 5]);
    });

    it('should sort by id descending', () => {
      const { result } = renderHook(() =>
        useFilterAndSort({
          data: mockData,
          searchFields: ['name'],
        })
      );

      act(() => {
        result.current.setSortBy('id-desc');
      });

      const ids = result.current.filteredData.map(item => item.id);
      expect(ids).toEqual([5, 4, 3, 2, 1]);
    });

    it('should handle equal values in sorting', () => {
      const dataWithEqualNames = [
        { id: 1, name: 'João', status: 'active' },
        { id: 2, name: 'João', status: 'inactive' },
      ];

      const { result } = renderHook(() =>
        useFilterAndSort({
          data: dataWithEqualNames,
          searchFields: ['name'],
        })
      );

      act(() => {
        result.current.setSortBy('name-asc');
      });

      expect(result.current.filteredData).toHaveLength(2);
    });
  });

  describe('Combined Filters', () => {
    it('should combine search and status filters', () => {
      const { result } = renderHook(() =>
        useFilterAndSort({
          data: mockData,
          searchFields: ['name'],
        })
      );

      act(() => {
        result.current.setSearchValue('a');
        result.current.setSelectedStatus('active');
      });

      expect(result.current.filteredData.length).toBeGreaterThan(0);
      result.current.filteredData.forEach(item => {
        expect(item.status).toBe('active');
        expect(item.name.toLowerCase()).toContain('a');
      });
    });

    it('should combine all filters', () => {
      const { result } = renderHook(() =>
        useFilterAndSort({
          data: mockData,
          searchFields: ['name'],
        })
      );

      act(() => {
        result.current.setSearchValue('a');
        result.current.setSelectedStatus('active');
        result.current.setStartDate(new Date('2024-01-01'));
        result.current.setEndDate(new Date('2024-12-31'));
        result.current.setSortBy('name-asc');
      });

      expect(result.current.filteredData.length).toBeGreaterThan(0);
    });
  });

  describe('Clear Filters', () => {
    it('should clear all filters', () => {
      const { result } = renderHook(() =>
        useFilterAndSort({
          data: mockData,
          searchFields: ['name'],
        })
      );

      act(() => {
        result.current.setSearchValue('João');
        result.current.setSelectedStatus('active');
        result.current.setSortBy('name-asc');
        result.current.setStartDate(new Date('2024-01-01'));
        result.current.setEndDate(new Date('2024-12-31'));
      });

      expect(result.current.filteredData.length).toBeLessThan(5);

      act(() => {
        result.current.clearFilters();
      });

      expect(result.current.searchValue).toBe('');
      expect(result.current.selectedStatus).toBe('all');
      expect(result.current.sortBy).toBe('');
      expect(result.current.startDate).toBeUndefined();
      expect(result.current.endDate).toBeUndefined();
      expect(result.current.filteredData).toHaveLength(5);
    });
  });
});

describe('usePagination', () => {
  const mockData = Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    name: `Item ${i + 1}`,
  }));

  describe('Initial State', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => usePagination(mockData));

      expect(result.current.currentPage).toBe(1);
      expect(result.current.itemsPerPage).toBe(10);
      expect(result.current.totalPages).toBe(5);
      expect(result.current.totalItems).toBe(50);
      expect(result.current.paginatedData).toHaveLength(10);
    });

    it('should initialize with custom items per page', () => {
      const { result } = renderHook(() => usePagination(mockData, 20));

      expect(result.current.itemsPerPage).toBe(20);
      expect(result.current.totalPages).toBe(3);
      expect(result.current.paginatedData).toHaveLength(20);
    });

    it('should handle empty data', () => {
      const { result } = renderHook(() => usePagination([]));

      expect(result.current.currentPage).toBe(1);
      expect(result.current.totalPages).toBe(0);
      expect(result.current.totalItems).toBe(0);
      expect(result.current.paginatedData).toHaveLength(0);
    });
  });

  describe('Page Navigation', () => {
    it('should change to next page', () => {
      const { result } = renderHook(() => usePagination(mockData, 10));

      act(() => {
        result.current.handlePageChange(2);
      });

      expect(result.current.currentPage).toBe(2);
      expect(result.current.paginatedData[0].id).toBe(11);
    });

    it('should change to last page', () => {
      const { result } = renderHook(() => usePagination(mockData, 10));

      act(() => {
        result.current.handlePageChange(5);
      });

      expect(result.current.currentPage).toBe(5);
      expect(result.current.paginatedData).toHaveLength(10);
    });

    it('should not go below page 1', () => {
      const { result } = renderHook(() => usePagination(mockData, 10));

      act(() => {
        result.current.handlePageChange(0);
      });

      expect(result.current.currentPage).toBe(1);
    });

    it('should not go above total pages', () => {
      const { result } = renderHook(() => usePagination(mockData, 10));

      act(() => {
        result.current.handlePageChange(10);
      });

      expect(result.current.currentPage).toBe(5);
    });

    it('should handle negative page numbers', () => {
      const { result } = renderHook(() => usePagination(mockData, 10));

      act(() => {
        result.current.handlePageChange(-5);
      });

      expect(result.current.currentPage).toBe(1);
    });
  });

  describe('Items Per Page', () => {
    it('should change items per page', () => {
      const { result } = renderHook(() => usePagination(mockData, 10));

      act(() => {
        result.current.handleItemsPerPageChange(25);
      });

      expect(result.current.itemsPerPage).toBe(25);
      expect(result.current.totalPages).toBe(2);
      expect(result.current.paginatedData).toHaveLength(25);
    });

    it('should reset to page 1 when changing items per page', () => {
      const { result } = renderHook(() => usePagination(mockData, 10));

      act(() => {
        result.current.handlePageChange(3);
      });

      expect(result.current.currentPage).toBe(3);

      act(() => {
        result.current.handleItemsPerPageChange(20);
      });

      expect(result.current.currentPage).toBe(1);
    });

    it('should handle items per page larger than data length', () => {
      const { result } = renderHook(() => usePagination(mockData, 10));

      act(() => {
        result.current.handleItemsPerPageChange(100);
      });

      expect(result.current.itemsPerPage).toBe(100);
      expect(result.current.totalPages).toBe(1);
      expect(result.current.paginatedData).toHaveLength(50);
    });
  });

  describe('Data Slicing', () => {
    it('should return correct slice for page 1', () => {
      const { result } = renderHook(() => usePagination(mockData, 10));

      const firstItem = result.current.paginatedData[0];
      const lastItem = result.current.paginatedData[9];

      expect(firstItem.id).toBe(1);
      expect(lastItem.id).toBe(10);
    });

    it('should return correct slice for page 2', () => {
      const { result } = renderHook(() => usePagination(mockData, 10));

      act(() => {
        result.current.handlePageChange(2);
      });

      const firstItem = result.current.paginatedData[0];
      const lastItem = result.current.paginatedData[9];

      expect(firstItem.id).toBe(11);
      expect(lastItem.id).toBe(20);
    });

    it('should handle incomplete last page', () => {
      const smallData = Array.from({ length: 25 }, (_, i) => ({
        id: i + 1,
        name: `Item ${i + 1}`,
      }));

      const { result } = renderHook(() => usePagination(smallData, 10));

      act(() => {
        result.current.handlePageChange(3);
      });

      expect(result.current.paginatedData).toHaveLength(5);
      expect(result.current.paginatedData[0].id).toBe(21);
      expect(result.current.paginatedData[4].id).toBe(25);
    });
  });

  describe('Total Pages Calculation', () => {
    it('should calculate total pages correctly', () => {
      const { result } = renderHook(() => usePagination(mockData, 10));
      expect(result.current.totalPages).toBe(5);
    });

    it('should handle division with remainder', () => {
      const { result } = renderHook(() => usePagination(mockData, 15));
      expect(result.current.totalPages).toBe(4);
    });

    it('should return 0 pages for empty data', () => {
      const { result } = renderHook(() => usePagination([], 10));
      expect(result.current.totalPages).toBe(0);
    });

    it('should return 1 page when data length equals items per page', () => {
      const exactData = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        name: `Item ${i + 1}`,
      }));

      const { result } = renderHook(() => usePagination(exactData, 10));
      expect(result.current.totalPages).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle single item', () => {
      const singleItem = [{ id: 1, name: 'Item 1' }];
      const { result } = renderHook(() => usePagination(singleItem, 10));

      expect(result.current.totalPages).toBe(1);
      expect(result.current.paginatedData).toHaveLength(1);
    });

    it('should handle data length change', () => {
      const { result, rerender } = renderHook(
        ({ data }) => usePagination(data, 10),
        { initialProps: { data: mockData } }
      );

      expect(result.current.totalPages).toBe(5);

      const newData = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        name: `Item ${i + 1}`,
      }));

      rerender({ data: newData });

      expect(result.current.totalPages).toBe(2);
    });
  });
});

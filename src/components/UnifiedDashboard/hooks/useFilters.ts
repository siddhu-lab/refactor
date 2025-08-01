import { useState, useCallback } from 'react';

export interface FilterState {
  viewType: 'activity' | 'network';
  timeRange: 'all' | '7d' | '30d' | '90d' | 'custom';
  selectedGroup: string;
  selectedView: string;
  selectedAuthor: string;
  searchTerm: string;
  hideNames: boolean;
  hideManagers: boolean;
  customDateFrom: string;
  customDateTo: string;
}

const initialFilters: FilterState = {
  viewType: 'activity',
  timeRange: 'all',
  selectedGroup: 'all',
  selectedView: 'all',
  selectedAuthor: 'all',
  searchTerm: '',
  hideNames: true,
  hideManagers: false,
  customDateFrom: '',
  customDateTo: '',
};

export const useFilters = () => {
  const [filters, setFilters] = useState<FilterState>(initialFilters);

  const updateFilter = useCallback(<K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const resetFilters = useCallback((keepViewType = true) => {
    setFilters(prev => ({
      ...initialFilters,
      viewType: keepViewType ? prev.viewType : initialFilters.viewType,
    }));
  }, []);

  const getActiveFilterCount = useCallback(() => {
    return Object.entries(filters).filter(([key, value]) => {
      if (key === 'viewType') return false;
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') return value !== 'all' && value !== '';
      return false;
    }).length;
  }, [filters]);

  return {
    filters,
    updateFilter,
    resetFilters,
    getActiveFilterCount,
  };
};
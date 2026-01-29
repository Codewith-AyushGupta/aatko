'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const filterTypes = [
  { value: '', label: 'All Types', icon: '🔍' },
  { value: 'Object', label: 'Objects', icon: '📦' },
  { value: 'PermissionSet', label: 'Permission Sets', icon: '🔐' },
  { value: 'Profile', label: 'Profiles', icon: '👤' },
  { value: 'Flow', label: 'Flows', icon: '⚡' },
  { value: 'ApexTrigger', label: 'Triggers', icon: '🎯' },
  { value: 'ApexClass', label: 'Apex Classes', icon: '💻' },
  { value: 'LWC', label: 'LWCs', icon: '⚛️' },
  { value: 'Layout', label: 'Layouts', icon: '📐' },
  { value: 'FlexiPage', label: 'Lightning Pages', icon: '📄' },
  { value: 'ValidationRule', label: 'Validation Rules', icon: '✓' },
  { value: 'Field', label: 'Fields', icon: '📝' },
];

export function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();
  const filterRef = useRef<HTMLDivElement>(null);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilter(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim() && !filterType) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const params = new URLSearchParams();
        if (searchQuery) params.set('q', searchQuery);
        if (filterType) params.set('type', filterType);

        const res = await fetch(`/api/search?${params.toString()}`);
        const data = await res.json();
        setSearchResults(data.results || []);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, filterType]);

  const handleResultClick = (result: any) => {
    const typeRoutes: Record<string, string> = {
      Object: '/objects',
      Flow: '/flows',
      ApexClass: '/apex',
      ApexTrigger: '/triggers',
      LWC: '/lwc',
      PermissionSet: '/permission-sets',
      Profile: '/profiles',
      Layout: '/layouts',
      FlexiPage: '/flexipages',
      Field: '/objects',
    };
    const route = typeRoutes[result.type] || '/objects';
    router.push(`${route}/${result.api_name}`);
    setSearchQuery('');
    setSearchResults([]);
  };

  const selectedFilter = filterTypes.find(f => f.value === filterType) || filterTypes[0];

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center gap-3">
        {/* Filter Dropdown */}
        <div className="relative" ref={filterRef}>
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-colors ${
              filterType
                ? 'border-acs-blue bg-blue-50 text-acs-blue'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <span>{selectedFilter.icon}</span>
            <span className="hidden sm:inline">{selectedFilter.label}</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showFilter && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              {filterTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => {
                    setFilterType(type.value);
                    setShowFilter(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-50 ${
                    filterType === type.value ? 'bg-blue-50 text-acs-blue' : ''
                  }`}
                >
                  <span>{type.icon}</span>
                  {type.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search Input */}
        <div className="relative flex-1 max-w-lg">
          <input
            type="text"
            placeholder={filterType ? `Search ${selectedFilter.label.toLowerCase()}...` : 'Search metadata (objects, flows, classes...)'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-acs-blue focus:border-transparent"
          />
          {isSearching && (
            <div className="absolute right-3 top-2.5">
              <div className="animate-spin h-5 w-5 border-2 border-acs-blue border-t-transparent rounded-full" />
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-auto">
              {searchResults.map((result) => (
                <button
                  key={`${result.type}-${result.api_name}`}
                  onClick={() => handleResultClick(result)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between"
                >
                  <div>
                    <span className="font-medium">{result.api_name}</span>
                    {result.label && result.label !== result.api_name && (
                      <span className="text-gray-500 ml-2">{result.label}</span>
                    )}
                  </div>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {result.type}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Clear filter button */}
        {(searchQuery || filterType) && (
          <button
            onClick={() => {
              setSearchQuery('');
              setFilterType('');
              setSearchResults([]);
            }}
            className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
          >
            Clear
          </button>
        )}
      </div>
    </header>
  );
}

'use client';

import { useState } from 'react';
import { useClient } from '@/lib/context/ClientContext';

export function ClientSelector() {
  const {
    clients,
    currentClient,
    currentOrg,
    orgs,
    loading,
    selectClient,
    selectOrg,
  } = useClient();

  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400">
        <span className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full" />
        Loading...
      </div>
    );
  }

  const getEnvBadgeColor = (env: string) => {
    switch (env) {
      case 'production':
        return 'bg-red-100 text-red-700';
      case 'sandbox':
        return 'bg-yellow-100 text-yellow-700';
      case 'scratch':
        return 'bg-blue-100 text-blue-700';
      case 'developer':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-700">
      {/* Client Selector */}
      <div className="relative flex-1">
        <button
          onClick={() => {
            setShowClientDropdown(!showClientDropdown);
            setShowOrgDropdown(false);
          }}
          className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
        >
          <div className="flex items-center gap-2 truncate">
            <span className="text-gray-400">Client:</span>
            <span className="text-white font-medium truncate">
              {currentClient?.name || 'Select Client'}
            </span>
          </div>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${showClientDropdown ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showClientDropdown && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
            {clients.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-400">No clients found</div>
            ) : (
              clients.map((client) => (
                <button
                  key={client.id}
                  onClick={() => {
                    selectClient(client.id);
                    setShowClientDropdown(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-700 transition-colors ${
                    currentClient?.id === client.id ? 'bg-gray-700' : ''
                  }`}
                >
                  <span className="text-white">{client.name}</span>
                  {currentClient?.id === client.id && (
                    <span className="ml-auto text-acs-blue">✓</span>
                  )}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Org Selector (only show if client is selected) */}
      {currentClient && (
        <div className="relative flex-1">
          <button
            onClick={() => {
              setShowOrgDropdown(!showOrgDropdown);
              setShowClientDropdown(false);
            }}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-2 truncate">
              <span className="text-gray-400">Org:</span>
              {currentOrg ? (
                <>
                  <span className="text-white font-medium truncate">{currentOrg.alias}</span>
                  <span className={`px-1.5 py-0.5 text-xs rounded ${getEnvBadgeColor(currentOrg.environment)}`}>
                    {currentOrg.environment}
                  </span>
                </>
              ) : (
                <span className="text-gray-400">Select Org</span>
              )}
            </div>
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform ${showOrgDropdown ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showOrgDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
              {orgs.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-400">No org connections</div>
              ) : (
                orgs.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => {
                      selectOrg(org.id);
                      setShowOrgDropdown(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-700 transition-colors ${
                      currentOrg?.id === org.id ? 'bg-gray-700' : ''
                    }`}
                  >
                    <span className="text-white">{org.alias}</span>
                    <span className={`px-1.5 py-0.5 text-xs rounded ${getEnvBadgeColor(org.environment)}`}>
                      {org.environment}
                    </span>
                    {org.is_default && (
                      <span className="text-xs text-gray-400">(default)</span>
                    )}
                    {currentOrg?.id === org.id && (
                      <span className="ml-auto text-acs-blue">✓</span>
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Compact version for use in headers
export function ClientSelectorCompact() {
  const { currentClient, currentOrg, loading } = useClient();

  if (loading) {
    return <span className="text-sm text-gray-400">Loading...</span>;
  }

  if (!currentClient) {
    return <span className="text-sm text-gray-400">No client selected</span>;
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-gray-300">{currentClient.name}</span>
      {currentOrg && (
        <>
          <span className="text-gray-500">/</span>
          <span className="text-gray-400">{currentOrg.alias}</span>
          <span className={`px-1.5 py-0.5 text-xs rounded ${
            currentOrg.environment === 'production'
              ? 'bg-red-100 text-red-700'
              : 'bg-yellow-100 text-yellow-700'
          }`}>
            {currentOrg.environment}
          </span>
        </>
      )}
    </div>
  );
}

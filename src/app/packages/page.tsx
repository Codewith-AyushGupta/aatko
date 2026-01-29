'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Package {
  id: string;
  name: string;
  namespace: string | null;
  version: string;
  versionName: string;
  documentationUrl: string | null;
}

export default function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/packages');
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setPackages(data.packages || []);
      }
    } catch (err) {
      setError('Failed to load packages');
    }
    setLoading(false);
  };

  // Group packages by category
  const categorizedPackages = {
    communication: packages.filter(p =>
      ['Dialpad', 'aircall', 'affectlayer', 'voice_connector'].includes(p.namespace || '')
    ),
    productivity: packages.filter(p =>
      ['Calendly', 'HelloSign', 'pandadoc', 'hndwrt', 'bbvideo'].includes(p.namespace || '')
    ),
    dataEnrichment: packages.filter(p =>
      ['DOZISF', 'HubSpot_Inc'].includes(p.namespace || '')
    ),
    development: packages.filter(p =>
      ['sf_devops', 'dlrs', 'Field_Trip', 'agrid', 'timeline', 'Illest'].includes(p.namespace || '')
    ),
    salesforce: packages.filter(p =>
      ['sf_com_apps', 'sf_chttr_apps', 'sfadminapps', 'SIQCloud', 'ssot', 'cdpactvstrgptnr', 'datacloudflow'].includes(p.namespace || '')
    ),
    other: packages.filter(p =>
      !['Dialpad', 'aircall', 'affectlayer', 'voice_connector',
        'Calendly', 'HelloSign', 'pandadoc', 'hndwrt', 'bbvideo',
        'DOZISF', 'HubSpot_Inc',
        'sf_devops', 'dlrs', 'Field_Trip', 'agrid', 'timeline', 'Illest',
        'sf_com_apps', 'sf_chttr_apps', 'sfadminapps', 'SIQCloud', 'ssot', 'cdpactvstrgptnr', 'datacloudflow'
      ].includes(p.namespace || '') && p.namespace
    ),
    unmanaged: packages.filter(p => !p.namespace),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Installed Packages</h1>
          <p className="text-gray-600 mt-1">
            {packages.length} packages installed in your org
          </p>
        </div>
        <button
          onClick={loadPackages}
          className="px-4 py-2 text-sm bg-sf-blue text-white rounded-lg hover:bg-sf-navy"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          Loading packages...
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Communication & CTI */}
          {categorizedPackages.communication.length > 0 && (
            <PackageCategory
              title="Communication & CTI"
              icon="📞"
              packages={categorizedPackages.communication}
            />
          )}

          {/* Productivity & Documents */}
          {categorizedPackages.productivity.length > 0 && (
            <PackageCategory
              title="Productivity & Documents"
              icon="📄"
              packages={categorizedPackages.productivity}
            />
          )}

          {/* Data Enrichment */}
          {categorizedPackages.dataEnrichment.length > 0 && (
            <PackageCategory
              title="Data Enrichment"
              icon="📊"
              packages={categorizedPackages.dataEnrichment}
            />
          )}

          {/* Development & Admin Tools */}
          {categorizedPackages.development.length > 0 && (
            <PackageCategory
              title="Development & Admin Tools"
              icon="🛠️"
              packages={categorizedPackages.development}
            />
          )}

          {/* Salesforce Platform */}
          {categorizedPackages.salesforce.length > 0 && (
            <PackageCategory
              title="Salesforce Platform"
              icon="☁️"
              packages={categorizedPackages.salesforce}
            />
          )}

          {/* Other Managed Packages */}
          {categorizedPackages.other.length > 0 && (
            <PackageCategory
              title="Other Managed Packages"
              icon="📦"
              packages={categorizedPackages.other}
            />
          )}

          {/* Unmanaged Packages */}
          {categorizedPackages.unmanaged.length > 0 && (
            <PackageCategory
              title="Unmanaged Packages"
              icon="📁"
              packages={categorizedPackages.unmanaged}
            />
          )}
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900">About Managed Packages</h3>
        <p className="text-sm text-blue-700 mt-1">
          Managed packages are installed from AppExchange and their metadata (objects, fields, apex)
          is controlled by the package vendor. This means we cannot retrieve or modify their source code,
          but we can track dependencies and references to their components.
        </p>
      </div>
    </div>
  );
}

function PackageCategory({ title, icon, packages }: {
  title: string;
  icon: string;
  packages: Package[];
}) {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <span>{icon}</span>
          {title}
          <span className="text-sm font-normal text-gray-500">({packages.length})</span>
        </h2>
      </div>
      <div className="divide-y divide-gray-100">
        {packages.map((pkg) => (
          <div key={pkg.id} className="px-6 py-4 flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">{pkg.name}</div>
              <div className="text-sm text-gray-500 flex items-center gap-2">
                {pkg.namespace && (
                  <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-mono">
                    {pkg.namespace}
                  </span>
                )}
                <span>v{pkg.version}</span>
                {pkg.versionName && pkg.versionName !== pkg.name && (
                  <span className="text-gray-400">• {pkg.versionName}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {pkg.documentationUrl && (
                <a
                  href={pkg.documentationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-sf-blue hover:underline flex items-center gap-1"
                >
                  Docs
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
              {pkg.namespace && (
                <a
                  href={`https://appexchange.salesforce.com/appxSearchKeywordResults?keywords=${encodeURIComponent(pkg.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-500 hover:text-sf-blue"
                >
                  AppExchange
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

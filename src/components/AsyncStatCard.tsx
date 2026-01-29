'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

interface AsyncStatCardProps {
  label: string;
  href: string;
  apiEndpoint: string;
  countKey?: string;
  color?: 'blue' | 'purple' | 'orange';
}

export function AsyncStatCard({
  label,
  href,
  apiEndpoint,
  countKey = 'count',
  color = 'blue'
}: AsyncStatCardProps) {
  const [value, setValue] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch(apiEndpoint);
        const data = await res.json();
        // Handle different response formats
        if (countKey === 'packages') {
          setValue(data.packages?.length ?? 0);
        } else {
          setValue(data[countKey] ?? 0);
        }
      } catch {
        setValue(0);
      }
      setLoading(false);
    };
    fetchCount();
  }, [apiEndpoint, countKey]);

  const borderColors = {
    blue: 'border-l-acs-blue',
    purple: 'border-l-purple-500',
    orange: 'border-l-orange-500',
  };

  return (
    <Link href={href}>
      <div
        className={`bg-white rounded shadow p-3 hover:shadow-md transition-shadow ${borderColors[color]}`}
        style={{ borderLeftWidth: '3px' }}
      >
        <div className="text-xl font-bold text-acs-navy">
          {loading ? (
            <span className="inline-block w-8 h-6 bg-gray-200 animate-pulse rounded" />
          ) : (
            value?.toLocaleString() ?? '0'
          )}
        </div>
        <div className="text-xs text-gray-500 truncate">{label}</div>
      </div>
    </Link>
  );
}

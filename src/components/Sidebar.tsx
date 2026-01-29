'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

interface NavGroup {
  name: string;
  icon: string;
  items: NavItem[];
  defaultOpen?: boolean;
  alwaysOpen?: boolean;
}

interface NavItem {
  name: string;
  href: string;
  icon: string;
}

const navGroups: NavGroup[] = [
  {
    name: 'Overview',
    icon: '🏠',
    defaultOpen: true,
    alwaysOpen: true,
    items: [
      { name: 'Home', href: '/', icon: '🏠' },
    ],
  },
  {
    name: 'Metadata',
    icon: '📦',
    defaultOpen: true,
    items: [
      { name: 'Objects', href: '/objects', icon: '📦' },
      { name: 'Custom Metadata', href: '/custom-metadata', icon: '⚙️' },
      { name: 'Permission Sets', href: '/permission-sets', icon: '🔐' },
      { name: 'Profiles', href: '/profiles', icon: '👤' },
      { name: 'Packages', href: '/packages', icon: '🧩' },
    ],
  },
  {
    name: 'Automation',
    icon: '⚡',
    defaultOpen: true,
    items: [
      { name: 'Flows', href: '/flows', icon: '⚡' },
      { name: 'Process Builders', href: '/process-builders', icon: '🔄' },
      { name: 'Workflow Rules', href: '/workflows', icon: '📋' },
    ],
  },
  {
    name: 'Apex',
    icon: '💻',
    defaultOpen: true,
    items: [
      { name: 'Triggers', href: '/triggers', icon: '🎯' },
      { name: 'Apex Classes', href: '/apex', icon: '💻' },
      { name: 'LWCs', href: '/lwc', icon: '⚛️' },
    ],
  },
  {
    name: 'Tools',
    icon: '🔧',
    defaultOpen: true,
    items: [
      { name: 'Graph View', href: '/graph', icon: '🔗' },
      { name: 'Export Data', href: '/export', icon: '📤' },
      { name: 'Health Check', href: '/health', icon: '🩺' },
      { name: 'Impact Analysis', href: '/analysis/impact', icon: '🔍' },
      { name: 'Documentation', href: '/docs/generate', icon: '📝' },
      { name: 'Field Usage', href: '/tools/field-usage', icon: '📊' },
      { name: 'Technical Debt', href: '/technical-debt', icon: '⚠️' },
      { name: 'Retirement', href: '/retirement', icon: '🗑️' },
    ],
  },
  {
    name: 'Planning',
    icon: '📋',
    defaultOpen: false,
    items: [
      { name: 'Plans', href: '/plans', icon: '📋' },
      { name: 'Artifacts', href: '/artifacts', icon: '📄' },
      { name: 'Context', href: '/context', icon: '👥' },
    ],
  },
  {
    name: 'Admin',
    icon: '⚙️',
    defaultOpen: true,
    items: [
      { name: 'Clients', href: '/admin/clients', icon: '🏢' },
      { name: 'Settings', href: '/settings', icon: '⚙️' },
    ],
  },
];

// Scale of Justice SVG matching the Advocate Cloud Solutions logo
function ScaleOfJusticeLogo() {
  return (
    <svg viewBox="0 0 100 100" className="w-12 h-12">
      {/* Outer circle */}
      <circle cx="50" cy="50" r="48" fill="none" stroke="#004bac" strokeWidth="3"/>
      {/* Inner circle */}
      <circle cx="50" cy="50" r="44" fill="none" stroke="#6B7B8A" strokeWidth="1"/>

      {/* Background split - blue left, gray right */}
      <path d="M50 6 A44 44 0 0 0 50 94 Z" fill="#004bac"/>
      <path d="M50 6 A44 44 0 0 1 50 94 Z" fill="#C0C0C0"/>

      {/* Scale post */}
      <rect x="47" y="25" width="6" height="55" fill="#6B7B8A"/>

      {/* Scale beam */}
      <rect x="20" y="28" width="60" height="4" fill="#6B7B8A"/>

      {/* Left scale pan */}
      <path d="M20 32 L15 50 L25 50 Z" fill="#6B7B8A"/>
      <ellipse cx="20" cy="52" rx="12" ry="4" fill="#6B7B8A"/>

      {/* Right scale pan */}
      <path d="M80 32 L75 50 L85 50 Z" fill="#6B7B8A"/>
      <ellipse cx="80" cy="52" rx="12" ry="4" fill="#6B7B8A"/>

      {/* Base */}
      <path d="M35 80 L50 65 L65 80 Z" fill="#6B7B8A"/>
      <rect x="30" y="80" width="40" height="6" fill="#6B7B8A"/>
    </svg>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(
    navGroups.reduce((acc, group) => {
      acc[group.name] = group.defaultOpen ?? false;
      return acc;
    }, {} as Record<string, boolean>)
  );

  const toggleGroup = (name: string) => {
    setOpenGroups(prev => ({ ...prev, [name]: !prev[name] }));
  };

  return (
    <div className="fixed inset-y-0 left-0 w-64 bg-acs-navy text-white flex flex-col">
      {/* Brand Header */}
      <div className="p-4 flex-shrink-0 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <ScaleOfJusticeLogo />
          <div>
            <h1 className="text-lg font-bold text-acs-blue tracking-wide" style={{ fontFamily: 'Georgia, serif' }}>
              ADVOCATE
            </h1>
            <h2 className="text-sm text-acs-gray tracking-wide" style={{ fontFamily: 'Georgia, serif' }}>
              CLOUD SOLUTIONS
            </h2>
          </div>
        </div>
        <p className="text-[10px] text-gray-400 mt-2 uppercase tracking-widest">
          Supercharging Legal Efficiency
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto pb-20 mt-2">
        {navGroups.map((group) => {
          const isOpen = group.alwaysOpen || openGroups[group.name];

          return (
            <div key={group.name} className="mb-1">
              {/* Group header */}
              {group.alwaysOpen ? (
                <div className="px-6 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {group.name}
                </div>
              ) : (
                <button
                  onClick={() => toggleGroup(group.name)}
                  className="w-full flex items-center justify-between px-6 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-200"
                >
                  <span>{group.name}</span>
                  <svg
                    className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}

              {/* Group items */}
              {isOpen && (
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = item.href === '/'
                      ? pathname === '/'
                      : pathname.startsWith(item.href);

                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center px-6 py-2 text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-acs-blue text-white'
                            : 'text-gray-300 hover:bg-acs-blue/20 hover:text-white'
                        }`}
                      >
                        <span className="mr-3 text-base">{item.icon}</span>
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="flex-shrink-0 p-4 text-xs text-gray-400 border-t border-gray-700">
        <p className="font-semibold text-acs-light">Metadata Intelligence</p>
        <p className="mt-1 text-[10px]">advocatecloudsolutions.com</p>
      </div>
    </div>
  );
}

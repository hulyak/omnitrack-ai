'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊' },
  { name: 'Scenarios', href: '/scenarios', icon: '🎯' },
  { name: 'Marketplace', href: '/marketplace', icon: '🏪' },
  { name: 'Sustainability', href: '/sustainability', icon: '🌱' },
  { name: 'Analytics', href: '/analytics', icon: '📈' },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-border bg-white dark:border-zinc-700 dark:bg-zinc-800">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex items-center gap-8">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 py-2">
            <img 
              src="/omnitrack-logo-horizontal.svg" 
              alt="OmniTrack AI" 
              className="h-10 w-auto"
            />
          </Link>

          {/* Navigation Items */}
          <div className="flex space-x-8 overflow-x-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-info text-info'
                      : 'border-transparent text-text-secondary hover:border-zinc-300 hover:text-text-primary dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-300'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}

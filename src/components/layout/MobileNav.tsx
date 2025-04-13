'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname();

  if (!isOpen) return null;

  return (
    <div className="md:hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-gray-600 bg-opacity-75"
        onClick={onClose}
      />

      {/* Navigation panel */}
      <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-white shadow-xl">
        <div className="h-full flex flex-col">
          {/* Close button */}
          <div className="px-4 pt-5 pb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Menu</h2>
            <button
              type="button"
              className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              onClick={onClose}
            >
              <span className="sr-only">Close menu</span>
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Navigation links */}
          <div className="flex-1 px-4 py-6">
            <nav className="space-y-4">
              <Link
                href="/news"
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  pathname === '/news'
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-900 hover:bg-gray-50'
                }`}
                onClick={onClose}
              >
                News
              </Link>
              <Link
                href="/products"
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  pathname === '/products'
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-900 hover:bg-gray-50'
                }`}
                onClick={onClose}
              >
                Products
              </Link>
              <Link
                href="/alerts"
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  pathname === '/alerts'
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-900 hover:bg-gray-50'
                }`}
                onClick={onClose}
              >
                Price Alerts
              </Link>
              <Link
                href="/profile"
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  pathname === '/profile'
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-900 hover:bg-gray-50'
                }`}
                onClick={onClose}
              >
                Profile
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
} 
import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

export function StatCard({ title, value, description, trend, trendValue }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
      <div className="flex flex-col">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {title}
        </h3>
        <div className="mt-1 flex items-baseline">
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">
            {value}
          </p>
          {trendValue && trend && (
            <span className={`ml-2 text-sm font-medium ${
              trend === 'up' ? 'text-green-600 dark:text-green-500' :
              trend === 'down' ? 'text-red-600 dark:text-red-500' :
              'text-gray-500 dark:text-gray-400'
            }`}>
              {trendValue}
            </span>
          )}
        </div>
        {description && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        )}
      </div>
    </div>
  );
} 
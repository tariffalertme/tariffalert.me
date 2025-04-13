'use client';

import React from 'react';
import { formatDate } from '../../lib/utils/formatters';

interface ChartControlsProps {
  onTimeRangeChange: (days: number) => void;
  onExportData: () => void;
  onRetailerToggle: (retailer: string) => void;
  selectedRetailers: string[];
  availableRetailers: string[];
  selectedDays: number;
  startDate?: Date;
  endDate?: Date;
  onDateRangeChange?: (start: Date, end: Date) => void;
  isLoading?: boolean;
}

const TIME_RANGES = [
  { label: '7 Days', value: 7 },
  { label: '30 Days', value: 30 },
  { label: '90 Days', value: 90 },
  { label: '1 Year', value: 365 }
];

export function ChartControls({
  onTimeRangeChange,
  onExportData,
  onRetailerToggle,
  selectedRetailers,
  availableRetailers,
  selectedDays,
  startDate,
  endDate,
  onDateRangeChange,
  isLoading = false
}: ChartControlsProps) {
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onDateRangeChange && endDate) {
      onDateRangeChange(new Date(e.target.value), endDate);
    }
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onDateRangeChange && startDate) {
      onDateRangeChange(startDate, new Date(e.target.value));
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow space-y-4">
      {/* Time Range Controls */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Time Range</h3>
        <div className="flex flex-wrap gap-2">
          {TIME_RANGES.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => onTimeRangeChange(value)}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                selectedDays === value
                  ? 'bg-indigo-100 text-indigo-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              disabled={isLoading}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Date Range */}
      {onDateRangeChange && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="start-date" className="block text-sm font-medium text-gray-700">
              Start Date
            </label>
            <input
              type="date"
              id="start-date"
              value={startDate ? formatDate(startDate, 'yyyy-MM-dd') : ''}
              onChange={handleStartDateChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              disabled={isLoading}
            />
          </div>
          <div>
            <label htmlFor="end-date" className="block text-sm font-medium text-gray-700">
              End Date
            </label>
            <input
              type="date"
              id="end-date"
              value={endDate ? formatDate(endDate, 'yyyy-MM-dd') : ''}
              onChange={handleEndDateChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              disabled={isLoading}
            />
          </div>
        </div>
      )}

      {/* Retailer Filters */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Retailers</h3>
        <div className="flex flex-wrap gap-2">
          {availableRetailers.map(retailer => (
            <button
              key={retailer}
              onClick={() => onRetailerToggle(retailer)}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                selectedRetailers.includes(retailer)
                  ? 'bg-indigo-100 text-indigo-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              disabled={isLoading}
            >
              {retailer}
            </button>
          ))}
        </div>
      </div>

      {/* Export Button */}
      <div>
        <button
          onClick={onExportData}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Export Data'}
        </button>
      </div>
    </div>
  );
} 
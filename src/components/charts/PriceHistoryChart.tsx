'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useSupabase } from '../../lib/supabase/client';
import { PriceHistoryService } from '../../lib/services/PriceHistoryService';
import { formatCurrency, formatDate } from '../../lib/utils/formatters';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface PriceHistoryChartProps {
  productId: string;
  title?: string;
  height?: number;
  days?: number;
}

interface PricePoint {
  date: Date;
  price: number;
  currency: string;
  retailer: string;
}

const CHART_COLORS = {
  amazon: 'rgb(255, 153, 0)',
  walmart: 'rgb(0, 113, 235)',
  target: 'rgb(204, 0, 0)',
  bestbuy: 'rgb(0, 70, 190)',
  default: 'rgb(107, 114, 128)'
};

export function PriceHistoryChart({
  productId,
  title = 'Price History',
  height = 300,
  days = 30
}: PriceHistoryChartProps) {
  const { supabase } = useSupabase();
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRetailers, setSelectedRetailers] = useState<string[]>([]);
  const chartRef = useRef<ChartJS<'line'>>(null);

  useEffect(() => {
    const loadPriceHistory = async () => {
      try {
        const priceHistoryService = new PriceHistoryService(supabase);
        const history = await priceHistoryService.getPriceHistory(productId, { days });
        setPriceHistory(history);
        
        // Initialize selected retailers with all available retailers
        const retailers = Array.from(new Set(history.map(point => point.retailer)));
        setSelectedRetailers(retailers);
      } catch (err) {
        console.error('Error loading price history:', err);
        setError('Failed to load price history');
      } finally {
        setIsLoading(false);
      }
    };

    loadPriceHistory();
  }, [supabase, productId, days]);

  const toggleRetailer = (retailer: string) => {
    setSelectedRetailers(prev =>
      prev.includes(retailer)
        ? prev.filter(r => r !== retailer)
        : [...prev, retailer]
    );
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-[300px] bg-gray-100 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
      </div>
    );
  }

  const retailers = Array.from(new Set(priceHistory.map(point => point.retailer)));
  const dates = Array.from(
    new Set(priceHistory.map(point => formatDate(point.date)))
  ).sort();

  const datasets = retailers
    .filter(retailer => selectedRetailers.includes(retailer))
    .map(retailer => {
      const retailerData = dates.map(date => {
        const point = priceHistory.find(
          p => formatDate(p.date) === date && p.retailer === retailer
        );
        return point ? point.price : null;
      });

      return {
        label: retailer,
        data: retailerData,
        borderColor: CHART_COLORS[retailer as keyof typeof CHART_COLORS] || CHART_COLORS.default,
        backgroundColor: CHART_COLORS[retailer as keyof typeof CHART_COLORS] || CHART_COLORS.default,
        fill: false,
        tension: 0.1,
      };
    });

  const chartData: ChartData<'line'> = {
    labels: dates,
    datasets,
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        onClick: (_, legendItem) => {
          toggleRetailer(legendItem.text);
        },
      },
      title: {
        display: true,
        text: title,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed.y;
            if (value !== null) {
              return `${context.dataset.label}: ${formatCurrency(value)}`;
            }
            return '';
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          callback: (value) => formatCurrency(value as number),
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {retailers.map(retailer => (
          <button
            key={retailer}
            onClick={() => toggleRetailer(retailer)}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              selectedRetailers.includes(retailer)
                ? 'bg-indigo-100 text-indigo-800'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {retailer}
          </button>
        ))}
      </div>
      <div style={{ height }}>
        <Line ref={chartRef} data={chartData} options={options} />
      </div>
    </div>
  );
} 
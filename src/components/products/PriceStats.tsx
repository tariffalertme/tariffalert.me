'use client';

import React, { useEffect, useState } from 'react';
import { useSupabase } from '../../lib/supabase/client';
import { PriceHistoryService } from '../../lib/services/PriceHistoryService';
import { StatCard } from '../stats/StatCard';
import { formatCurrency } from '../../lib/utils/formatters';

interface PriceStatsProps {
  productId: string;
  days?: number;
}

interface PriceStats {
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  priceChange: number;
  priceChangePercentage: number;
}

export function PriceStats({ productId, days = 30 }: PriceStatsProps) {
  const { supabase } = useSupabase();
  const [stats, setStats] = useState<PriceStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const priceHistoryService = new PriceHistoryService(supabase);
        const stats = await priceHistoryService.getPriceStatistics(productId, days);
        setStats(stats);
      } catch (err) {
        console.error('Error loading price statistics:', err);
        setError('Failed to load price statistics');
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, [supabase, productId, days]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-100 rounded-lg h-32"></div>
        ))}
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

  if (!stats) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700">
        No price statistics available
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Current Price"
        value={formatCurrency(stats.avgPrice)}
        description={`Average over last ${days} days`}
      />
      <StatCard
        title="Price Change"
        value={formatCurrency(stats.priceChange)}
        description={`${stats.priceChangePercentage.toFixed(1)}% change`}
        trend={stats.priceChange > 0 ? 'up' : stats.priceChange < 0 ? 'down' : 'neutral'}
        trendValue={`${Math.abs(stats.priceChangePercentage).toFixed(1)}%`}
      />
      <StatCard
        title="Lowest Price"
        value={formatCurrency(stats.minPrice)}
        description={`Best price in ${days} days`}
        trend="down"
      />
      <StatCard
        title="Highest Price"
        value={formatCurrency(stats.maxPrice)}
        description={`Peak price in ${days} days`}
        trend="up"
      />
    </div>
  );
} 
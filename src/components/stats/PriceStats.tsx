import React from 'react';
import { StatCard } from './StatCard';
import { formatCurrency, formatPercentage } from '../../lib/utils/formatters';

interface PriceStatsProps {
  currentPrice: number;
  highestPrice: number;
  lowestPrice: number;
  averagePrice: number;
  priceChange: number;
  priceChangePercentage: number;
}

export function PriceStats({
  currentPrice,
  highestPrice,
  lowestPrice,
  averagePrice,
  priceChange,
  priceChangePercentage
}: PriceStatsProps) {
  const trend = priceChange > 0 ? 'up' : priceChange < 0 ? 'down' : 'neutral';
  const trendValue = `${priceChange > 0 ? '+' : ''}${formatPercentage(priceChangePercentage)}`;

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Current Price"
        value={formatCurrency(currentPrice)}
        trend={trend}
        trendValue={trendValue}
      />
      <StatCard
        title="Highest Price"
        value={formatCurrency(highestPrice)}
        description="All-time high"
      />
      <StatCard
        title="Lowest Price"
        value={formatCurrency(lowestPrice)}
        description="All-time low"
      />
      <StatCard
        title="Average Price"
        value={formatCurrency(averagePrice)}
        description="30-day average"
      />
    </div>
  );
} 
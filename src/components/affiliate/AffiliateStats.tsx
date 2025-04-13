import React from 'react';
import { StatCard } from '../stats/StatCard';
import { formatCurrency, formatPercentage } from '../../lib/utils/formatters';

interface AffiliateStatsProps {
  clicks: number;
  conversions: number;
  revenue: number;
  conversionRate: number;
  averageOrderValue: number;
}

export function AffiliateStats({
  clicks,
  conversions,
  revenue,
  conversionRate,
  averageOrderValue
}: AffiliateStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
      <StatCard
        title="Total Clicks"
        value={clicks.toLocaleString()}
        description="Total affiliate link clicks"
      />
      <StatCard
        title="Conversions"
        value={conversions.toLocaleString()}
        description="Successful purchases"
      />
      <StatCard
        title="Revenue"
        value={formatCurrency(revenue)}
        description="Total affiliate revenue"
      />
      <StatCard
        title="Conversion Rate"
        value={formatPercentage(conversionRate)}
        description="Click to purchase rate"
      />
      <StatCard
        title="Average Order"
        value={formatCurrency(averageOrderValue)}
        description="Average order value"
      />
    </div>
  );
} 
import React, { useEffect, useState } from 'react';
import { PricePredictionService } from '@/lib/services/PricePredictionService';
import { supabase } from '@/lib/supabaseClient';
import { formatCurrency } from '@/lib/utils/formatters';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from '@heroicons/react/24/solid';

interface PricePredictionProps {
  productId: string;
}

interface PredictionData {
  predictedPrice: number;
  confidence: number;
  factors: {
    tariffImpact: number;
    seasonalTrend: number;
    marketTrend: number;
  };
}

interface RetailerData {
  retailer: string;
  currentPrice: number;
  historicalLow: number;
  historicalHigh: number;
  averagePrice: number;
  priceVolatility: number;
}

export function PricePrediction({ productId }: PricePredictionProps) {
  const [prediction, setPrediction] = useState<PredictionData | null>(null);
  const [retailers, setRetailers] = useState<RetailerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const predictionService = new PricePredictionService(supabase);

    async function loadPredictionData() {
      try {
        setLoading(true);
        setError(null);

        const [predictionData, retailerData] = await Promise.all([
          predictionService.getPricePrediction(productId),
          predictionService.getRetailerComparison(productId),
        ]);

        setPrediction(predictionData);
        setRetailers(retailerData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load prediction data');
      } finally {
        setLoading(false);
      }
    }

    loadPredictionData();
  }, [productId]);

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 70) return <Badge className="bg-green-500">High</Badge>;
    if (confidence >= 40) return <Badge className="bg-yellow-500">Medium</Badge>;
    return <Badge className="bg-red-500">Low</Badge>;
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <ArrowUpIcon className="w-4 h-4 text-red-500" />;
    if (trend < 0) return <ArrowDownIcon className="w-4 h-4 text-green-500" />;
    return <MinusIcon className="w-4 h-4 text-gray-500" />;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-red-50">
        <CardContent className="pt-6">
          <p className="text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!prediction || retailers.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-gray-500">No prediction data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Price Prediction</CardTitle>
          <CardDescription>
            Predicted price based on market trends and factors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium">Predicted Price</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">
                  {formatCurrency(prediction.predictedPrice)}
                </span>
                {getConfidenceBadge(prediction.confidence)}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span>Tariff Impact</span>
                  {getTrendIcon(prediction.factors.tariffImpact)}
                </div>
                <span className="text-lg font-medium">
                  {prediction.factors.tariffImpact.toFixed(1)}%
                </span>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span>Seasonal Trend</span>
                  {getTrendIcon(prediction.factors.seasonalTrend)}
                </div>
                <span className="text-lg font-medium">
                  {prediction.factors.seasonalTrend.toFixed(1)}%
                </span>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span>Market Trend</span>
                  {getTrendIcon(prediction.factors.marketTrend)}
                </div>
                <span className="text-lg font-medium">
                  {prediction.factors.marketTrend.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Retailer Comparison</CardTitle>
          <CardDescription>
            Compare prices across different retailers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Retailer</TableHead>
                <TableHead className="text-right">Current Price</TableHead>
                <TableHead className="text-right">Historical Low</TableHead>
                <TableHead className="text-right">Historical High</TableHead>
                <TableHead className="text-right">Average Price</TableHead>
                <TableHead className="text-right">Volatility</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {retailers.map((retailer) => (
                <TableRow key={retailer.retailer}>
                  <TableCell className="font-medium">{retailer.retailer}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(retailer.currentPrice)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(retailer.historicalLow)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(retailer.historicalHigh)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(retailer.averagePrice)}
                  </TableCell>
                  <TableCell className="text-right">
                    {retailer.priceVolatility.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 
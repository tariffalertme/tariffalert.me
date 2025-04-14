import React, { useEffect, useState, useMemo } from 'react';
import { ProductRecommendation } from '@/lib/services/ProductRecommendationService';
import { ProductRecommendationService } from '@/lib/services/ProductRecommendationService';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, MinusIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface ProductRecommendationsProps {
  productId?: string;
  category?: string;
  countryCode?: string;
}

export function ProductRecommendations({ productId, category, countryCode }: ProductRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<ProductRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const recommendationService = useMemo(() => new ProductRecommendationService(), []);

  useEffect(() => {
    async function loadRecommendations() {
      try {
        setLoading(true);
        setError(null);
        
        if (productId) {
          const recommendation = await recommendationService.generateRecommendations(productId, {
            userPreferences: {
              countryCode
            }
          });
          setRecommendations([recommendation]);
        } else if (category) {
          const personalizedRecs = await recommendationService.getPersonalizedRecommendations(
            'default',
            category
          );
          setRecommendations(personalizedRecs);
        }
      } catch (err) {
        setError('Failed to load recommendations');
        console.error('Error loading recommendations:', err);
      } finally {
        setLoading(false);
      }
    }

    loadRecommendations();
  }, [productId, category, countryCode, recommendationService]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-48 w-full bg-gray-100 animate-pulse rounded-lg" />
        <div className="h-48 w-full bg-gray-100 animate-pulse rounded-lg" />
        <div className="h-48 w-full bg-gray-100 animate-pulse rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500 bg-red-50 rounded-lg">
        <p>{error}</p>
      </div>
    );
  }

  if (!recommendations.length) {
    return (
      <div className="p-4 text-gray-500 bg-gray-50 rounded-lg">
        <p>No recommendations available at this time.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {recommendations.map((recommendation) => (
        <Card key={recommendation.productId}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Product Analysis</CardTitle>
              <Badge variant={recommendation.score > 0.7 ? 'secondary' : 'default'}>
                {Math.round(recommendation.score * 100)}% Match
              </Badge>
            </div>
            {recommendation.tags && recommendation.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {recommendation.tags.map((tag, index) => (
                  <Badge key={index} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            <p className="text-gray-600">{recommendation.reasoning}</p>

            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-medium mb-2">Price Analysis</h4>
              <div className="flex items-center space-x-2">
                {recommendation.priceAnalysis.trend === 'increasing' ? (
                  <ArrowTrendingUpIcon className="w-5 h-5 text-red-500" />
                ) : recommendation.priceAnalysis.trend === 'decreasing' ? (
                  <ArrowTrendingDownIcon className="w-5 h-5 text-green-500" />
                ) : (
                  <MinusIcon className="w-5 h-5 text-gray-500" />
                )}
                <span className="text-sm">
                  {recommendation.priceAnalysis.explanation}
                  {recommendation.priceAnalysis.confidence > 0.7 && (
                    <Badge variant="outline" className="ml-2">
                      High Confidence
                    </Badge>
                  )}
                </span>
              </div>
            </div>

            {recommendation.tariffAnalysis && (
              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-medium mb-2">Tariff Impact</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    {recommendation.tariffAnalysis.impactLevel === 'high' && (
                      <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
                    )}
                    <span className="text-sm">
                      Current Tariff Rate: {recommendation.tariffAnalysis.currentTariff}%
                      <Badge 
                        variant={
                          recommendation.tariffAnalysis.impactLevel === 'high' 
                            ? 'destructive' 
                            : recommendation.tariffAnalysis.impactLevel === 'medium'
                            ? 'secondary'
                            : 'default'
                        }
                        className="ml-2"
                      >
                        {recommendation.tariffAnalysis.impactLevel.toUpperCase()} IMPACT
                      </Badge>
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {recommendation.tariffAnalysis.predictedChanges}
                  </p>
                </div>
              </div>
            )}

            {recommendation.alternativeProducts.length > 0 && (
              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-medium mb-2">Alternative Products</h4>
                <div className="space-y-3">
                  {recommendation.alternativeProducts.map((alt) => (
                    <div key={alt.productId} className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600">{alt.reason}</p>
                        {alt.tariffImpact && (
                          <p className="text-xs text-gray-500">
                            Tariff difference: {alt.tariffImpact.difference > 0 ? '+' : ''}{alt.tariffImpact.difference}%
                            <span className="ml-1 text-gray-400">•</span>
                            <span className="ml-1">{alt.tariffImpact.recommendation}</span>
                          </p>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {alt.reason}
                      </div>
                      <a href={`/product/${alt.productId}`}>
                        <Button variant="outline" size="sm">
                          View Product
                        </Button>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 
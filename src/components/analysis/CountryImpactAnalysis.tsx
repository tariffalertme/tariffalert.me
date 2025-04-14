import React, { useEffect, useState, useMemo } from 'react';
import { CountryImpactService, ImpactAnalysis } from '@/lib/services/CountryImpactService';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

interface CountryImpactAnalysisProps {
  countryCode: string;
  timeframe?: {
    start: string;
    end: string;
  };
}

export function CountryImpactAnalysis({ 
  countryCode,
  timeframe = {
    start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year ago
    end: new Date().toISOString().split('T')[0] // today
  }
}: CountryImpactAnalysisProps) {
  const [analysis, setAnalysis] = useState<ImpactAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const impactService = useMemo(() => new CountryImpactService(), []);

  useEffect(() => {
    async function loadAnalysis() {
      try {
        setLoading(true);
        setError(null);
        const result = await impactService.generateCountryImpactAnalysis(countryCode, timeframe);
        setAnalysis(result);
      } catch (err) {
        setError('Failed to load country impact analysis');
        console.error('Error loading analysis:', err);
      } finally {
        setLoading(false);
      }
    }

    const fetchData = async () => {
      try {
        const data = await impactService.getCountryImpact(countryCode);
        setAnalysis(data);
      } catch (error) {
        console.error('Error fetching country impact data:', error);
      }
    };

    if (countryCode) {
      fetchData();
    }

    loadAnalysis();
  }, [countryCode, timeframe, impactService]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-48 w-full bg-gray-100 animate-pulse rounded-lg" />
        <div className="h-96 w-full bg-gray-100 animate-pulse rounded-lg" />
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

  if (!analysis) {
    return (
      <div className="p-4 text-gray-500 bg-gray-50 rounded-lg">
        <p>No analysis available for this country.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Impact Analysis Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">{analysis.summary}</p>
          <div className="flex flex-wrap gap-2">
            {analysis.keyFindings.map((finding, index) => (
              <Badge key={index} variant="outline">
                {finding}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Financial Impact</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-medium">Total Impact Value</span>
              <span className="text-2xl font-bold">
                ${Math.abs(analysis.financialImpact.totalValue).toLocaleString()}
                <span className="text-sm text-gray-500 ml-1">
                  {analysis.financialImpact.totalValue >= 0 ? 'positive' : 'negative'} impact
                </span>
              </span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analysis.financialImpact.breakdown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" name="Impact Value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historical Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analysis.visualizationData.timeSeriesData.labels.map((label, index) => ({
                name: label,
                ...analysis.visualizationData.timeSeriesData.datasets.reduce((acc, dataset) => ({
                  ...acc,
                  [dataset.label]: dataset.data[index]
                }), {})
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                {analysis.visualizationData.timeSeriesData.datasets.map((dataset, index) => (
                  <Line
                    key={dataset.label}
                    type="monotone"
                    dataKey={dataset.label}
                    stroke={index === 0 ? '#3b82f6' : '#ef4444'}
                    activeDot={{ r: 8 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Short-term Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2">
              {analysis.recommendations.shortTerm.map((rec, index) => (
                <li key={index} className="text-gray-600">{rec}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Long-term Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2">
              {analysis.recommendations.longTerm.map((rec, index) => (
                <li key={index} className="text-gray-600">{rec}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Related Countries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {analysis.relatedCountries.map((country) => (
              <div
                key={country.countryCode}
                className="p-4 rounded-lg border border-gray-200 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{country.countryCode}</span>
                  <Badge variant={country.relationshipType === 'competitor' ? 'destructive' : 'secondary'}>
                    {country.relationshipType.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Impact Correlation: {(country.impactCorrelation * 100).toFixed(1)}%
                </div>
                <a href={`/analysis/country/${country.countryCode}`}>
                  <Button variant="outline" size="sm" className="w-full">
                    View Analysis
                  </Button>
                </a>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
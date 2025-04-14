import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import type { CountryImpactAnalysis } from '@/lib/services/CountryImpactService';

interface CountryImpactAnalysisProps {
  analysis: CountryImpactAnalysis;
  isLoading?: boolean;
}

export function CountryImpactAnalysis({ analysis, isLoading }: CountryImpactAnalysisProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const tradeData = [
    {
      name: 'Imports',
      value: analysis.tradeStatistics.imports
    },
    {
      name: 'Exports',
      value: analysis.tradeStatistics.exports
    }
  ];

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle>Country Impact Analysis</CardTitle>
          <CardDescription>
            Analysis for {analysis.countryCode} - Period: {analysis.tradeStatistics.period}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Impact Score</h4>
              <Progress value={analysis.impactScore} className="w-full" />
              <p className="text-sm text-muted-foreground mt-1">
                Score: {analysis.impactScore.toFixed(1)}/100
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trade Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Trade Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[300px]">
            <LineChart
              width={600}
              height={300}
              data={tradeData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#8884d8" />
            </LineChart>
          </div>
          <div className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Metric</TableHead>
                  <TableHead>Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Imports</TableCell>
                  <TableCell>{analysis.tradeStatistics.imports.toLocaleString()}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Exports</TableCell>
                  <TableCell>{analysis.tradeStatistics.exports.toLocaleString()}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Average Tariff Rate</TableCell>
                  <TableCell>{analysis.tradeStatistics.averageTariffRate}%</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Tariff Changes */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Tariff Changes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Previous Rate</TableHead>
                <TableHead>New Rate</TableHead>
                <TableHead>Change</TableHead>
                <TableHead>Effective Date</TableHead>
                <TableHead>Affected Categories</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analysis.tariffChanges.map((change, index) => (
                <TableRow key={index}>
                  <TableCell>{change.previousRate}%</TableCell>
                  <TableCell>{change.newRate}%</TableCell>
                  <TableCell>
                    <Badge variant={change.newRate > change.previousRate ? 'destructive' : 'default'}>
                      {((change.newRate - change.previousRate) * 100).toFixed(1)}%
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(change.effectiveDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {change.affectedCategories.map((category, i) => (
                        <Badge key={i} variant="outline">{category}</Badge>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Consumer Segments */}
      <Card>
        <CardHeader>
          <CardTitle>Consumer Segments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {analysis.consumerSegments.map((segment, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{segment.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">{segment.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {segment.affectedCategories.map((category, i) => (
                      <Badge key={i} variant="secondary">{category}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Country Relationships */}
      <Card>
        <CardHeader>
          <CardTitle>Country Relationships</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Country</TableHead>
                <TableHead>Relationship Type</TableHead>
                <TableHead>Impact Correlation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analysis.relationships.map((relationship, index) => (
                <TableRow key={index}>
                  <TableCell>
                    {relationship.targetCountry === analysis.countryCode
                      ? relationship.sourceCountry
                      : relationship.targetCountry}
                  </TableCell>
                  <TableCell>
                    <Badge variant={relationship.relationshipType === 'competitor' ? 'destructive' : 'default'}>
                      {relationship.relationshipType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Progress value={relationship.impactCorrelation * 100} className="w-full" />
                    <span className="text-sm text-muted-foreground">
                      {(relationship.impactCorrelation * 100).toFixed(1)}%
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {analysis.recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>{recommendation}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
} 
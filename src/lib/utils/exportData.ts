import { formatDate, formatCurrency } from './formatters';

interface PriceHistoryData {
  date: Date;
  price: number;
  currency: string;
  retailer: string;
}

interface ExportOptions {
  format: 'csv' | 'json' | 'xlsx';
  filename?: string;
}

/**
 * Convert price history data to CSV format
 */
function toCSV(data: PriceHistoryData[]): string {
  const headers = ['Date', 'Price', 'Currency', 'Retailer'];
  const rows = data.map(item => [
    formatDate(item.date),
    item.price.toString(),
    item.currency,
    item.retailer
  ]);

  return [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
}

/**
 * Convert price history data to JSON format
 */
function toJSON(data: PriceHistoryData[]): string {
  return JSON.stringify(
    data.map(item => ({
      ...item,
      date: formatDate(item.date),
      price: formatCurrency(item.price, item.currency)
    })),
    null,
    2
  );
}

/**
 * Export price history data in the specified format
 */
export function exportPriceHistory(
  data: PriceHistoryData[],
  options: ExportOptions = { format: 'csv' }
): void {
  const { format, filename = `price-history-${formatDate(new Date())}` } = options;
  let content: string;
  let mimeType: string;
  let extension: string;

  switch (format) {
    case 'json':
      content = toJSON(data);
      mimeType = 'application/json';
      extension = 'json';
      break;
    case 'csv':
    default:
      content = toCSV(data);
      mimeType = 'text/csv';
      extension = 'csv';
      break;
  }

  // Create a blob with the data
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);

  // Create a temporary link and trigger the download
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.${extension}`;
  document.body.appendChild(link);
  link.click();

  // Clean up
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
} 
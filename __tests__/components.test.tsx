import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import SparklineChart from '../components/ui/SparklineChart'
import CountryWatch from '../components/features/CountryWatch'
import ProductGrid from '../components/features/ProductGrid'
import type { Product, RateHistoryPoint } from '../lib/sanity/queries'
import { act } from 'react-dom/test-utils'

// Mock recharts for JSDOM
jest.mock('recharts', () => {
  const Original = jest.requireActual('recharts');
  return {
    ...Original,
    ResponsiveContainer: ({ children }: any) => <svg data-testid="mock-svg">{children}</svg>,
    LineChart: ({ children }: any) => <g>{children}</g>,
    Line: () => <line />,
    XAxis: () => <g />,
    YAxis: () => <g />,
    Tooltip: () => <g />,
    CartesianGrid: () => <g />,
  };
});

// Polyfill ResizeObserver for Jest
if (typeof window !== 'undefined' && !window.ResizeObserver) {
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

const mockProduct: Product = {
  _id: 'test-id',
  name: 'Test Product',
  slug: { current: 'test-product' },
  description: 'Test description',
  image: { asset: { url: 'test-image.jpg' } },
  category: { _id: 'cat1', name: 'Test Category' },
  impactScore: 5,
  dateAdded: '2024-03-20',
  tags: [{
    _id: 'tag1',
    name: 'Wireless',
    type: 'tag'
  }],
  currentPrice: 99.99,
  affiliateUrl: 'https://example.com',
  relatedTariffUpdates: [{
    _id: 'tariff1',
    effectiveDate: '2024-06-01',
    newRate: 10,
    country: {
      name: 'United States',
      code: 'US'
    },
    history: []
  }],
  priceHistory: []
}

describe('SparklineChart', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <div style={{ width: 200, height: 50 }}>
        <SparklineChart data={[{ date: '2024-03-20', rate: 5 }]} />
      </div>
    )
    expect(screen.getByTestId('mock-svg')).toBeInTheDocument()
  })

  it('shows no data message when empty', () => {
    const { container } = render(<SparklineChart data={[]} />)
    expect(screen.getByText(/No data available/i)).toBeInTheDocument()
  })

  it('renders chart with data', () => {
    const data: RateHistoryPoint[] = [
      { _key: '1', date: '2024-01-01', rate: 4 },
      { _key: '2', date: '2024-02-01', rate: 5 },
      { _key: '3', date: '2024-03-01', rate: 6 }
    ]
    const { container } = render(
      <div style={{ width: 200, height: 50 }}>
        <SparklineChart data={data} width={200} height={50} />
      </div>
    )
    const canvas = screen.getByTestId('mock-svg')
    expect(canvas).toBeInTheDocument()
  })
})

describe('CountryWatch', () => {
  it('renders subscribe button when not watching', () => {
    const mockSubscribe = jest.fn().mockImplementation(async () => Promise.resolve())
    render(
      <CountryWatch 
        countryCode="US"
        countryName="United States"
        onSubscribe={mockSubscribe}
      />
    )
    expect(screen.getByRole('button')).toBeInTheDocument()
    expect(screen.getByText(/Watch United States/i)).toBeInTheDocument()
  })

  it('handles email subscription', async () => {
    const mockSubscribe = jest.fn().mockImplementation(async () => Promise.resolve())
    render(
      <CountryWatch 
        countryCode="US"
        countryName="United States"
        onSubscribe={mockSubscribe}
      />
    )
    // Click the bell icon to show email input
    await act(async () => {
      fireEvent.click(screen.getByRole('button'))
    })
    // Now the email input should be visible
    const input = screen.getByPlaceholderText(/Enter your email/i)
    const subscribeButton = screen.getByRole('button', { name: /Subscribe/i })
    await act(async () => {
      fireEvent.change(input, { target: { value: 'test@example.com' } })
      await fireEvent.click(subscribeButton)
    })
    expect(mockSubscribe).toHaveBeenCalledWith('test@example.com')
  })
})

describe('ProductGrid', () => {
  it('renders products correctly', () => {
    const mockProducts: Product[] = [{
      _id: '1',
      name: 'Test Product',
      slug: { current: 'test-product' },
      description: 'A test product',
      image: {
        asset: { url: 'https://example.com/image.jpg' }
      },
      category: {
        _id: 'cat1',
        name: 'Electronics'
      },
      impactScore: 7,
      dateAdded: '2024-01-01',
      tags: [{
        _id: 'tag1',
        name: 'Wireless',
        type: 'tag'
      }],
      currentPrice: 99.99,
      affiliateUrl: 'https://example.com/product',
      relatedTariffUpdates: [{
        _id: 'tariff1',
        effectiveDate: '2024-06-01',
        newRate: 10,
        country: {
          name: 'United States',
          code: 'US'
        },
        history: []
      }],
      priceHistory: []
    }]

    render(<ProductGrid products={mockProducts} />)
    expect(screen.getByText('Test Product')).toBeInTheDocument()
  })

  it('filters by search', () => {
    render(<ProductGrid products={[mockProduct]} />)
    const searchInput = screen.getByPlaceholderText(/Search products/i)
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } })
    expect(screen.queryByText('Test Product')).not.toBeInTheDocument()
  })
}) 
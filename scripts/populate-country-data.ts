import { createClient } from '@supabase/supabase-js';
import { config } from '../src/lib/config';
import { Logger } from '../src/lib/utils/logger';
import { CountryDataService, Country, TradeStatistics, TariffChange, ConsumerSegment, CountryRelationship } from '../src/lib/services/CountryDataService';

const logger = new Logger('populate-country-data');

// Sample data for initial population
const countries: Country[] = [
  { code: 'US', name: 'United States', region: 'North America' },
  { code: 'CN', name: 'China', region: 'Asia' },
  { code: 'DE', name: 'Germany', region: 'Europe' },
  { code: 'JP', name: 'Japan', region: 'Asia' },
  { code: 'UK', name: 'United Kingdom', region: 'Europe' },
];

const tradeStatistics: TradeStatistics[] = [
  {
    country_code: 'US',
    period: '2024-Q1',
    imports: 800000000000,
    exports: 600000000000,
    avg_tariff_rate: 3.4,
  },
  {
    country_code: 'CN',
    period: '2024-Q1',
    imports: 500000000000,
    exports: 700000000000,
    avg_tariff_rate: 7.2,
  },
];

const tariffChanges: TariffChange[] = [
  {
    country_code: 'US',
    old_rate: 2.5,
    new_rate: 3.4,
    effective_date: new Date('2024-01-01'),
    category: 'Electronics',
    impact_description: 'Increased tariffs on electronic components',
  },
  {
    country_code: 'CN',
    old_rate: 6.8,
    new_rate: 7.2,
    effective_date: new Date('2024-01-15'),
    category: 'Consumer Goods',
    impact_description: 'Higher duties on imported consumer products',
  },
];

const consumerSegments: ConsumerSegment[] = [
  {
    country_code: 'US',
    name: 'High-Tech Early Adopters',
    description: 'Consumers who quickly adopt new technology products',
    size_percentage: 15.5,
  },
  {
    country_code: 'CN',
    name: 'Urban Middle Class',
    description: 'Growing middle-class consumers in urban areas',
    size_percentage: 35.0,
  },
];

const relationships: CountryRelationship[] = [
  {
    country_code_1: 'US',
    country_code_2: 'CN',
    relationship_type: 'competitor',
    impact_correlation: 0.85,
  },
  {
    country_code_1: 'DE',
    country_code_2: 'US',
    relationship_type: 'trading_partner',
    impact_correlation: 0.72,
  },
];

async function populateCountryData() {
  try {
    const countryService = CountryDataService.getInstance();

    logger.info('Starting country data population...');

    // Populate countries
    for (const country of countries) {
      await countryService.upsertCountry(country);
      logger.info(`Populated country: ${country.code}`);
    }

    // Populate trade statistics
    for (const stats of tradeStatistics) {
      await countryService.updateTradeStatistics(stats);
      logger.info(`Populated trade statistics for: ${stats.country_code}`);
    }

    // Record tariff changes
    for (const change of tariffChanges) {
      await countryService.recordTariffChange(change);
      logger.info(`Recorded tariff change for: ${change.country_code}`);
    }

    // Populate consumer segments
    for (const segment of consumerSegments) {
      await countryService.upsertConsumerSegment(segment);
      logger.info(`Populated consumer segment for: ${segment.country_code}`);
    }

    // Populate country relationships
    for (const relationship of relationships) {
      await countryService.upsertCountryRelationship(relationship);
      logger.info(`Populated relationship: ${relationship.country_code_1} -> ${relationship.country_code_2}`);
    }

    logger.info('Country data population completed successfully');
  } catch (error) {
    logger.error('Failed to populate country data:', { error });
    throw error;
  }
}

// Execute the population script
populateCountryData().catch((error) => {
  logger.error('Script failed:', error);
  process.exit(1);
});
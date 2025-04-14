import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config';
import { Logger } from '@/lib/utils/logger';
import { CountryDataService, Country, TradeStatistics, TariffChange, ConsumerSegment, CountryRelationship } from '@/lib/services/CountryDataService';

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
    countryCode: 'US',
    period: '2024-Q1',
    imports: 800000000000,
    exports: 600000000000,
    averageTariffRate: 3.4,
  },
  {
    countryCode: 'CN',
    period: '2024-Q1',
    imports: 500000000000,
    exports: 700000000000,
    averageTariffRate: 7.2,
  },
];

const tariffChanges: TariffChange[] = [
  {
    countryCode: 'US',
    previousRate: 2.5,
    newRate: 3.4,
    effectiveDate: '2024-01-01',
    affectedCategories: ['Electronics', 'Automotive'],
  },
  {
    countryCode: 'CN',
    previousRate: 6.8,
    newRate: 7.2,
    effectiveDate: '2024-01-15',
    affectedCategories: ['Consumer Goods', 'Industrial Equipment'],
  },
];

const consumerSegments: ConsumerSegment[] = [
  {
    countryCode: 'US',
    name: 'High-Tech Early Adopters',
    description: 'Consumers who quickly adopt new technology products',
    affectedCategories: ['Electronics', 'Smart Home', 'Wearables'],
  },
  {
    countryCode: 'CN',
    name: 'Urban Middle Class',
    description: 'Growing middle-class consumers in urban areas',
    affectedCategories: ['Luxury Goods', 'Electronics', 'Fashion'],
  },
];

const relationships: CountryRelationship[] = [
  {
    sourceCountry: 'US',
    targetCountry: 'CN',
    relationshipType: 'competitor',
    impactCorrelation: 0.85,
  },
  {
    sourceCountry: 'DE',
    targetCountry: 'US',
    relationshipType: 'trading_partner',
    impactCorrelation: 0.72,
  },
];

async function populateCountryData() {
  try {
    const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);
    const countryService = new CountryDataService(supabase);

    logger.info('Starting country data population...');

    // Populate countries
    for (const country of countries) {
      await countryService.upsertCountry(country);
      logger.info(`Populated country: ${country.code}`);
    }

    // Populate trade statistics
    for (const stats of tradeStatistics) {
      await countryService.updateTradeStatistics(stats);
      logger.info(`Populated trade statistics for: ${stats.countryCode}`);
    }

    // Record tariff changes
    for (const change of tariffChanges) {
      await countryService.recordTariffChange(change);
      logger.info(`Recorded tariff change for: ${change.countryCode}`);
    }

    // Populate consumer segments
    for (const segment of consumerSegments) {
      await countryService.upsertConsumerSegment(segment);
      logger.info(`Populated consumer segment for: ${segment.countryCode}`);
    }

    // Populate country relationships
    for (const relationship of relationships) {
      await countryService.upsertCountryRelationship(relationship);
      logger.info(`Populated relationship: ${relationship.sourceCountry} -> ${relationship.targetCountry}`);
    }

    logger.info('Country data population completed successfully');
  } catch (error) {
    logger.error('Failed to populate country data:', error);
    throw error;
  }
}

// Execute the population script
populateCountryData().catch((error) => {
  logger.error('Script failed:', error);
  process.exit(1);
}); 
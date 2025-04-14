import { NextResponse } from 'next/server';
import { ProductNormalizationService } from '@/lib/services/ProductNormalizationService';
import { AmazonApiClient } from '@/lib/api/AmazonApiClient';
import { WalmartApiClient } from '@/lib/api/WalmartApiClient';
import { Logger } from '@/lib/utils/logger';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize API clients
const logger = new Logger('PriceUpdateCron');

// Initialize API clients only if credentials are available
let amazonClient: AmazonApiClient | undefined;
let walmartClient: WalmartApiClient | undefined;

if (process.env.AMAZON_ACCESS_KEY && process.env.AMAZON_SECRET_KEY) {
  amazonClient = new AmazonApiClient({
    accessKey: process.env.AMAZON_ACCESS_KEY,
    secretKey: process.env.AMAZON_SECRET_KEY,
    associateTag: process.env.AMAZON_ASSOCIATE_TAG,
    apiKey: process.env.AMAZON_API_KEY,
    logger,
    auth: { type: 'none' }
  });
}

if (process.env.WALMART_API_KEY) {
  walmartClient = new WalmartApiClient({
    apiKey: process.env.WALMART_API_KEY,
    logger,
    auth: { type: 'none' }
  });
}

const normalizationService = new ProductNormalizationService(amazonClient, walmartClient);

export async function GET(request: Request) {
  try {
    // Get available platforms
    const availablePlatforms = normalizationService.getAvailablePlatforms();
    
    if (availablePlatforms.length === 0) {
      logger.info('No e-commerce platforms are configured. Skipping price updates.');
      return NextResponse.json({ 
        status: 'success',
        message: 'No platforms configured',
        updatedProducts: 0
      });
    }

    // Log which platforms are available
    logger.info('Running price updates for platforms:', { platforms: availablePlatforms });

    // Verify the request is from a trusted source
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET_KEY}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all tracked products from the database
    const { data: trackedProducts, error: fetchError } = await supabase
      .from('tracked_products')
      .select('*');

    if (fetchError) {
      logger.error('Failed to fetch tracked products', { error: fetchError });
      return NextResponse.json({ error: 'Failed to fetch tracked products' }, { status: 500 });
    }

    // Update prices for each product
    const updates = await Promise.allSettled(
      trackedProducts.map(async (product) => {
        try {
          const normalizedProduct = await normalizationService.getProductDetails(
            product.source as 'amazon' | 'walmart',
            product.product_id
          );

          if (!normalizedProduct) {
            logger.warn('Product not found', { productId: product.product_id });
            return null;
          }

          // Insert price history record
          const { error: insertError } = await supabase
            .from('price_history')
            .insert({
              product_id: product.product_id,
              price: normalizedProduct.price.amount,
              currency: normalizedProduct.price.currency,
              timestamp: new Date().toISOString()
            });

          if (insertError) {
            logger.error('Failed to insert price history', { error: insertError, productId: product.product_id });
            return null;
          }

          // Update product's current price
          const { error: updateError } = await supabase
            .from('tracked_products')
            .update({
              current_price: normalizedProduct.price.amount,
              last_updated: new Date().toISOString()
            })
            .eq('product_id', product.product_id);

          if (updateError) {
            logger.error('Failed to update product price', { error: updateError, productId: product.product_id });
            return null;
          }

          return {
            productId: product.product_id,
            newPrice: normalizedProduct.price.amount
          };
        } catch (error) {
          logger.error('Failed to process product', { error: String(error), productId: product.product_id });
          return null;
        }
      })
    );

    const successfulUpdates = updates.filter((result) => 
      result.status === 'fulfilled' && result.value !== null
    ).length;

    logger.info('Price update completed', {
      totalProducts: trackedProducts.length,
      successfulUpdates,
      failedUpdates: trackedProducts.length - successfulUpdates
    });

    return NextResponse.json({
      status: 'success',
      message: 'Price update completed',
      platforms: availablePlatforms,
      totalProducts: trackedProducts.length,
      successfulUpdates,
      failedUpdates: trackedProducts.length - successfulUpdates
    });
  } catch (error) {
    logger.error('Failed to update prices:', { error });
    return NextResponse.json({ 
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
} 
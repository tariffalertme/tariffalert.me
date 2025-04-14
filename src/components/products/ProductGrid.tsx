import { Product } from '@/types/database';
import { ProductCard } from './ProductCard';

interface ProductGridProps {
  products: Product[];
  onSaveProduct?: (productId: string) => void;
  savedProductIds?: Set<string>;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  onSaveProduct,
  savedProductIds = new Set(),
}) => {
  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">No products found</h3>
        <p className="mt-1 text-sm text-gray-500">
          Try adjusting your filters or search criteria
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onSaveClick={() => onSaveProduct?.(product.id)}
          isSaved={savedProductIds.has(product.id)}
        />
      ))}
    </div>
  );
}; 
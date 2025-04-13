import { useState } from 'react';

interface FilterPanelProps {
  categories: string[];
  countries: string[];
  selectedCategories: string[];
  selectedCountries: string[];
  priceRange: { min: number; max: number };
  impactLevels: ('high' | 'medium' | 'low')[];
  onCategoryChange: (categories: string[]) => void;
  onCountryChange: (countries: string[]) => void;
  onPriceRangeChange: (range: { min: number; max: number }) => void;
  onImpactLevelChange: (levels: ('high' | 'medium' | 'low')[]) => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  categories,
  countries,
  selectedCategories,
  selectedCountries,
  priceRange,
  impactLevels,
  onCategoryChange,
  onCountryChange,
  onPriceRangeChange,
  onImpactLevelChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Filters</h2>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden text-gray-500 hover:text-gray-700"
        >
          {isOpen ? 'Hide' : 'Show'} Filters
        </button>
      </div>

      <div className={`space-y-6 ${isOpen ? 'block' : 'hidden md:block'}`}>
        {/* Categories */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-2">Categories</h3>
          <div className="space-y-2">
            {categories.map((category) => (
              <label key={category} className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(category)}
                  onChange={(e) => {
                    const newCategories = e.target.checked
                      ? [...selectedCategories, category]
                      : selectedCategories.filter((c) => c !== category);
                    onCategoryChange(newCategories);
                  }}
                  className="h-4 w-4 text-primary rounded border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">{category}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Countries */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-2">Countries</h3>
          <div className="space-y-2">
            {countries.map((country) => (
              <label key={country} className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedCountries.includes(country)}
                  onChange={(e) => {
                    const newCountries = e.target.checked
                      ? [...selectedCountries, country]
                      : selectedCountries.filter((c) => c !== country);
                    onCountryChange(newCountries);
                  }}
                  className="h-4 w-4 text-primary rounded border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">{country}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-2">Price Range</h3>
          <div className="flex items-center space-x-4">
            <input
              type="number"
              value={priceRange.min}
              onChange={(e) =>
                onPriceRangeChange({ ...priceRange, min: Number(e.target.value) })
              }
              className="w-24 px-2 py-1 text-sm border rounded"
              placeholder="Min"
            />
            <span className="text-gray-500">to</span>
            <input
              type="number"
              value={priceRange.max}
              onChange={(e) =>
                onPriceRangeChange({ ...priceRange, max: Number(e.target.value) })
              }
              className="w-24 px-2 py-1 text-sm border rounded"
              placeholder="Max"
            />
          </div>
        </div>

        {/* Impact Levels */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-2">Tariff Impact</h3>
          <div className="space-y-2">
            {(['high', 'medium', 'low'] as const).map((level) => (
              <label key={level} className="flex items-center">
                <input
                  type="checkbox"
                  checked={impactLevels.includes(level)}
                  onChange={(e) => {
                    const newLevels = e.target.checked
                      ? [...impactLevels, level]
                      : impactLevels.filter((l) => l !== level);
                    onImpactLevelChange(newLevels);
                  }}
                  className="h-4 w-4 text-primary rounded border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700 capitalize">{level}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}; 
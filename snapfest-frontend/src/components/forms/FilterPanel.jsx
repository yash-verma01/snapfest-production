import React, { useState } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { packageCategories } from '../../data';

const FilterPanel = ({
  filters = {},
  onFilterChange,
  onClearFilters,
  isCollapsed = false,
  onToggleCollapse,
  className = ''
}) => {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const handleClearFilters = () => {
    setLocalFilters({});
    onClearFilters?.();
  };

  const hasActiveFilters = Object.values(localFilters).some(value => 
    value !== '' && value !== null && value !== undefined
  );

  const FilterSection = ({ title, children, isOpen = true }) => (
    <div className="border-b border-gray-200 pb-4 mb-4 last:border-b-0 last:pb-0 last:mb-0">
      <h3 className="font-semibold text-gray-900 mb-3">{title}</h3>
      {isOpen && <div className="space-y-3">{children}</div>}
    </div>
  );

  const CheckboxGroup = ({ options, value, onChange, name }) => (
    <div className="space-y-2">
      {options.map((option) => (
        <label key={option.value} className="flex items-center">
          <input
            type="checkbox"
            checked={value?.includes(option.value) || false}
            onChange={(e) => {
              const newValue = e.target.checked
                ? [...(value || []), option.value]
                : (value || []).filter(v => v !== option.value);
              onChange(newValue);
            }}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="ml-2 text-sm text-gray-700">{option.label}</span>
        </label>
      ))}
    </div>
  );

  const RadioGroup = ({ options, value, onChange, name }) => (
    <div className="space-y-2">
      {options.map((option) => (
        <label key={option.value} className="flex items-center">
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={(e) => onChange(e.target.value)}
            className="border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="ml-2 text-sm text-gray-700">{option.label}</span>
        </label>
      ))}
    </div>
  );

  const content = (
    <div className="space-y-6">
      {/* Category Filter */}
      <FilterSection title="Category">
        <CheckboxGroup
          options={packageCategories}
          value={localFilters.categories}
          onChange={(value) => handleFilterChange('categories', value)}
        />
      </FilterSection>

      {/* Price Range */}
      <FilterSection title="Price Range">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              placeholder="Min Price"
              value={localFilters.minPrice || ''}
              onChange={(e) => handleFilterChange('minPrice', e.target.value)}
            />
            <Input
              type="number"
              placeholder="Max Price"
              value={localFilters.maxPrice || ''}
              onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
            />
          </div>
          <div className="text-sm text-gray-600">
            Range: ₹{localFilters.minPrice || 0} - ₹{localFilters.maxPrice || '∞'}
          </div>
        </div>
      </FilterSection>

      {/* Date Filter */}
      <FilterSection title="Event Date">
        <Input
          type="date"
          value={localFilters.eventDate || ''}
          onChange={(e) => handleFilterChange('eventDate', e.target.value)}
        />
      </FilterSection>

      {/* Location Filter */}
      <FilterSection title="Location">
        <Input
          type="text"
          placeholder="Enter location"
          value={localFilters.location || ''}
          onChange={(e) => handleFilterChange('location', e.target.value)}
        />
      </FilterSection>

      {/* Rating Filter */}
      <FilterSection title="Rating">
        <RadioGroup
          options={[
            { value: '', label: 'Any Rating' },
            { value: '4', label: '4+ Stars' },
            { value: '3', label: '3+ Stars' },
            { value: '2', label: '2+ Stars' }
          ]}
          value={localFilters.minRating}
          onChange={(value) => handleFilterChange('minRating', value)}
          name="rating"
        />
      </FilterSection>

      {/* Sort By */}
      <FilterSection title="Sort By">
        <RadioGroup
          options={[
            { value: 'popularity', label: 'Popularity' },
            { value: 'price-low', label: 'Price: Low to High' },
            { value: 'price-high', label: 'Price: High to Low' },
            { value: 'rating', label: 'Rating' },
            { value: 'newest', label: 'Newest' }
          ]}
          value={localFilters.sortBy}
          onChange={(value) => handleFilterChange('sortBy', value)}
          name="sortBy"
        />
      </FilterSection>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <div className="pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearFilters}
            className="w-full"
          >
            <X className="w-4 h-4 mr-2" />
            Clear All Filters
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <Card className={className}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          {onToggleCollapse && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
              className="lg:hidden"
            >
              {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </Button>
          )}
        </div>
        
        {!isCollapsed && content}
      </div>
    </Card>
  );
};

export default FilterPanel;




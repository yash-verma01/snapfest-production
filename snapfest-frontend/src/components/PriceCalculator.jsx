import React, { useState, useEffect } from 'react';
import { Calculator, Plus, Minus, DollarSign, Info } from 'lucide-react';
import { Card, Button, Badge } from './ui';

const PriceCalculator = ({ 
  packageData, 
  addOns = [], 
  onPriceChange,
  className = '' 
}) => {
  const [guests, setGuests] = useState(1);
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [travelFee, setTravelFee] = useState(0);
  const [taxRate] = useState(0.18); // 18% GST

  // Calculate pricing
  const basePrice = packageData?.basePrice || 0;
  const perGuestPrice = packageData?.perGuestPrice || 0;
  const subtotal = (basePrice + (perGuestPrice * guests));
  
  const addOnsTotal = selectedAddOns.reduce((total, addOn) => {
    const addOnData = addOns.find(a => a._id === addOn.id);
    return total + (addOnData?.price || 0) * addOn.quantity;
  }, 0);
  
  const beforeTax = subtotal + addOnsTotal + travelFee;
  const tax = beforeTax * taxRate;
  const total = beforeTax + tax;

  // Notify parent component of price changes
  useEffect(() => {
    onPriceChange?.({
      subtotal,
      addOnsTotal,
      travelFee,
      tax,
      total,
      guests,
      selectedAddOns
    });
  }, [subtotal, addOnsTotal, travelFee, tax, total, guests, selectedAddOns]);

  const handleGuestChange = (newGuests) => {
    const validGuests = Math.max(1, Math.min(1000, newGuests));
    setGuests(validGuests);
  };

  const handleAddOnToggle = (addOnId, price) => {
    setSelectedAddOns(prev => {
      const existing = prev.find(item => item.id === addOnId);
      if (existing) {
        return prev.filter(item => item.id !== addOnId);
      } else {
        return [...prev, { id: addOnId, quantity: 1, price }];
      }
    });
  };

  const handleAddOnQuantityChange = (addOnId, quantity) => {
    if (quantity <= 0) {
      setSelectedAddOns(prev => prev.filter(item => item.id !== addOnId));
    } else {
      setSelectedAddOns(prev => 
        prev.map(item => 
          item.id === addOnId ? { ...item, quantity } : item
        )
      );
    }
  };

  const formatPrice = (amount) => `₹${amount.toLocaleString()}`;

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center mb-6">
        <Calculator className="w-6 h-6 text-primary-600 mr-2" />
        <h3 className="text-xl font-semibold text-gray-900">Price Calculator</h3>
      </div>

      {/* Guest Count */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Number of Guests
        </label>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => handleGuestChange(guests - 1)}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            disabled={guests <= 1}
          >
            <Minus className="w-4 h-4" />
          </button>
          <div className="flex-1 text-center">
            <span className="text-2xl font-bold text-primary-600">{guests}</span>
            <span className="text-sm text-gray-600 ml-2">guests</span>
          </div>
          <button
            onClick={() => handleGuestChange(guests + 1)}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Add-ons Selection */}
      {addOns.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Add-ons & Services
          </label>
          <div className="space-y-3">
            {addOns.map((addOn) => {
              const isSelected = selectedAddOns.find(item => item.id === addOn._id);
              const quantity = isSelected?.quantity || 0;
              
              return (
                <div key={addOn._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={!!isSelected}
                        onChange={() => handleAddOnToggle(addOn._id, addOn.price)}
                        className="mr-3 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <div>
                        <h4 className="font-medium text-gray-900">{addOn.name}</h4>
                        <p className="text-sm text-gray-600">{addOn.description}</p>
                        <p className="text-sm font-medium text-primary-600">
                          {formatPrice(addOn.price)} {addOn.unit && `per ${addOn.unit}`}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {isSelected && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleAddOnQuantityChange(addOn._id, quantity - 1)}
                        className="p-1 border border-gray-300 rounded hover:bg-gray-50"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center font-medium">{quantity}</span>
                      <button
                        onClick={() => handleAddOnQuantityChange(addOn._id, quantity + 1)}
                        className="p-1 border border-gray-300 rounded hover:bg-gray-50"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Price Breakdown */}
      <div className="border-t pt-6">
        <h4 className="font-medium text-gray-900 mb-4">Price Breakdown</h4>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Base Package</span>
            <span className="font-medium">{formatPrice(subtotal)}</span>
          </div>
          
          {addOnsTotal > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Add-ons</span>
              <span className="font-medium">{formatPrice(addOnsTotal)}</span>
            </div>
          )}
          
          {travelFee > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Travel Fee</span>
              <span className="font-medium">{formatPrice(travelFee)}</span>
            </div>
          )}
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">GST (18%)</span>
            <span className="font-medium">{formatPrice(tax)}</span>
          </div>
          
          <div className="border-t pt-3">
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-primary-600">{formatPrice(total)}</span>
            </div>
          </div>
        </div>

        {/* Travel Fee Info */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-start">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Travel Fee Information</p>
              <p>Travel fees may apply for locations outside the base radius. Contact us for exact pricing.</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PriceCalculator;



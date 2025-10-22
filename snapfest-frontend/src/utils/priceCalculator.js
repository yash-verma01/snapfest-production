// Price calculation utilities
const priceCalculator = {
  // Calculate base price based on guests
  calculateBasePrice: (basePrice, perGuestPrice, guests) => {
    return basePrice + (perGuestPrice * guests);
  },

  // Calculate add-ons total
  calculateAddOnsTotal: (addOns = []) => {
    return addOns.reduce((total, addOn) => {
      return total + (addOn.price * (addOn.quantity || 1));
    }, 0);
  },

  // Calculate travel fee based on location
  calculateTravelFee: (baseLocation, eventLocation, baseRadius = 50) => {
    // This is a simplified calculation
    // In a real app, you'd use a mapping service to calculate actual distance
    if (!eventLocation || !baseLocation) return 0;
    
    // Mock distance calculation (replace with real distance calculation)
    const distance = Math.random() * 100; // Mock distance in km
    
    if (distance <= baseRadius) return 0;
    
    const extraDistance = distance - baseRadius;
    const ratePerKm = 50; // ₹50 per km beyond base radius
    
    return Math.ceil(extraDistance * ratePerKm);
  },

  // Calculate tax
  calculateTax: (subtotal, addOnsTotal, travelFee, taxRate = 0.18) => {
    const taxableAmount = subtotal + addOnsTotal + travelFee;
    return Math.ceil(taxableAmount * taxRate);
  },

  // Calculate total price
  calculateTotal: ({
    basePrice = 0,
    perGuestPrice = 0,
    guests = 1,
    addOns = [],
    location = null,
    baseLocation = null,
    eventDate = null,
    taxRate = 0.18
  }) => {
    // Calculate base price
    const subtotal = priceCalculator.calculateBasePrice(basePrice, perGuestPrice, guests);
    
    // Calculate add-ons total
    const addOnsTotal = priceCalculator.calculateAddOnsTotal(addOns);
    
    // Calculate travel fee
    const travelFee = priceCalculator.calculateTravelFee(baseLocation, location);
    
    // Calculate tax
    const tax = priceCalculator.calculateTax(subtotal, addOnsTotal, travelFee, taxRate);
    
    // Calculate total
    const total = subtotal + addOnsTotal + travelFee + tax;
    
    return {
      subtotal,
      addOnsTotal,
      travelFee,
      tax,
      total,
      breakdown: {
        basePrice: subtotal,
        addOns: addOnsTotal,
        travel: travelFee,
        tax: tax,
        total: total
      }
    };
  },

  // Format price for display
  formatPrice: (amount, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0
    }).format(amount);
  },

  // Calculate partial payment (20%)
  calculatePartialPayment: (totalAmount) => {
    return Math.ceil(totalAmount * 0.2);
  },

  // Calculate remaining payment (80%)
  calculateRemainingPayment: (totalAmount, paidAmount = 0) => {
    return totalAmount - paidAmount;
  }
};

export default priceCalculator;






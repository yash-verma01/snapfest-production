import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Check, X, Calendar, MapPin, Users, Palette, Utensils, Camera, Music } from 'lucide-react';
import { Button, Card, Badge } from './ui';

const CustomizationWizard = ({ 
  packageData, 
  onComplete, 
  onCancel,
  isOpen = false 
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [customization, setCustomization] = useState({
    // Step 1: Basic Details
    guests: 1,
    eventDate: '',
    location: '',
    
    // Step 2: Venue
    venue: null,
    venueType: '',
    venueFeatures: [],
    
    // Step 3: Decorations
    theme: '',
    colorScheme: '',
    decorations: [],
    
    // Step 4: Catering
    menu: '',
    dietaryRequirements: [],
    beverages: [],
    
    // Step 5: Entertainment
    music: '',
    entertainment: [],
    
    // Step 6: Photography
    photography: false,
    videography: false,
    drone: false,
    
    // Step 7: Additional Services
    additionalServices: [],
    specialRequests: ''
  });

  const steps = [
    {
      id: 'basic',
      title: 'Basic Details',
      icon: <Users className="w-5 h-5" />,
      description: 'Tell us about your event'
    },
    {
      id: 'venue',
      title: 'Venue Selection',
      icon: <MapPin className="w-5 h-5" />,
      description: 'Choose your perfect venue'
    },
    {
      id: 'decor',
      title: 'Decorations',
      icon: <Palette className="w-5 h-5" />,
      description: 'Customize the look and feel'
    },
    {
      id: 'catering',
      title: 'Catering',
      icon: <Utensils className="w-5 h-5" />,
      description: 'Select your menu'
    },
    {
      id: 'entertainment',
      title: 'Entertainment',
      icon: <Music className="w-5 h-5" />,
      description: 'Add music and entertainment'
    },
    {
      id: 'photography',
      title: 'Photography',
      icon: <Camera className="w-5 h-5" />,
      description: 'Capture your memories'
    }
  ];

  const handleInputChange = (field, value) => {
    setCustomization(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayToggle = (field, value) => {
    setCustomization(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    onComplete(customization);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Basic Details
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Guests
              </label>
              <input
                type="number"
                min="1"
                max="1000"
                value={customization.guests}
                onChange={(e) => handleInputChange('guests', parseInt(e.target.value))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Date
              </label>
              <input
                type="date"
                value={customization.eventDate}
                onChange={(e) => handleInputChange('eventDate', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Location
              </label>
              <input
                type="text"
                placeholder="Enter event location"
                value={customization.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        );

      case 1: // Venue Selection
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Venue Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                {['Indoor', 'Outdoor', 'Garden', 'Banquet Hall', 'Resort', 'Hotel'].map((type) => (
                  <button
                    key={type}
                    onClick={() => handleInputChange('venueType', type)}
                    className={`p-3 border rounded-lg text-left transition-colors ${
                      customization.venueType === type
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Venue Features
              </label>
              <div className="space-y-2">
                {['Parking', 'AC', 'Sound System', 'Stage', 'Dance Floor', 'Bar'].map((feature) => (
                  <label key={feature} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={customization.venueFeatures.includes(feature)}
                      onChange={() => handleArrayToggle('venueFeatures', feature)}
                      className="mr-3 w-4 h-4 text-primary-600 border-gray-300 rounded"
                    />
                    <span className="text-gray-700">{feature}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 2: // Decorations
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Theme
              </label>
              <select
                value={customization.theme}
                onChange={(e) => handleInputChange('theme', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select a theme</option>
                <option value="Traditional">Traditional</option>
                <option value="Modern">Modern</option>
                <option value="Rustic">Rustic</option>
                <option value="Vintage">Vintage</option>
                <option value="Beach">Beach</option>
                <option value="Garden">Garden</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color Scheme
              </label>
              <div className="grid grid-cols-4 gap-3">
                {['Red & Gold', 'Pink & White', 'Blue & Silver', 'Green & Gold', 'Purple & Silver', 'Orange & Gold'].map((color) => (
                  <button
                    key={color}
                    onClick={() => handleInputChange('colorScheme', color)}
                    className={`p-3 border rounded-lg text-sm transition-colors ${
                      customization.colorScheme === color
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 3: // Catering
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Menu Type
              </label>
              <select
                value={customization.menu}
                onChange={(e) => handleInputChange('menu', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select menu type</option>
                <option value="Vegetarian">Vegetarian</option>
                <option value="Non-Vegetarian">Non-Vegetarian</option>
                <option value="Mixed">Mixed</option>
                <option value="Jain">Jain</option>
                <option value="Custom">Custom Menu</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Dietary Requirements
              </label>
              <div className="space-y-2">
                {['No Onion Garlic', 'Gluten Free', 'Diabetic Friendly', 'Low Spice', 'Keto', 'Vegan'].map((req) => (
                  <label key={req} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={customization.dietaryRequirements.includes(req)}
                      onChange={() => handleArrayToggle('dietaryRequirements', req)}
                      className="mr-3 w-4 h-4 text-primary-600 border-gray-300 rounded"
                    />
                    <span className="text-gray-700">{req}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 4: // Entertainment
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Music Preference
              </label>
              <select
                value={customization.music}
                onChange={(e) => handleInputChange('music', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select music type</option>
                <option value="Bollywood">Bollywood</option>
                <option value="Classical">Classical</option>
                <option value="Western">Western</option>
                <option value="Folk">Folk</option>
                <option value="Mixed">Mixed</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Entertainment Options
              </label>
              <div className="space-y-2">
                {['DJ', 'Live Band', 'Dancers', 'Singer', 'Comedian', 'Magician'].map((option) => (
                  <label key={option} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={customization.entertainment.includes(option)}
                      onChange={() => handleArrayToggle('entertainment', option)}
                      className="mr-3 w-4 h-4 text-primary-600 border-gray-300 rounded"
                    />
                    <span className="text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 5: // Photography
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Photography Services
              </label>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={customization.photography}
                    onChange={(e) => handleInputChange('photography', e.target.checked)}
                    className="mr-3 w-4 h-4 text-primary-600 border-gray-300 rounded"
                  />
                  <span className="text-gray-700">Professional Photography</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={customization.videography}
                    onChange={(e) => handleInputChange('videography', e.target.checked)}
                    className="mr-3 w-4 h-4 text-primary-600 border-gray-300 rounded"
                  />
                  <span className="text-gray-700">Videography</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={customization.drone}
                    onChange={(e) => handleInputChange('drone', e.target.checked)}
                    className="mr-3 w-4 h-4 text-primary-600 border-gray-300 rounded"
                  />
                  <span className="text-gray-700">Drone Photography</span>
                </label>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Special Requests
              </label>
              <textarea
                value={customization.specialRequests}
                onChange={(e) => handleInputChange('specialRequests', e.target.value)}
                placeholder="Any special requirements or requests..."
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Customize Your Event</h2>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center space-x-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  index <= currentStep
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {index < currentStep ? <Check className="w-4 h-4" /> : index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-8 h-0.5 mx-2 ${
                    index < currentStep ? 'bg-primary-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-2">
            <h3 className="font-medium text-gray-900">{steps[currentStep].title}</h3>
            <p className="text-sm text-gray-600">{steps[currentStep].description}</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {renderStepContent()}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6">
          <div className="flex justify-between">
            <Button
              onClick={prevStep}
              disabled={currentStep === 0}
              variant="outline"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            
            {currentStep === steps.length - 1 ? (
              <Button onClick={handleComplete} className="bg-primary-600 hover:bg-primary-700">
                Complete Customization
                <Check className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={nextStep} className="bg-primary-600 hover:bg-primary-700">
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomizationWizard;



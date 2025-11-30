import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const StepWizard = ({ 
  steps, 
  currentStep,
  className = ''
}) => {
  return (
    <div className={`flex items-center justify-between mb-8 ${className}`}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const stepNumber = index + 1;

        return (
          <React.Fragment key={index}>
            <div className="flex flex-col items-center flex-1">
              {/* Step Circle */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className={`
                  w-12 h-12 rounded-full flex items-center justify-center
                  font-bold text-sm transition-all duration-300
                  ${
                    isCompleted
                      ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white'
                      : isCurrent
                      ? 'bg-gradient-to-r from-pink-400 to-red-400 text-white ring-4 ring-pink-200'
                      : 'bg-gray-200 text-gray-500'
                  }
                `}
              >
                {isCompleted ? (
                  <Check className="w-6 h-6" />
                ) : (
                  stepNumber
                )}
              </motion.div>

              {/* Step Label */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.2 }}
                className={`
                  mt-2 text-sm font-medium text-center
                  ${isCurrent ? 'text-pink-600' : isCompleted ? 'text-gray-700' : 'text-gray-400'}
                `}
              >
                {step.label}
              </motion.div>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className="flex-1 h-1 mx-2 -mt-6">
                <div
                  className={`
                    h-full rounded-full transition-all duration-500
                    ${isCompleted ? 'bg-gradient-to-r from-pink-500 to-red-500' : 'bg-gray-200'}
                  `}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default StepWizard;








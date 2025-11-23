import React from 'react';
import { motion } from 'framer-motion';
import { useScroll, useTransform } from 'framer-motion';
import ParticleBackground from './ParticleBackground';

const AnimatedHero = ({ 
  title,
  subtitle,
  description,
  ctaButtons = [],
  backgroundImage,
  className = ''
}) => {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  return (
    <motion.section
      style={{ y, opacity }}
      className={`relative min-h-screen flex items-center justify-center overflow-hidden ${className}`}
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-100 via-white to-red-100">
        {backgroundImage && (
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-20"
            style={{ backgroundImage: `url(${backgroundImage})` }}
          />
        )}
        <ParticleBackground />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-8"
        >
          {subtitle && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center bg-gradient-to-r from-pink-500 to-red-500 text-white px-8 py-4 rounded-full text-lg font-bold shadow-2xl"
            >
              {subtitle}
            </motion.div>
          )}

          {title && (
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight"
            >
              <span className="block text-pink-800 drop-shadow-2xl">{title}</span>
            </motion.h1>
          )}

          {description && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="text-xl md:text-2xl text-pink-700 max-w-4xl mx-auto leading-relaxed font-medium"
            >
              {description}
            </motion.p>
          )}

          {ctaButtons.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-8"
            >
              {ctaButtons.map((button, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={button.onClick}
                  className={`
                    ${button.primary 
                      ? 'bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white' 
                      : 'bg-white text-pink-600 hover:bg-pink-50 border-2 border-pink-500'
                    }
                    px-12 py-5 text-xl font-bold rounded-2xl shadow-2xl hover:shadow-3xl 
                    transform transition-all duration-500
                  `}
                >
                  {button.label}
                </motion.button>
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.section>
  );
};

export default AnimatedHero;



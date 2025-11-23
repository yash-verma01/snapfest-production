/**
 * Performance monitoring utilities
 * Helps track and measure component performance
 */

export const markStart = (label) => {
  if (typeof performance !== 'undefined' && performance.mark) {
    performance.mark(`${label}-start`);
  }
};

export const markEnd = (label) => {
  if (typeof performance !== 'undefined' && performance.mark) {
    performance.mark(`${label}-end`);
    try {
      performance.measure(label, `${label}-start`, `${label}-end`);
      const measure = performance.getEntriesByName(label)[0];
      if (measure) {
        console.log(`⚡ Performance [${label}]: ${measure.duration.toFixed(2)}ms`);
        // Clean up marks
        performance.clearMarks(`${label}-start`);
        performance.clearMarks(`${label}-end`);
        performance.clearMeasures(label);
      }
    } catch (error) {
      // Silently fail if performance API is not fully supported
    }
  }
};

export const measureAsync = async (label, fn) => {
  markStart(label);
  try {
    const result = await fn();
    markEnd(label);
    return result;
  } catch (error) {
    markEnd(label);
    throw error;
  }
};

export const measureSync = (label, fn) => {
  markStart(label);
  try {
    const result = fn();
    markEnd(label);
    return result;
  } catch (error) {
    markEnd(label);
    throw error;
  }
};



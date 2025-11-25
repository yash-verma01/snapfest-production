import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop Component
 * 
 * Automatically scrolls to the top of the page when the route changes.
 * This fixes the issue where navigating to a new page maintains the previous scroll position.
 * 
 * Usage: Place this component inside your Router component, before Routes.
 * 
 * @example
 * <Router>
 *   <ScrollToTop />
 *   <Routes>
 *     ...
 *   </Routes>
 * </Router>
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to top when route changes
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' // Use 'instant' for immediate scroll (better UX for route changes)
    });
  }, [pathname]);

  return null; // This component doesn't render anything
};

export default ScrollToTop;



#!/usr/bin/env node

/**
 * Console Errors Fix Script
 * This script identifies and fixes common console errors in the SnapFest frontend
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🐛 SnapFest Frontend - Console Errors Fix Script');
console.log('================================================\n');

// Common error patterns and their fixes
const errorFixes = [
  {
    pattern: /\.map\(/g,
    issue: 'Array.map() called on potentially undefined array',
    fix: 'Add optional chaining: array?.map() || []',
    files: ['src/pages/Home.jsx', 'src/pages/Packages.jsx', 'src/components/cards/PackageCard.jsx']
  },
  {
    pattern: /\.length/g,
    issue: 'Accessing .length on potentially undefined array',
    fix: 'Add optional chaining: array?.length || 0',
    files: ['src/hooks/usePackages.js', 'src/pages/Packages.jsx']
  },
  {
    pattern: /response\.data\.data/g,
    issue: 'Accessing nested properties without null checks',
    fix: 'Add optional chaining: response?.data?.data',
    files: ['src/hooks/usePackages.js', 'src/pages/Home.jsx']
  },
  {
    pattern: /useEffect\(\(\) => \{[\s\S]*?\}, \[\]\)/g,
    issue: 'useEffect with empty dependency array but using external variables',
    fix: 'Add proper dependencies or use useCallback',
    files: ['src/hooks/usePackages.js']
  }
];

// Files to check for common issues
const filesToCheck = [
  'src/context/AuthContext.jsx',
  'src/hooks/usePackages.js',
  'src/pages/Home.jsx',
  'src/pages/Packages.jsx',
  'src/components/cards/PackageCard.jsx',
  'src/components/Navbar.jsx'
];

// Check if file exists
function fileExists(filePath) {
  return fs.existsSync(path.join(__dirname, filePath));
}

// Read file content
function readFile(filePath) {
  try {
    return fs.readFileSync(path.join(__dirname, filePath), 'utf8');
  } catch (error) {
    console.log(`❌ Error reading ${filePath}: ${error.message}`);
    return null;
  }
}

// Write file content
function writeFile(filePath, content) {
  try {
    fs.writeFileSync(path.join(__dirname, filePath), content, 'utf8');
    console.log(`✅ Fixed ${filePath}`);
  } catch (error) {
    console.log(`❌ Error writing ${filePath}: ${error.message}`);
  }
}

// Fix common React errors
function fixReactErrors() {
  console.log('🔧 Fixing React-specific errors...\n');
  
  // Fix usePackages hook
  const usePackagesPath = 'src/hooks/usePackages.js';
  if (fileExists(usePackagesPath)) {
    let content = readFile(usePackagesPath);
    if (content) {
      // Fix the fetchPackages dependency issue
      content = content.replace(
        /const fetchPackages = useCallback\(async \(page = 1, newFilters = filters\) => \{[\s\S]*?\}, \[filters, pagination\.limit\]\);/,
        `const fetchPackages = useCallback(async (page = 1, newFilters = filters) => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        page,
        limit: 12,
        ...newFilters
      };

      console.log('🔍 usePackages: Fetching packages with params:', params);
      const response = await publicAPI.getPackages(params);
      console.log('📦 usePackages: API response:', response.data);
      
      const { packages: data, pagination: paginationData } = response?.data?.data || { packages: [], pagination: {} };
      console.log('📊 usePackages: Packages data:', data);
      console.log('📄 usePackages: Pagination data:', paginationData);

      setPackages(data || []);
      setPagination(paginationData || { page: 1, limit: 12, total: 0, totalPages: 0 });
    } catch (err) {
      console.error('❌ usePackages: Error fetching packages:', err);
      setError(err.response?.data?.message || 'Failed to fetch packages');
    } finally {
      setLoading(false);
    }
  }, []);`
      );
      
      writeFile(usePackagesPath, content);
    }
  }
}

// Fix null/undefined access errors
function fixNullAccessErrors() {
  console.log('🔧 Fixing null/undefined access errors...\n');
  
  // Fix Home.jsx
  const homePath = 'src/pages/Home.jsx';
  if (fileExists(homePath)) {
    let content = readFile(homePath);
    if (content) {
      // Add null checks for beatBloomPackages
      content = content.replace(
        /{beatBloomPackages\.map\(\(pkg, index\) => \(/g,
        '{beatBloomPackages?.map((pkg, index) => ('
      );
      
      // Add null checks for featuredPackages
      content = content.replace(
        /{featuredPackages\.map\(\(pkg\) => \(/g,
        '{featuredPackages?.map((pkg) => ('
      );
      
      writeFile(homePath, content);
    }
  }
  
  // Fix Packages.jsx
  const packagesPath = 'src/pages/Packages.jsx';
  if (fileExists(packagesPath)) {
    let content = readFile(packagesPath);
    if (content) {
      // Add null checks for packages array
      content = content.replace(
        /{packages\.map\(\(pkg\) => \(/g,
        '{packages?.map((pkg) => ('
      );
      
      writeFile(packagesPath, content);
    }
  }
}

// Add error boundaries
function addErrorBoundaries() {
  console.log('🔧 Adding error boundaries...\n');
  
  const errorBoundaryContent = `import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h2>
            <p className="text-gray-600 mb-4">We're sorry, but something unexpected happened.</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;`;
  
  writeFile('src/components/ErrorBoundary.jsx', errorBoundaryContent);
}

// Add console error monitoring
function addConsoleMonitoring() {
  console.log('🔧 Adding console error monitoring...\n');
  
  const monitoringContent = `// Console Error Monitoring
window.addEventListener('error', (event) => {
  console.error('🚨 JavaScript Error:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error
  });
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 Unhandled Promise Rejection:', event.reason);
});

// Override console.error to track errors
const originalError = console.error;
console.error = function(...args) {
  originalError.apply(console, args);
  
  // Send error to monitoring service (if implemented)
  if (window.errorReporting) {
    window.errorReporting.reportError(args.join(' '));
  }
};`;
  
  writeFile('src/utils/errorMonitoring.js', monitoringContent);
}

// Main function
function main() {
  console.log('Starting console error fixes...\n');
  
  fixReactErrors();
  fixNullAccessErrors();
  addErrorBoundaries();
  addConsoleMonitoring();
  
  console.log('\n✅ Console error fixes completed!');
  console.log('\n📋 Summary of fixes applied:');
  console.log('1. Fixed usePackages hook dependency issues');
  console.log('2. Added null checks for array operations');
  console.log('3. Added error boundaries for better error handling');
  console.log('4. Added console error monitoring');
  console.log('\n🔍 To test the fixes:');
  console.log('1. Open browser developer tools');
  console.log('2. Check the Console tab for any remaining errors');
  console.log('3. Use the debug-console-errors.html file for comprehensive testing');
}

// Run the script
main();

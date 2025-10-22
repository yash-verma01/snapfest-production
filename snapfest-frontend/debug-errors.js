#!/usr/bin/env node

// Frontend Error Detection Script
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 SNAPFEST FRONTEND ERROR DETECTION');
console.log('=====================================\n');

const srcDir = './src';
const errors = [];

// Check for missing files
const requiredFiles = [
  'src/App.jsx',
  'src/main.jsx',
  'src/index.css',
  'src/context/AuthContext.jsx',
  'src/services/api.js',
  'src/components/Navbar.jsx',
  'src/components/Footer.jsx',
  'src/components/ProtectedRoute.jsx',
  'src/pages/Home.jsx',
  'src/pages/Login.jsx',
  'src/pages/Register.jsx',
  'src/pages/Packages.jsx',
  'src/pages/Cart.jsx',
  'src/hooks/useCart.js',
  'src/hooks/usePackages.js',
  'src/data/index.js',
  'src/utils/priceCalculator.js'
];

console.log('📁 Checking for missing files...');
requiredFiles.forEach(file => {
  if (!fs.existsSync(file)) {
    errors.push(`❌ Missing file: ${file}`);
  } else {
    console.log(`✅ Found: ${file}`);
  }
});

// Check for missing dependencies in package.json
console.log('\n📦 Checking package.json dependencies...');
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
const requiredDeps = [
  'react',
  'react-dom',
  'react-router-dom',
  'axios',
  'lucide-react',
  'react-hot-toast'
];

requiredDeps.forEach(dep => {
  if (!packageJson.dependencies[dep]) {
    errors.push(`❌ Missing dependency: ${dep}`);
  } else {
    console.log(`✅ Found dependency: ${dep}`);
  }
});

// Check for common React errors
console.log('\n⚛️ Checking for common React errors...');

// Check for missing imports
const checkFile = (filePath) => {
  if (!fs.existsSync(filePath)) return;
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check for missing imports
  if (content.includes('useState') && !content.includes("import { useState }")) {
    errors.push(`❌ Missing useState import in ${filePath}`);
  }
  
  if (content.includes('useEffect') && !content.includes("import { useEffect }")) {
    errors.push(`❌ Missing useEffect import in ${filePath}`);
  }
  
  if (content.includes('useCallback') && !content.includes("import { useCallback }")) {
    errors.push(`❌ Missing useCallback import in ${filePath}`);
  }
  
  // Check for missing dependencies in useEffect
  const useEffectMatches = content.match(/useEffect\([^)]*\)/g);
  if (useEffectMatches) {
    useEffectMatches.forEach(match => {
      if (match.includes('useEffect(') && !match.includes('[]') && !match.includes('[dependency')) {
        errors.push(`❌ useEffect missing dependency array in ${filePath}`);
      }
    });
  }
  
  // Check for missing dependencies in useCallback
  const useCallbackMatches = content.match(/useCallback\([^)]*\)/g);
  if (useCallbackMatches) {
    useCallbackMatches.forEach(match => {
      if (match.includes('useCallback(') && !match.includes('[]') && !match.includes('[dependency')) {
        errors.push(`❌ useCallback missing dependency array in ${filePath}`);
      }
    });
  }
};

// Check all JS/JSX files
const checkDirectory = (dir) => {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      checkDirectory(filePath);
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      checkFile(filePath);
    }
  });
};

checkDirectory('./src');

// Check for environment variables
console.log('\n🔧 Checking environment variables...');
if (!fs.existsSync('.env')) {
  errors.push('❌ Missing .env file');
} else {
  console.log('✅ Found .env file');
}

// Check for Vite configuration
console.log('\n⚙️ Checking Vite configuration...');
if (!fs.existsSync('vite.config.js')) {
  errors.push('❌ Missing vite.config.js');
} else {
  console.log('✅ Found vite.config.js');
}

// Summary
console.log('\n📊 ERROR SUMMARY');
console.log('================');
if (errors.length === 0) {
  console.log('✅ No errors found! Frontend should work correctly.');
} else {
  console.log(`❌ Found ${errors.length} errors:`);
  errors.forEach(error => console.log(`  ${error}`));
}

console.log('\n🔧 RECOMMENDED FIXES');
console.log('====================');
if (errors.length > 0) {
  console.log('1. Install missing dependencies: npm install');
  console.log('2. Create missing files');
  console.log('3. Fix import statements');
  console.log('4. Add missing dependency arrays');
  console.log('5. Check environment variables');
} else {
  console.log('Frontend appears to be properly configured!');
}

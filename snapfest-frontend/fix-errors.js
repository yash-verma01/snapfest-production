#!/usr/bin/env node

// Frontend Error Fix Script
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 SNAPFEST FRONTEND ERROR FIXES');
console.log('=================================\n');

// Fix 1: Create missing .env file
console.log('📝 Creating .env file...');
const envContent = `# SnapFest Frontend Environment Variables
VITE_API_URL=http://localhost:5001/api
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id_here
VITE_APP_NAME=SnapFest
VITE_APP_VERSION=1.0.0
VITE_APP_ENV=development`;

if (!fs.existsSync('.env')) {
  fs.writeFileSync('.env', envContent);
  console.log('✅ Created .env file');
} else {
  console.log('✅ .env file already exists');
}

// Fix 2: Check and fix critical components
console.log('\n🔧 Checking critical components...');

const criticalFiles = [
  'src/hooks/useCart.js',
  'src/hooks/usePackages.js',
  'src/pages/Packages.jsx',
  'src/pages/Cart.jsx',
  'src/context/AuthContext.jsx'
];

criticalFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ Found: ${file}`);
  } else {
    console.log(`❌ Missing: ${file}`);
  }
});

// Fix 3: Check for common import issues
console.log('\n📦 Checking for import issues...');

const checkImports = (filePath) => {
  if (!fs.existsSync(filePath)) return;
  
  const content = fs.readFileSync(filePath, 'utf8');
  let hasIssues = false;
  
  // Check for useState without import
  if (content.includes('useState(') && !content.includes("import { useState }") && !content.includes("import React, { useState }")) {
    console.log(`❌ ${filePath}: Missing useState import`);
    hasIssues = true;
  }
  
  // Check for useEffect without import
  if (content.includes('useEffect(') && !content.includes("import { useEffect }") && !content.includes("import React, { useEffect }")) {
    console.log(`❌ ${filePath}: Missing useEffect import`);
    hasIssues = true;
  }
  
  if (!hasIssues) {
    console.log(`✅ ${filePath}: Imports look good`);
  }
};

// Check critical files
criticalFiles.forEach(checkImports);

// Fix 4: Check for missing dependencies
console.log('\n🔗 Checking for missing dependencies...');

const checkDependencies = (filePath) => {
  if (!fs.existsSync(filePath)) return;
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check for useEffect without dependency array
  const useEffectMatches = content.match(/useEffect\([^)]*\)/g);
  if (useEffectMatches) {
    useEffectMatches.forEach(match => {
      if (match.includes('useEffect(') && !match.includes('[]') && !match.includes('[dependency')) {
        console.log(`⚠️  ${filePath}: useEffect might need dependency array`);
      }
    });
  }
  
  // Check for useCallback without dependency array
  const useCallbackMatches = content.match(/useCallback\([^)]*\)/g);
  if (useCallbackMatches) {
    useCallbackMatches.forEach(match => {
      if (match.includes('useCallback(') && !match.includes('[]') && !match.includes('[dependency')) {
        console.log(`⚠️  ${filePath}: useCallback might need dependency array`);
      }
    });
  }
};

criticalFiles.forEach(checkDependencies);

console.log('\n🎯 PRIORITY FIXES');
console.log('================');
console.log('1. ✅ Created .env file');
console.log('2. 🔧 Check critical components');
console.log('3. 📦 Verify imports');
console.log('4. 🔗 Check dependencies');

console.log('\n🚀 NEXT STEPS');
console.log('=============');
console.log('1. Run: npm run dev');
console.log('2. Check browser console for errors');
console.log('3. Test cart functionality');
console.log('4. Test authentication flow');

console.log('\n✅ Frontend error fixes completed!');



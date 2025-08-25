#!/usr/bin/env node

/**
 * PostCSS Build Fix Script
 * 
 * This script helps diagnose and fix PostCSS-related build issues on Vercel.
 * Run with: node scripts/fix-postcss-build.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 PostCSS Build Fix Script');
console.log('==========================');

// Check PostCSS configuration
function checkPostCSSConfig() {
  console.log('\n📋 Checking PostCSS configuration...');
  
  const postcssConfigPath = path.join(__dirname, '../postcss.config.js');
  
  if (!fs.existsSync(postcssConfigPath)) {
    console.log('❌ PostCSS config file not found');
    return false;
  }
  
  try {
    const config = fs.readFileSync(postcssConfigPath, 'utf8');
    console.log('✅ PostCSS config file exists');
    
    // Check if using array format
    if (config.includes('plugins: [')) {
      console.log('✅ Using array format for plugins');
    } else {
      console.log('⚠️  Consider using array format for better compatibility');
    }
    
    return true;
  } catch (error) {
    console.log('❌ Error reading PostCSS config:', error.message);
    return false;
  }
}

// Check dependencies
function checkDependencies() {
  console.log('\n📦 Checking PostCSS dependencies...');
  
  const packageJsonPath = path.join(__dirname, '../package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  const requiredDeps = ['postcss', 'tailwindcss', 'autoprefixer'];
  const missingDeps = [];
  
  requiredDeps.forEach(dep => {
    if (!packageJson.devDependencies[dep] && !packageJson.dependencies[dep]) {
      missingDeps.push(dep);
    } else {
      console.log(`✅ ${dep} is installed`);
    }
  });
  
  if (missingDeps.length > 0) {
    console.log('❌ Missing dependencies:', missingDeps.join(', '));
    return false;
  }
  
  return true;
}

// Check for potential conflicts
function checkConflicts() {
  console.log('\n🔍 Checking for potential conflicts...');
  
  const packageJsonPath = path.join(__dirname, '../package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Check for multiple PostCSS versions
  const postcssVersions = [];
  
  if (packageJson.dependencies.postcss) {
    postcssVersions.push(`dependencies: ${packageJson.dependencies.postcss}`);
  }
  if (packageJson.devDependencies.postcss) {
    postcssVersions.push(`devDependencies: ${packageJson.devDependencies.postcss}`);
  }
  
  if (postcssVersions.length > 1) {
    console.log('⚠️  Multiple PostCSS versions detected:', postcssVersions.join(', '));
    console.log('   Consider moving PostCSS to devDependencies only');
  } else {
    console.log('✅ No PostCSS version conflicts detected');
  }
}

// Generate fix recommendations
function generateFixRecommendations() {
  console.log('\n💡 Fix Recommendations:');
  console.log('======================');
  
  console.log('\n1. ✅ Update PostCSS Configuration:');
  console.log('   - Use array format for plugins');
  console.log('   - Ensure explicit plugin requires');
  
  console.log('\n2. ✅ Dependency Management:');
  console.log('   - Move PostCSS to devDependencies');
  console.log('   - Update to latest stable versions');
  console.log('   - Remove duplicate dependencies');
  
  console.log('\n3. ✅ Build Configuration:');
  console.log('   - Clear node_modules and reinstall');
  console.log('   - Use pnpm install --frozen-lockfile');
  console.log('   - Check for peer dependency issues');
  
  console.log('\n4. ✅ Vercel-Specific:');
  console.log('   - Add .npmrc with legacy-peer-deps=true');
  console.log('   - Use pnpm as package manager');
  console.log('   - Clear build cache if needed');
}

// Main execution
function main() {
  console.log('Starting PostCSS build diagnosis...\n');
  
  const configOk = checkPostCSSConfig();
  const depsOk = checkDependencies();
  checkConflicts();
  
  if (!configOk || !depsOk) {
    console.log('\n❌ Issues detected that need fixing');
    generateFixRecommendations();
    process.exit(1);
  } else {
    console.log('\n✅ All checks passed');
    console.log('If build still fails, try the recommendations below:');
    generateFixRecommendations();
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  checkPostCSSConfig,
  checkDependencies,
  checkConflicts,
  generateFixRecommendations
};

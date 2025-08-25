#!/usr/bin/env node

/**
 * Build Optimization Script
 * 
 * This script helps optimize the build process to prevent Vercel timeouts.
 * Run with: node scripts/optimize-build.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Build Optimization Script');
console.log('============================');

// Check for potential build issues
function checkBuildIssues() {
  console.log('\n📋 Checking for potential build issues...');
  
  const issues = [];
  
  // Check for large dependencies
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const largeDeps = ['chart.js', 'framer-motion', 'googleapis', 'jspdf'];
  
  largeDeps.forEach(dep => {
    if (packageJson.dependencies[dep]) {
      issues.push(`Large dependency detected: ${dep}`);
    }
  });
  
  // Check for static generation issues
  const appDir = path.join(__dirname, '../app');
  if (fs.existsSync(appDir)) {
    const files = fs.readdirSync(appDir, { recursive: true });
    const staticFiles = files.filter(file => 
      file.includes('generateStaticParams') || 
      file.includes('getStaticProps') ||
      file.includes('getStaticPaths')
    );
    
    if (staticFiles.length > 0) {
      issues.push(`Static generation files found: ${staticFiles.join(', ')}`);
    }
  }
  
  if (issues.length === 0) {
    console.log('✅ No obvious build issues detected');
  } else {
    console.log('⚠️  Potential issues found:');
    issues.forEach(issue => console.log(`  - ${issue}`));
  }
  
  return issues;
}

// Generate build recommendations
function generateRecommendations() {
  console.log('\n💡 Build Optimization Recommendations:');
  console.log('=====================================');
  
  console.log('\n1. ✅ Database Connection Optimization:');
  console.log('   - Skip database connections during build time');
  console.log('   - Use connection pooling with limits');
  console.log('   - Add proper timeouts');
  
  console.log('\n2. ✅ Caching Strategy:');
  console.log('   - Remove preloading during module initialization');
  console.log('   - Use Next.js unstable_cache for API routes');
  console.log('   - Implement ISR (Incremental Static Regeneration)');
  
  console.log('\n3. ✅ Bundle Optimization:');
  console.log('   - Enable tree shaking');
  console.log('   - Use dynamic imports for heavy components');
  console.log('   - Optimize package imports');
  
  console.log('\n4. ✅ Build Configuration:');
  console.log('   - Ignore TypeScript errors during build');
  console.log('   - Remove console logs in production');
  console.log('   - Optimize webpack configuration');
  
  console.log('\n5. ✅ Vercel Configuration:');
  console.log('   - Set appropriate function timeouts');
  console.log('   - Use proper caching headers');
  console.log('   - Configure build environment variables');
}

// Check current optimizations
function checkCurrentOptimizations() {
  console.log('\n🔍 Checking current optimizations...');
  
  const optimizations = [];
  
  // Check Next.js config
  const nextConfigPath = path.join(__dirname, '../next.config.js');
  if (fs.existsSync(nextConfigPath)) {
    const nextConfig = fs.readFileSync(nextConfigPath, 'utf8');
    
    if (nextConfig.includes('ignoreBuildErrors')) {
      optimizations.push('TypeScript errors ignored during build');
    }
    
    if (nextConfig.includes('removeConsole')) {
      optimizations.push('Console logs removed in production');
    }
    
    if (nextConfig.includes('optimizePackageImports')) {
      optimizations.push('Package imports optimized');
    }
  }
  
  // Check Vercel config
  const vercelConfigPath = path.join(__dirname, '../vercel.json');
  if (fs.existsSync(vercelConfigPath)) {
    const vercelConfig = fs.readFileSync(vercelConfigPath, 'utf8');
    
    if (vercelConfig.includes('maxDuration')) {
      optimizations.push('Function timeouts configured');
    }
    
    if (vercelConfig.includes('Cache-Control')) {
      optimizations.push('Caching headers configured');
    }
  }
  
  if (optimizations.length === 0) {
    console.log('❌ No optimizations detected');
  } else {
    console.log('✅ Current optimizations:');
    optimizations.forEach(opt => console.log(`  - ${opt}`));
  }
  
  return optimizations;
}

// Main execution
function main() {
  const issues = checkBuildIssues();
  const optimizations = checkCurrentOptimizations();
  generateRecommendations();
  
  console.log('\n📊 Summary:');
  console.log(`  - Issues found: ${issues.length}`);
  console.log(`  - Optimizations in place: ${optimizations.length}`);
  
  if (issues.length > 0) {
    console.log('\n🚨 Action required: Address the issues above to prevent build timeouts');
    process.exit(1);
  } else {
    console.log('\n✅ Build should be optimized for Vercel deployment');
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  checkBuildIssues,
  generateRecommendations,
  checkCurrentOptimizations
};

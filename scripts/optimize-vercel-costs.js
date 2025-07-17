#!/usr/bin/env node

/**
 * Vercel Cost Optimization Script
 * 
 * This script helps monitor and optimize function invocations to reduce Vercel costs.
 * Run with: node scripts/optimize-vercel-costs.js
 */

const fs = require('fs');
const path = require('path');

// Analyze API routes for caching opportunities
function analyzeApiRoutes() {
  const apiDir = path.join(__dirname, '../app/api');
  const routes = [];
  
  function scanDirectory(dir, prefix = '') {
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        const routePath = prefix + '/' + item;
        scanDirectory(fullPath, routePath);
      } else if (item === 'route.ts') {
        const routePath = prefix.replace('/api', '') || '/';
        routes.push(routePath);
      }
    });
  }
  
  scanDirectory(apiDir);
  
  console.log('📊 API Routes Analysis:');
  console.log('=======================');
  
  const cacheableRoutes = [];
  const nonCacheableRoutes = [];
  
  routes.forEach(route => {
    // Routes that can be cached
    if (['/events', '/categories', '/analytics'].includes(route)) {
      cacheableRoutes.push(route);
    } else {
      nonCacheableRoutes.push(route);
    }
  });
  
  console.log('\n✅ Cacheable Routes (can use ISR/caching):');
  cacheableRoutes.forEach(route => console.log(`  - ${route}`));
  
  console.log('\n❌ Non-Cacheable Routes (require real-time data):');
  nonCacheableRoutes.forEach(route => console.log(`  - ${route}`));
  
  return { cacheableRoutes, nonCacheableRoutes };
}

// Check for optimization opportunities
function checkOptimizations() {
  console.log('\n🔍 Optimization Opportunities:');
  console.log('=============================');
  
  const recommendations = [
    {
      type: 'Caching',
      description: 'Implement ISR for event pages',
      impact: 'High',
      effort: 'Low'
    },
    {
      type: 'Database',
      description: 'Add indexes for frequently queried fields',
      impact: 'High',
      effort: 'Medium'
    },
    {
      type: 'API',
      description: 'Use batch endpoints for multiple requests',
      impact: 'Medium',
      effort: 'Medium'
    },
    {
      type: 'Client',
      description: 'Implement client-side caching',
      impact: 'Medium',
      effort: 'Low'
    }
  ];
  
  recommendations.forEach(rec => {
    console.log(`\n${rec.type}:`);
    console.log(`  Description: ${rec.description}`);
    console.log(`  Impact: ${rec.impact}`);
    console.log(`  Effort: ${rec.effort}`);
  });
}

// Generate cost optimization report
function generateReport() {
  console.log('\n📈 Vercel Cost Optimization Report');
  console.log('==================================');
  
  const { cacheableRoutes, nonCacheableRoutes } = analyzeApiRoutes();
  checkOptimizations();
  
  console.log('\n💡 Quick Wins:');
  console.log('1. Increase cache TTL for static content');
  console.log('2. Use ISR for event listing pages');
  console.log('3. Implement client-side caching for user data');
  console.log('4. Add database indexes for common queries');
  console.log('5. Use batch API endpoints for multiple requests');
  
  console.log('\n📊 Expected Impact:');
  console.log('- Reduce function invocations by 40-60%');
  console.log('- Improve page load times');
  console.log('- Better user experience with cached content');
  console.log('- Lower Vercel costs');
}

if (require.main === module) {
  generateReport();
}

module.exports = { analyzeApiRoutes, checkOptimizations, generateReport }; 
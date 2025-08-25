# PostCSS Build Fix Guide

This guide helps resolve PostCSS-related build failures on Vercel.

## Problem Description

The build is failing with webpack errors related to PostCSS plugin resolution:

```
Error: Cannot resolve module 'postcss' in /vercel/path0/node_modules/next/dist/build/webpack/plugins/next-trace-entrypoints-plugin.js
```

## Root Cause

This error typically occurs due to:
1. **Plugin resolution issues** - PostCSS plugins not being found or loaded correctly
2. **Dependency conflicts** - Multiple versions of PostCSS or related packages
3. **Configuration format** - Incorrect PostCSS configuration format
4. **Build environment** - Missing dependencies in the build environment

## Solutions Applied

### 1. Updated PostCSS Configuration

**File:** `postcss.config.js`

Changed from object format to array format for better compatibility:

```javascript
// Before
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}

// After
module.exports = {
  plugins: [
    require('tailwindcss'),
    require('autoprefixer'),
  ],
}
```

### 2. Updated Dependencies

**File:** `package.json`

- Updated PostCSS to latest stable version: `^8.4.31`
- Updated Autoprefixer to latest version: `^10.4.16`
- Added `postcss-cli` for better tooling support

### 3. Fixed Tailwind Configuration

**File:** `tailwind.config.ts`

Changed from ES modules to CommonJS format to avoid module resolution issues:

```javascript
// Before
import { withUt } from 'uploadthing/tw';

// After
const { withUt } = require('uploadthing/tw');
```

### 4. Added NPM Configuration

**File:** `.npmrc`

Added configuration to handle dependency conflicts:

```ini
legacy-peer-deps=true
package-manager=pnpm@9.11.0
audit=false
frozen-lockfile=true
```

### 5. Created Diagnostic Script

**File:** `scripts/fix-postcss-build.js`

A diagnostic script to identify and fix PostCSS issues:

```bash
npm run fix-postcss
```

## Manual Fixes

If the automated fixes don't work, try these manual steps:

### 1. Clear Dependencies

```bash
# Remove node_modules and lock files
rm -rf node_modules
rm pnpm-lock.yaml

# Reinstall with clean slate
pnpm install
```

### 2. Check for Duplicate Dependencies

```bash
# Check for multiple PostCSS versions
npm ls postcss
```

### 3. Force Resolution

Add resolutions to `package.json`:

```json
{
  "resolutions": {
    "postcss": "^8.4.31"
  }
}
```

### 4. Vercel-Specific Fixes

#### Clear Build Cache
In Vercel dashboard:
1. Go to project settings
2. Find "Build & Development Settings"
3. Click "Clear Build Cache"

#### Update Build Command
Try using a custom build command:

```bash
pnpm install --frozen-lockfile && pnpm run build
```

#### Environment Variables
Add these to Vercel environment variables:
- `NODE_ENV=production`
- `NEXT_TELEMETRY_DISABLED=1`

## Prevention

### 1. Regular Dependency Updates

Keep PostCSS and related packages updated:

```bash
pnpm update postcss autoprefixer tailwindcss
```

### 2. Lock File Management

Always commit lock files and use frozen installs:

```bash
pnpm install --frozen-lockfile
```

### 3. Build Testing

Test builds locally before deploying:

```bash
pnpm run build
```

## Troubleshooting Commands

### Check PostCSS Configuration
```bash
npx postcss --config postcss.config.js --help
```

### Validate Tailwind Configuration
```bash
npx tailwindcss --help
```

### Check for Conflicts
```bash
npm ls postcss
npm ls autoprefixer
npm ls tailwindcss
```

### Run Diagnostic Script
```bash
node scripts/fix-postcss-build.js
```

## Common Issues and Solutions

### Issue: "Cannot find module 'postcss'"
**Solution:** Ensure PostCSS is in devDependencies, not dependencies

### Issue: "Plugin not found"
**Solution:** Use explicit require() statements in PostCSS config

### Issue: "Multiple PostCSS versions"
**Solution:** Use resolutions in package.json to force single version

### Issue: "Build timeout"
**Solution:** Optimize webpack configuration and reduce bundle size

## Support

If issues persist:
1. Run the diagnostic script: `npm run fix-postcss`
2. Check Vercel build logs for specific error messages
3. Clear build cache in Vercel dashboard
4. Consider downgrading to stable versions if using latest releases

## Files Modified

- `postcss.config.js` - Updated plugin configuration
- `package.json` - Updated dependencies and added diagnostic script
- `tailwind.config.ts` - Changed to CommonJS format
- `.npmrc` - Added dependency resolution settings
- `scripts/fix-postcss-build.js` - Created diagnostic script
- `POSTCSS_BUILD_FIX.md` - This documentation

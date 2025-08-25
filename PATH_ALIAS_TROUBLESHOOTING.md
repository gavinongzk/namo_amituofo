# Path Alias Troubleshooting Guide

## Problem Description

You encountered module resolution errors on Vercel builds that work fine locally:

```
Module not found: Can't resolve '@/components/ui/modal'
Module not found: Can't resolve '@/components/shared/AttendanceDetails'
Module not found: Can't resolve '@/components/shared/QrCodeScanner'
```

## Root Cause

This is a common issue caused by **case sensitivity differences** between operating systems:

- **macOS/Windows**: Case-insensitive file systems
- **Linux (Vercel)**: Case-sensitive file system

Your local development works because macOS ignores case, but Vercel's Linux environment is strict about case matching.

## Solution Implemented

### 1. Enhanced TypeScript Configuration (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["./components/*"],
      "@/lib/*": ["./lib/*"],
      "@/types/*": ["./types/*"],
      "@/constants/*": ["./constants/*"]
    }
  }
}
```

### 2. Webpack Alias Configuration (`next.config.js`)

```javascript
webpack: (config, { dev, isServer }) => {
  // Add path aliases for webpack
  config.resolve.alias = {
    ...config.resolve.alias,
    '@': require('path').resolve(__dirname),
    '@/components': require('path').resolve(__dirname, 'components'),
    '@/lib': require('path').resolve(__dirname, 'lib'),
    '@/types': require('path').resolve(__dirname, 'types'),
    '@/constants': require('path').resolve(__dirname, 'constants'),
  };
  // ... rest of webpack config
}
```

### 3. Path Alias Validation Script

Created `scripts/check-path-aliases.js` to validate all imports and catch case sensitivity issues.

## Verification Steps

### 1. Run the validation script
```bash
pnpm run check-aliases
```

### 2. Test local build
```bash
rm -rf .next && pnpm build
```

### 3. Check specific files
```bash
ls -la components/ui/modal.tsx
ls -la components/shared/AttendanceDetails.tsx
ls -la components/shared/QrCodeScanner.tsx
```

## File Verification Results

✅ All files exist with correct case:
- `components/ui/modal.tsx` (lowercase)
- `components/shared/AttendanceDetails.tsx` (PascalCase)
- `components/shared/QrCodeScanner.tsx` (PascalCase)

✅ All imports are valid and resolvable

## Common Causes of This Issue

1. **Case Sensitivity**: File names don't match import statements exactly
2. **Missing Files**: Files were deleted, renamed, or moved
3. **Incorrect Path Aliases**: `tsconfig.json` paths don't match actual file structure
4. **Build Cache Issues**: Stale `.next/` or `node_modules/` causing resolution problems
5. **File Extensions**: Missing or incorrect file extensions

## Prevention Tips

1. **Use the validation script** before deploying:
   ```bash
   pnpm run check-aliases
   ```

2. **Consistent naming conventions**:
   - Use PascalCase for React components
   - Use lowercase for utility files
   - Be consistent with file extensions

3. **Regular cleanup**:
   ```bash
   rm -rf .next node_modules
   pnpm install
   pnpm build
   ```

4. **IDE configuration**: Ensure your IDE respects case sensitivity

## Troubleshooting Commands

```bash
# Check for case sensitivity issues
find components -name "*.tsx" -exec basename {} \; | sort

# Verify file existence
ls -la components/ui/modal.tsx

# Clean build
rm -rf .next && pnpm build

# Validate path aliases
pnpm run check-aliases
```

## Next Steps

1. **Deploy to Vercel** with the updated configuration
2. **Monitor the build logs** for any remaining issues
3. **Run the validation script** regularly during development
4. **Consider using a linter rule** to catch import issues early

## Additional Resources

- [Next.js Path Aliases Documentation](https://nextjs.org/docs/advanced-features/module-path-aliases)
- [TypeScript Path Mapping](https://www.typescriptlang.org/docs/handbook/module-resolution.html#path-mapping)
- [Vercel Build Troubleshooting](https://vercel.com/docs/concepts/deployments/build-step#troubleshooting)

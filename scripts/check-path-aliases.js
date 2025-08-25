#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Define the path aliases from tsconfig.json
const pathAliases = {
  '@': '.',
  '@/components': './components',
  '@/lib': './lib',
  '@/types': './types',
  '@/constants': './constants'
};

// Function to check if a file exists with case sensitivity
function fileExistsCaseSensitive(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.isFile();
  } catch (error) {
    return false;
  }
}

// Function to resolve path alias
function resolvePathAlias(importPath) {
  for (const [alias, aliasPath] of Object.entries(pathAliases)) {
    if (importPath.startsWith(alias)) {
      const relativePath = importPath.replace(alias, aliasPath);
      return path.resolve(relativePath);
    }
  }
  return null;
}

// Function to check if an import can be resolved
function checkImport(importPath, filePath) {
  // Skip node_modules imports
  if (importPath.startsWith('.') || importPath.startsWith('@/')) {
    const resolvedPath = resolvePathAlias(importPath);
    if (resolvedPath) {
      // Try different extensions
      const extensions = ['.tsx', '.ts', '.jsx', '.js', '/index.tsx', '/index.ts', '/index.jsx', '/index.js'];
      
      for (const ext of extensions) {
        const fullPath = resolvedPath + ext;
        if (fileExistsCaseSensitive(fullPath)) {
          return { valid: true, resolvedPath: fullPath };
        }
      }
      
      // Check if it's a directory with index file
      if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isDirectory()) {
        for (const ext of extensions.slice(4)) { // Only index files
          const fullPath = path.join(resolvedPath, ext);
          if (fileExistsCaseSensitive(fullPath)) {
            return { valid: true, resolvedPath: fullPath };
          }
        }
      }
      
      return { valid: false, error: `Cannot resolve: ${importPath}`, filePath };
    }
  }
  return { valid: true, resolvedPath: null };
}

// Function to extract imports from a file
function extractImports(content) {
  const imports = [];
  const importRegex = /import\s+(?:.*?\s+from\s+)?['"`]([^'"`]+)['"`]/g;
  let match;
  
  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  
  return imports;
}

// Main function
function main() {
  console.log('🔍 Checking path aliases and imports...\n');
  
  const errors = [];
  const warnings = [];
  
  // Get all TypeScript and JavaScript files
  const files = glob.sync('**/*.{ts,tsx,js,jsx}', {
    ignore: ['node_modules/**', '.next/**', 'dist/**', 'build/**']
  });
  
  console.log(`📁 Found ${files.length} files to check\n`);
  
  files.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const imports = extractImports(content);
      
      imports.forEach(importPath => {
        const result = checkImport(importPath, file);
        if (!result.valid) {
          errors.push({
            file,
            import: importPath,
            error: result.error
          });
        }
      });
    } catch (error) {
      warnings.push(`Could not read file: ${file} - ${error.message}`);
    }
  });
  
  // Report results
  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ All imports are valid!');
  } else {
    if (errors.length > 0) {
      console.log(`❌ Found ${errors.length} import errors:\n`);
      errors.forEach(error => {
        console.log(`  📄 ${error.file}`);
        console.log(`     Import: ${error.import}`);
        console.log(`     Error: ${error.error}\n`);
      });
    }
    
    if (warnings.length > 0) {
      console.log(`⚠️  Found ${warnings.length} warnings:\n`);
      warnings.forEach(warning => {
        console.log(`  ${warning}\n`);
      });
    }
  }
  
  // Check specific problematic files mentioned in the error
  console.log('🔍 Checking specific files mentioned in Vercel error:\n');
  
  const specificFiles = [
    'components/ui/modal.tsx',
    'components/shared/AttendanceDetails.tsx',
    'components/shared/QrCodeScanner.tsx'
  ];
  
  specificFiles.forEach(file => {
    if (fileExistsCaseSensitive(file)) {
      console.log(`✅ ${file} exists`);
    } else {
      console.log(`❌ ${file} does not exist`);
    }
  });
  
  // Check case sensitivity
  console.log('\n🔍 Checking for case sensitivity issues:\n');
  
  const caseSensitiveChecks = [
    { path: 'components/ui/modal.tsx', expected: 'modal.tsx' },
    { path: 'components/shared/AttendanceDetails.tsx', expected: 'AttendanceDetails.tsx' },
    { path: 'components/shared/QrCodeScanner.tsx', expected: 'QrCodeScanner.tsx' }
  ];
  
  caseSensitiveChecks.forEach(check => {
    const dir = path.dirname(check.path);
    const expectedFile = check.expected;
    
    try {
      const files = fs.readdirSync(dir);
      const found = files.find(file => file === expectedFile);
      
      if (found) {
        console.log(`✅ ${check.path} - case matches`);
      } else {
        const similar = files.find(file => file.toLowerCase() === expectedFile.toLowerCase());
        if (similar) {
          console.log(`⚠️  ${check.path} - case mismatch: found ${similar}, expected ${expectedFile}`);
        } else {
          console.log(`❌ ${check.path} - file not found`);
        }
      }
    } catch (error) {
      console.log(`❌ ${check.path} - directory not found: ${error.message}`);
    }
  });
  
  if (errors.length > 0) {
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { checkImport, resolvePathAlias };

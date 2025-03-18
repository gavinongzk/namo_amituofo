import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

try {
  // Generate a new version number based on timestamp
  const newVersion = Date.now().toString();

  // Get current file's directory
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // Path to version.js
  const versionFilePath = path.join(__dirname, '../public/version.js');

  // Create version.js content
  const versionFileContent = `// Auto-generated on: ${new Date().toISOString()}
// Application version number for debugging purposes
window.APP_VERSION = '${newVersion}';

// Deployment timestamp for debugging
window.LAST_DEPLOY_TIME = '${new Date().toISOString()}';`;

  // Write to file
  fs.writeFileSync(versionFilePath, versionFileContent);

  console.log(`Updated version to ${newVersion}`);
} catch (error) {
  console.error('Error updating version:', error);
  process.exit(1);
}

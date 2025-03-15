const fs = require('fs');
const path = require('path');

// Generate a new version number based on timestamp
const newVersion = Date.now().toString();

// Path to version.js
const versionFilePath = path.join(__dirname, '../public/version.js');

// Create version.js content
const versionFileContent = `// Auto-generated on: ${new Date().toISOString()}
// Update this version number whenever you deploy changes to Vercel
// This will force the service worker to update and refresh content for users
window.APP_VERSION = '${newVersion}';

// You can also add deployment timestamp for debugging
window.LAST_DEPLOY_TIME = '${new Date().toISOString()}';
`;

// Write to file
fs.writeFileSync(versionFilePath, versionFileContent);

console.log(`Updated version to ${newVersion}`); 
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import https from 'https';

// Use /tmp in serverless environments, otherwise use .image-cache in project root
const CACHE_DIR = process.env.AWS_LAMBDA_FUNCTION_NAME 
  ? path.join('/tmp', '.image-cache')
  : path.join(process.cwd(), '.image-cache');
const CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

// Ensure cache directory exists with better error handling
try {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
} catch (error) {
  console.warn('Failed to create image cache directory:', error);
  // Continue execution - the getCachedImagePath function will handle the fallback
}

// Generate a hash for the URL to use as filename
const getHashedFilename = (url: string) => {
  return crypto.createHash('md5').update(url).digest('hex') + '.jpg';
};

// Check if cached file exists and is not expired
const isCacheValid = (filepath: string): boolean => {
  try {
    const stats = fs.statSync(filepath);
    const age = Date.now() - stats.mtimeMs;
    return age < CACHE_MAX_AGE;
  } catch {
    return false;
  }
};

// Download and cache the image
const downloadImage = (url: string, filepath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image: ${response.statusCode}`));
        return;
      }

      const fileStream = fs.createWriteStream(filepath);
      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });

      fileStream.on('error', (err) => {
        fs.unlink(filepath, () => reject(err));
      });
    }).on('error', reject);
  });
};

// Main function to get cached image path or download if needed
export const getCachedImagePath = async (url: string): Promise<string> => {
  if (!url.startsWith('https://')) {
    return url; // Return as-is if not an HTTPS URL
  }

  const hashedFilename = getHashedFilename(url);
  const cachedPath = path.join(CACHE_DIR, hashedFilename);

  // If cache exists and is valid, return cached path
  if (isCacheValid(cachedPath)) {
    return cachedPath;
  }

  // Download and cache the image
  try {
    await downloadImage(url, cachedPath);
    return cachedPath;
  } catch (error) {
    console.error('Error caching image:', error);
    return url; // Fallback to original URL if caching fails
  }
};

// Clean up expired cache files
export const cleanupImageCache = () => {
  try {
    const files = fs.readdirSync(CACHE_DIR);
    const now = Date.now();

    files.forEach(file => {
      const filepath = path.join(CACHE_DIR, file);
      const stats = fs.statSync(filepath);
      const age = now - stats.mtimeMs;

      if (age > CACHE_MAX_AGE) {
        fs.unlinkSync(filepath);
      }
    });
  } catch (error) {
    console.error('Error cleaning up image cache:', error);
  }
};

// Run cleanup periodically (e.g., once a day)
setInterval(cleanupImageCache, 24 * 60 * 60 * 1000); 
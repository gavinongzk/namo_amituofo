'use client';

import React, { useState } from 'react';
import QrCodeScanner from '@/components/shared/QrCodeScanner';
import { Button } from '@/components/ui/button';
import { Camera, X } from 'lucide-react';

export default function TestQrScannerPage() {
  const [showScanner, setShowScanner] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState<string>('');

  const handleScan = (decodedText: string) => {
    console.log('QR Code scanned:', decodedText);
    setLastScannedCode(decodedText);
    // Optionally close scanner after successful scan
    // setShowScanner(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Camera className="h-6 w-6" />
            QR Scanner Test
          </h1>
          <p className="text-gray-600 mb-6">
            This page tests the QR code scanner functionality to ensure the camera works properly.
          </p>
          
          <div className="flex gap-4 mb-6">
            <Button 
              onClick={() => setShowScanner(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Camera className="h-4 w-4 mr-2" />
              Open QR Scanner
            </Button>
            
            {showScanner && (
              <Button 
                onClick={() => setShowScanner(false)}
                variant="outline"
              >
                <X className="h-4 w-4 mr-2" />
                Close Scanner
              </Button>
            )}
          </div>

          {lastScannedCode && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <h3 className="text-green-800 font-semibold mb-2">Last Scanned Code:</h3>
              <p className="text-green-700 font-mono text-sm break-all">{lastScannedCode}</p>
            </div>
          )}
        </div>

        {showScanner && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">QR Code Scanner</h2>
            <QrCodeScanner 
              onScan={handleScan} 
              onClose={() => setShowScanner(false)} 
            />
          </div>
        )}

        {!showScanner && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Instructions</h2>
            <div className="space-y-3 text-gray-600">
              <p>1. Click &quot;Open QR Scanner&quot; to start the camera</p>
              <p>2. Allow camera permissions when prompted</p>
              <p>3. Point the camera at a QR code</p>
              <p>4. The scanned code will appear above</p>
              <p>5. Use the flashlight button if needed for better lighting</p>
              <p>6. Switch cameras if multiple cameras are available</p>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-blue-800 font-semibold mb-2">Troubleshooting:</h3>
              <ul className="text-blue-700 text-sm space-y-1">
                              <li>• Make sure you&apos;re using HTTPS or localhost</li>
              <li>• Allow camera permissions in your browser</li>
              <li>• Close other apps that might be using the camera</li>
              <li>• Try refreshing the page if the camera doesn&apos;t start</li>
              <li>• Use Chrome, Firefox, or Safari for best compatibility</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

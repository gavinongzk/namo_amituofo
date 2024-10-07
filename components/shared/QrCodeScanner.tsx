'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QrCodeScannerProps {
  onScan: (decodedText: string) => void;
  onError: (errorMessage: string) => void;
}

const QrCodeScanner: React.FC<QrCodeScannerProps> = ({ onScan, onError }) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 5;

    const initializeScanner = async () => {
      if (retryCount >= maxRetries) {
        onError("Failed to initialize camera after multiple attempts");
        return;
      }

      try {
        scannerRef.current = new Html5Qrcode("qr-reader");
        await scannerRef.current.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            onScan(decodedText);
          },
          (errorMessage) => {
            console.log(errorMessage);
          }
        );
        setIsInitialized(true);
      } catch (err) {
        console.error("Error initializing scanner:", err);
        retryCount++;
        setTimeout(initializeScanner, 1000); // Retry after 1 second
      }
    };

    const timer = setTimeout(initializeScanner, 1000); // Initial delay before first attempt

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [onScan, onError]);

  return (
    <div>
      <div id="qr-reader" style={{ width: '100%', maxWidth: '500px' }} />
      {!isInitialized && <p>Initializing camera...</p>}
    </div>
  );
};

export default QrCodeScanner;

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
    const maxRetries = 10;
    let timeoutId: NodeJS.Timeout;

    const initializeScanner = async () => {
      if (retryCount >= maxRetries) {
        onError("Failed to initialize camera after multiple attempts. Please check camera permissions and try again.");
        return;
      }

      try {
        const qrReaderElement = document.getElementById("qr-reader");
        if (!qrReaderElement) {
          throw new Error("QR reader element not found");
        }

        if (!scannerRef.current) {
          scannerRef.current = new Html5Qrcode("qr-reader");
        }

        const cameras = await Html5Qrcode.getCameras();
        if (cameras && cameras.length > 0) {
          const cameraId = cameras[cameras.length - 1].id;
          await scannerRef.current.start(
            cameraId,
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
            },
            (decodedText) => {
              onScan(decodedText);
            },
            (errorMessage) => {
              console.log("QR Code scanning error:", errorMessage);
            }
          );
          setIsInitialized(true);
        } else {
          throw new Error("No cameras found on the device.");
        }
      } catch (err) {
        console.error("Error initializing scanner:", err);
        retryCount++;
        timeoutId = setTimeout(initializeScanner, 1000);
      }
    };

    // Delay the initial scanner initialization
    timeoutId = setTimeout(initializeScanner, 1000);

    return () => {
      clearTimeout(timeoutId);
      if (scannerRef.current) {
        scannerRef.current.stop().catch((err) => {
          console.warn("Error stopping scanner:", err);
        });
      }
    };
  }, [onScan, onError]);

  return (
    <div>
      <div id="qr-reader" style={{ width: '100%', maxWidth: '500px' }} />
      {!isInitialized && <p>Initializing camera... Please grant camera permissions if prompted.</p>}
    </div>
  );
};

export default QrCodeScanner;

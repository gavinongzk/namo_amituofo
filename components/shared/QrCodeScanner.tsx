'use client';

import React, { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QrCodeScannerProps {
  onScan: (decodedText: string) => void;
  onError: (errorMessage: string) => void;
}

const QrCodeScanner: React.FC<QrCodeScannerProps> = ({ onScan, onError }) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    scannerRef.current = new Html5Qrcode("qr-reader");

    const startScanning = async () => {
      try {
        await scannerRef.current?.start(
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
      } catch (err) {
        onError(err instanceof Error ? err.message : String(err));
      }
    };

    startScanning();

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [onScan, onError]);

  return (
    <div>
      <div id="qr-reader" style={{ width: '100%', maxWidth: '500px' }} />
    </div>
  );
};

export default QrCodeScanner;

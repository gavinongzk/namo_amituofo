'use client';

import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface QrCodeScannerProps {
  onScan: (decodedText: string) => void;
  onError: (errorMessage: string) => void;
}

const QrCodeScanner: React.FC<QrCodeScannerProps> = ({ onScan, onError }) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    scannerRef.current = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: 250,
        aspectRatio: 1.0,
        disableFlip: false,
        videoConstraints: {
          facingMode: { exact: "environment" }
        }
      },
      false
    );

    scannerRef.current.render(onScan, onError);

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => {
          console.error("Failed to clear scanner", error);
        });
      }
    };
  }, [onScan, onError]);

  return <div id="qr-reader" style={{ width: '100%', maxWidth: '500px' }} />;
};

export default QrCodeScanner;

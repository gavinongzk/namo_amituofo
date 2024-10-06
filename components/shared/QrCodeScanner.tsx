import React, { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QrCodeScannerProps {
  onScan: (decodedText: string, decodedResult: any) => void;
  onError?: (errorMessage: string) => void;
}

const qrConfig = { fps: 10, qrbox: { width: 250, height: 250 } };

const QrCodeScanner: React.FC<QrCodeScannerProps> = ({ onScan, onError }) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    scannerRef.current = new Html5Qrcode('reader');

    const startScanner = async () => {
      try {
        await scannerRef.current?.start(
          { facingMode: 'environment' },
          qrConfig,
          onScan,
          onError
        );
      } catch (err) {
        console.error('Failed to start scanner:', err);
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(err => console.error('Failed to stop scanner:', err));
      }
    };
  }, [onScan, onError]);

  return <div id="reader" style={{ width: '100%' }} />;
};

export default QrCodeScanner;

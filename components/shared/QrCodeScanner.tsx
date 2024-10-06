import React, { useEffect, useImperativeHandle, forwardRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface QrCodeScannerProps {
  onScan: (decodedText: string) => void;
  onError: (errorMessage: string) => void;
}

export interface QrCodeScannerRef {
  pause: () => void;
  resume: () => void;
}

const QrCodeScanner = forwardRef<QrCodeScannerRef, QrCodeScannerProps>(({ onScan, onError }, ref) => {
  const scannerRef = React.useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    scannerRef.current = new Html5QrcodeScanner(
      'reader',
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    scannerRef.current.render(onScan, onError);

    return () => {
      scannerRef.current?.clear().catch(error => {
        console.error('Failed to clear scanner', error);
      });
    };
  }, [onScan, onError]);

  useImperativeHandle(ref, () => ({
    pause: () => {
      scannerRef.current?.pause();
    },
    resume: () => {
      scannerRef.current?.resume();
    },
  }));

  return <div id="reader" />;
});

export default QrCodeScanner;

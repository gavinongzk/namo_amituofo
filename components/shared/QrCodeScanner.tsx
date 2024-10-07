'use client';

import React from 'react';
import { QrReader } from 'react-qr-reader';

interface QrCodeScannerProps {
  onScan: (decodedText: string) => void;
}

const QrCodeScanner: React.FC<QrCodeScannerProps> = ({ onScan }) => {
  const handleScan = (result: any) => {
    if (result) {
      onScan(result?.text);
    }
  };

  return (
    <div>
      <QrReader
        onResult={handleScan}
        constraints={{ facingMode: 'environment' }}
        containerStyle={{ width: '100%', maxWidth: '500px' }}
        videoStyle={{ width: '100%' }}
      />
      <p className="mt-2 text-sm text-gray-600">
        Position the QR code within the frame to scan.
        <br />
        将二维码置于框内以进行扫描。
      </p>
    </div>
  );
};

export default QrCodeScanner;

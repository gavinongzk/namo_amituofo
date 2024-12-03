'use client';

import React, { useEffect, useRef, useState } from 'react';
import { BrowserQRCodeReader } from '@zxing/browser';
import { Button } from '@/components/ui/button';
import { Flashlight, FlashlightOff, Loader2 as Loader2Icon } from 'lucide-react';

interface QrCodeScannerProps {
  onScan: (decodedText: string) => void;
}

const QrCodeScanner: React.FC<QrCodeScannerProps> = ({ onScan }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [activeCamera, setActiveCamera] = useState<string>();
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [error, setError] = useState<string>();
  const [isRetrying, setIsRetrying] = useState(false);
  const lastScanTime = useRef(0);
  const scannerRef = useRef<{ stop: () => void }>();

  const initializeScanner = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === 'videoinput');
      setCameras(videoDevices);
      
      const backCamera = videoDevices.find(device => 
        device.label.toLowerCase().includes('back'));
      setActiveCamera(backCamera?.deviceId || videoDevices[0]?.deviceId);

      const codeReader = new BrowserQRCodeReader();
      let active = true;

      const controls = await codeReader.decodeFromVideoDevice(
        activeCamera,
        videoRef.current!,
        (result) => {
          if (result && active) {
            const now = Date.now();
            if (now - lastScanTime.current < 1500) return;
            lastScanTime.current = now;
            handleSuccessfulScan(result.getText());
          }
        }
      );

      scannerRef.current = controls;

      return () => {
        active = false;
        controls.stop();
      };
    } catch (err: any) {
      handleError(err);
    }
  };

  const handleSuccessfulScan = (text: string) => {
    // Vibrate if supported
    if (navigator.vibrate) {
      navigator.vibrate(200);
    }
    
    // Play success sound
    new Audio('/assets/sounds/success-beep.mp3').play()
      .catch(e => console.error('Error playing audio:', e));
      
    onScan(text);
  };

  const handleError = (err: Error) => {
    if (err.name === 'NotAllowedError') {
      setError('Camera access denied. Please enable camera permissions.');
    } else if (err.name === 'NotFoundError') {
      setError('No camera found. Please connect a camera.');
    } else {
      setError(err.message);
    }
  };

  const toggleTorch = async () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    const track = stream?.getTracks().find(track => track.kind === 'video');
      
    if (track && 'getCapabilities' in track) {
      const capabilities = track.getCapabilities() as MediaTrackCapabilities & { torch?: boolean };
      if (capabilities.torch) {
        try {
          await track.applyConstraints({
            advanced: [{ torch: !torchEnabled } as any]
          });
          setTorchEnabled(!torchEnabled);
        } catch (err) {
          console.error('Error toggling torch:', err);
        }
      }
    }
  };

  const retry = async () => {
    setIsRetrying(true);
    setError(undefined);
    try {
      await initializeScanner();
    } finally {
      setIsRetrying(false);
    }
  };

  useEffect(() => {
    const cleanup = initializeScanner();
    return () => {
      cleanup?.then(cleanupFn => cleanupFn?.());
    };
  }, [activeCamera]);

  return (
    <div className="relative w-full max-w-[500px] mx-auto">
      <div className="relative aspect-video">
        <video 
          ref={videoRef}
          className="w-full h-full object-cover rounded-lg"
        />
        
        {/* Scanning Guide Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="w-full h-full relative">
            {/* Corner guides */}
            <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-primary-500" />
            <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-primary-500" />
            <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-primary-500" />
            <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-primary-500" />
            
            {/* Scanning line animation */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary-500 animate-scan" />
          </div>
        </div>

        {/* Camera Controls */}
        <div className="absolute top-4 right-4 flex gap-2">
          {cameras.length > 1 && (
            <select 
              value={activeCamera}
              onChange={e => setActiveCamera(e.target.value)}
              className="bg-background/80 rounded-md px-2 py-1 text-sm"
            >
              {cameras.map(camera => (
                <option key={camera.deviceId} value={camera.deviceId}>
                  {camera.label || `Camera ${camera.deviceId.slice(0, 4)}`}
                </option>
              ))}
            </select>
          )}
          
          <Button 
            onClick={toggleTorch}
            variant="outline" 
            size="icon"
            className="bg-background/80"
          >
            {torchEnabled ? <FlashlightOff className="h-4 w-4" /> : <Flashlight className="h-4 w-4" />}
          </Button>
        </div>

        {/* Error State */}
        {error && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <div className="text-center p-4">
              <p className="text-destructive mb-4">{error}</p>
              <Button 
                onClick={retry} 
                disabled={isRetrying}
              >
                {isRetrying ? <Loader2Icon className="animate-spin" /> : 'Retry'}
              </Button>
            </div>
          </div>
        )}
      </div>

      <p className="mt-2 text-sm text-gray-600 text-center">
        Position the QR code within the frame to scan.
        <br />
        将二维码置于框内以进行扫描。
      </p>
    </div>
  );
};

export default QrCodeScanner;

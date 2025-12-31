'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Html5Qrcode, CameraDevice } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Flashlight, FlashlightOff, Loader2 as Loader2Icon } from 'lucide-react';

interface QrCodeScannerProps {
  onScan: (decodedText: string) => void;
  onClose?: () => void;
}

const QrCodeScanner: React.FC<QrCodeScannerProps> = ({ onScan, onClose }) => {
  const [error, setError] = useState<string>();
  const [isScanning, setIsScanning] = useState(false);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [activeCameraId, setActiveCameraId] = useState<string>('');
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [isDecodingImage, setIsDecodingImage] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScanRef = useRef<{ value: string; at: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoTrackRef = useRef<MediaStreamTrack | null>(null);

  const handleSuccessfulScan = useCallback((text: string) => {
    // Vibrate if supported
    if (navigator.vibrate) {
      navigator.vibrate(200);
    }
    onScan(text);
  }, [onScan]);

  const listCameras = useCallback(async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      setCameras(devices);
      if (devices.length > 0 && !activeCameraId) {
        // Prefer back camera on mobile devices
        const backCamera = devices.find(device => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('rear') ||
          device.label.toLowerCase().includes('environment')
        );
        setActiveCameraId(backCamera?.id || devices[0].id);
      }
      return devices;
    } catch (err) {
      console.error('Error listing cameras:', err);
      return [];
    }
  }, [activeCameraId]);

  const startScanning = useCallback(async (cameraId?: string) => {
    if (!containerRef.current) return;

    const cameraIdToUse = cameraId || activeCameraId;
    if (!cameraIdToUse) {
      const cameras = await listCameras();
      if (cameras.length === 0) {
        throw new Error('No cameras found on this device.');
      }
      const idToUse = cameras.find(c => 
        c.label.toLowerCase().includes('back') || 
        c.label.toLowerCase().includes('rear') ||
        c.label.toLowerCase().includes('environment')
      )?.id || cameras[0].id;
      setActiveCameraId(idToUse);
      await startScanning(idToUse);
      return;
    }

    try {
      setError(undefined);
      
      // Create scanner instance if it doesn't exist
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(containerRef.current.id);
      }

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        disableFlip: false,
        videoConstraints: {
          facingMode: 'environment' as const,
        },
      };

      await scannerRef.current.start(
        cameraIdToUse,
        config,
        (decodedText) => {
          const nowMs = Date.now();
          const last = lastScanRef.current;
          // De-dupe rapid repeat detections of the same QR
          if (last && last.value === decodedText && nowMs - last.at < 1200) {
            return;
          }
          lastScanRef.current = { value: decodedText, at: nowMs };
          handleSuccessfulScan(decodedText);
        },
        (errorMessage) => {
          // Ignore scanning errors - they're expected when no QR is visible
        }
      );

      setIsScanning(true);
      
      // Get video track for torch control (with a small delay to ensure video element is ready)
      setTimeout(() => {
        try {
          const videoElement = containerRef.current?.querySelector('video');
          if (videoElement && videoElement.srcObject) {
            const stream = videoElement.srcObject as MediaStream;
            const tracks = stream.getVideoTracks();
            if (tracks.length > 0) {
              videoTrackRef.current = tracks[0];
            }
          }
        } catch (e) {
          console.warn('Could not get video track for torch:', e);
        }
      }, 500);
    } catch (err: any) {
      console.error('Error starting scanner:', err);
      let errorMessage = 'Failed to start camera. ';
      
      if (err.name === 'NotAllowedError' || err.message.includes('denied')) {
        errorMessage = 'Camera access denied. Please enable camera permissions in your browser settings and refresh the page.';
      } else if (err.name === 'NotFoundError' || err.message.includes('No cameras')) {
        errorMessage = 'No camera found. Please ensure your device has a camera.';
      } else if (err.name === 'NotReadableError' || err.message.includes('in use')) {
        errorMessage = 'Camera is in use by another application. Please close other apps using the camera and try again.\n摄像头被其他应用占用，请关闭其他应用后重试。';
      } else {
        errorMessage = `Camera error: ${err.message || 'Unknown error'}. Please refresh the page or try a different browser.`;
      }
      
      setError(errorMessage);
      setIsScanning(false);
    }
  }, [activeCameraId, handleSuccessfulScan, listCameras]);

  const stopScanning = useCallback(async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
      scannerRef.current.clear();
      setIsScanning(false);
      videoTrackRef.current = null;
    }
  }, [isScanning]);

  const toggleTorch = useCallback(async () => {
    const track = videoTrackRef.current;
    if (!track || !('getCapabilities' in track)) return;

    try {
      const capabilities = track.getCapabilities() as MediaTrackCapabilities & { torch?: boolean };
      if (capabilities.torch) {
        await track.applyConstraints({
          advanced: [{ torch: !torchEnabled } as any]
        });
        setTorchEnabled(!torchEnabled);
      }
    } catch (err) {
      console.error('Error toggling torch:', err);
    }
  }, [torchEnabled]);

  const handleCameraChange = useCallback(async (newCameraId: string) => {
    setActiveCameraId(newCameraId);
    await stopScanning();
    setTimeout(() => {
      startScanning(newCameraId);
    }, 100);
  }, [startScanning, stopScanning]);

  const decodeFromImageFile = useCallback(async (file: File) => {
    setIsDecodingImage(true);
    setError(undefined);
    
    try {
      // Use a temporary scanner instance for file scanning (scanFile doesn't need container ID)
      const tempScanner = new Html5Qrcode(containerRef.current?.id || 'temp-qr-reader');
      try {
        const decodedText = await tempScanner.scanFile(file, false);
        if (decodedText) {
          handleSuccessfulScan(decodedText.trim());
        } else {
          throw new Error('No QR code found in the selected image.');
        }
      } finally {
        // Clean up temp scanner
        try {
          await tempScanner.clear();
        } catch {
          // Ignore cleanup errors
        }
      }
    } catch (err: any) {
      console.error('Failed to decode image QR:', err);
      if (err.message && !err.message.includes('No QR')) {
        setError(`Scan from photo failed: ${err.message}`);
      } else {
        setError('No QR code found in the selected image. Please try another image.');
      }
    } finally {
      setIsDecodingImage(false);
    }
  }, [handleSuccessfulScan]);

  const torchAvailable = videoTrackRef.current && 
    'getCapabilities' in videoTrackRef.current &&
    (videoTrackRef.current.getCapabilities() as MediaTrackCapabilities & { torch?: boolean }).torch;

  // Initialize cameras on mount
  useEffect(() => {
    listCameras();
  }, [listCameras]);

  // Start scanning when camera is selected
  useEffect(() => {
    if (activeCameraId && !isScanning) {
      startScanning();
    }
    
    return () => {
      stopScanning();
    };
  }, [activeCameraId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning();
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    };
  }, [stopScanning]);

  // Handle visibility change
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        stopScanning();
      } else if (activeCameraId) {
        startScanning();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [activeCameraId, startScanning, stopScanning]);

  return (
    <div className="relative w-full max-w-[500px] mx-auto px-2 sm:px-0">
      <div className="relative aspect-square">
        <div
          id="qr-reader"
          ref={containerRef}
          className="w-full h-full rounded-lg overflow-hidden"
          style={{ position: 'relative' }}
        />

        {/* Scanning Guide Overlay */}
        <div className="absolute inset-0 pointer-events-none z-10">
          <div className="w-full h-full relative">
            {/* Corner guides */}
            <div className="absolute top-0 left-0 w-16 h-16 sm:w-24 sm:h-24 border-t-[3px] sm:border-t-4 border-l-[3px] sm:border-l-4 border-primary-500" />
            <div className="absolute top-0 right-0 w-16 h-16 sm:w-24 sm:h-24 border-t-[3px] sm:border-t-4 border-r-[3px] sm:border-r-4 border-primary-500" />
            <div className="absolute bottom-0 left-0 w-16 h-16 sm:w-24 sm:h-24 border-b-[3px] sm:border-b-4 border-l-[3px] sm:border-l-4 border-primary-500" />
            <div className="absolute bottom-0 right-0 w-16 h-16 sm:w-24 sm:h-24 border-b-[3px] sm:border-b-4 border-r-[3px] sm:border-r-4 border-primary-500" />
            
            {/* Scanning line animation */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary-500 animate-scan" />
          </div>
        </div>

        {/* Camera Controls */}
        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-20 flex flex-col sm:flex-row gap-1.5 sm:gap-2">
          <div className="flex gap-1.5 sm:gap-2">
            {cameras.length > 1 && (
              <select 
                value={activeCameraId}
                onChange={e => handleCameraChange(e.target.value)}
                className="bg-background/90 backdrop-blur-sm rounded-md px-1.5 sm:px-2 py-1 text-xs sm:text-sm border border-border/50 min-w-0 flex-shrink"
              >
                {cameras.map(camera => (
                  <option key={camera.id} value={camera.id}>
                    {camera.label || `Camera ${camera.id.slice(0, 4)}`}
                  </option>
                ))}
              </select>
            )}

            {/* Scan from photo */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                void decodeFromImageFile(file);
                e.currentTarget.value = '';
              }}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              size="sm"
              className="bg-background/90 backdrop-blur-sm border-border/50 text-xs sm:text-sm px-2 sm:px-3 h-8 sm:h-9"
              disabled={isDecodingImage}
            >
              <span className="hidden sm:inline">{isDecodingImage ? 'Scanning…' : 'Scan Photo'}</span>
              <span className="sm:hidden">{isDecodingImage ? '…' : '📷'}</span>
            </Button>
            
            <Button 
              onClick={toggleTorch}
              variant="outline" 
              size="icon"
              className="bg-background/90 backdrop-blur-sm border-border/50 h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0"
              disabled={!torchAvailable}
            >
              {torchEnabled ? <FlashlightOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Flashlight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
            </Button>
          </div>

          {/* Turn Off Camera Button */}
          {!error && isScanning && (
            <Button 
              onClick={() => {
                stopScanning();
                if (onClose) onClose();
              }}
              variant="destructive"
              size="sm"
              className="bg-red-500/90 backdrop-blur-sm hover:bg-red-600 text-white text-xs sm:text-sm px-2 sm:px-3 h-8 sm:h-9 w-full sm:w-auto"
            >
              <span className="hidden sm:inline">Turn Off Camera</span>
              <span className="sm:hidden">Turn Off</span>
            </Button>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center p-4 z-30">
            <div className="text-center max-w-full">
              <p className="text-xs sm:text-sm text-destructive mb-4 whitespace-pre-line break-words">{error}</p>
              <Button 
                onClick={() => {
                  setError(undefined);
                  if (activeCameraId) {
                    startScanning();
                  }
                }}
                className="text-xs sm:text-sm px-4 py-2"
              >
                Retry / 重试
              </Button>
            </div>
          </div>
        )}
      </div>

      <p className="mt-2 text-xs sm:text-sm text-gray-600 text-center px-2">
        将二维码置于框内以进行扫描。
        <br className="hidden sm:block" />
        <span className="sm:hidden"> / </span>
        Position the QR code within the frame to scan.
      </p>
    </div>
  );
};

export default QrCodeScanner;
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
  const [isSafari, setIsSafari] = useState(false);
  const lastScanTime = useRef(0);
  const scannerRef = useRef<{ stop: () => void }>();

  useEffect(() => {
    // Check if running on Safari
    const isSafariBrowser = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    setIsSafari(isSafariBrowser);
  }, []);

  const checkBrowserCompatibility = () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Your browser doesn\'t support camera access. Please use a modern browser like Chrome, Firefox, or Safari.');
    }

    // Check if running in insecure context
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      throw new Error('Camera access requires a secure (HTTPS) connection.');
    }
  };

  const initializeScanner = async () => {
    try {
      checkBrowserCompatibility();

      // First explicitly request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          facingMode: 'environment' // Prefer back camera initially
        }
      });

      // For Safari: manually set the video stream
      if (isSafari && videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(err => {
          console.error('Safari video play error:', err);
        });
      }
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === 'videoinput');
      
      if (videoDevices.length === 0) {
        throw new Error('No cameras found on this device.');
      }
      
      setCameras(videoDevices);
      
      // Prefer back camera for mobile devices
      const backCamera = videoDevices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear')
      );
      
      const selectedCamera = backCamera?.deviceId || videoDevices[0]?.deviceId;
      setActiveCamera(selectedCamera);

      if (!selectedCamera) {
        throw new Error('Failed to select a camera.');
      }

      const codeReader = new BrowserQRCodeReader(undefined, {
        delayBetweenScanAttempts: 100,
        delayBetweenScanSuccess: 1500
      });
      
      let active = true;

      const constraints = {
        video: {
          deviceId: selectedCamera,
          facingMode: backCamera ? 'environment' : 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
          // Add Safari-specific constraints
          ...(isSafari ? { 
            frameRate: { ideal: 30 },
            aspectRatio: { ideal: 16/9 }
          } : {})
        }
      };

      const controls = await codeReader.decodeFromVideoDevice(
        selectedCamera,
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

      // Check if video is actually playing
      const videoElement = videoRef.current;
      if (videoElement && !isSafari) { // Skip for Safari as we handle it differently
        videoElement.onloadedmetadata = () => {
          videoElement.play().catch(err => {
            console.error('Error playing video:', err);
            handleError(new Error('Failed to start video stream'));
          });
        };
      }

      return () => {
        active = false;
        if (controls) {
          controls.stop();
        }
        // Clean up video stream
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
      };
    } catch (err: any) {
      handleError(err);
      return () => {};
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
    console.error('QR Scanner Error:', err);
    if (err.name === 'NotAllowedError' || err.message.includes('denied')) {
      setError('Camera access denied. Please enable camera permissions in your browser settings and refresh the page.');
    } else if (err.name === 'NotFoundError' || err.message.includes('No cameras')) {
      setError('No camera found. Please ensure your device has a camera and it\'s not being used by another application.');
    } else if (err.name === 'NotReadableError' || err.message.includes('hardware')) {
      setError('Camera is in use by another application or not accessible. Please close other apps using the camera and try again.');
    } else if (err.name === 'NotSupportedError' || err.message.includes('support')) {
      setError('Your browser doesn\'t fully support camera access. Please try Chrome, Firefox, or Safari.');
    } else {
      setError(`Camera error: ${err.message}. Please refresh the page or try a different browser.`);
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

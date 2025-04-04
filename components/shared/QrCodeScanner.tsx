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

  // Renamed: Sets up camera list and selects the initial active camera ID
  const setupCameraSelection = async () => {
    try {
      checkBrowserCompatibility();

      // Request permission minimally, then release immediately
      try {
        const permissionStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        permissionStream.getTracks().forEach(track => track.stop());
      } catch (permError: any) {
        // Handle permission denied specifically
        if (permError.name === 'NotAllowedError') {
           handleError(new Error('Camera permission denied. Please grant permission in your browser settings.'));
           return; // Stop if permission denied
        }
        // Log other permission errors but attempt to continue, enumerateDevices might still work
        console.warn('Error during initial permission request:', permError);
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === 'videoinput');

      if (videoDevices.length === 0) {
        // Throw specific error if no devices found after attempting permission
        throw new Error('No cameras found on this device.');
      }

      setCameras(videoDevices);

      // Select camera (prefer back, fallback to first)
      const backCamera = videoDevices.find(device =>
        device.label.toLowerCase().includes('back') ||
        device.label.toLowerCase().includes('rear')
      );
      // Use the current activeCamera if it exists and is valid, otherwise select default
      const currentIsValid = activeCamera && videoDevices.some(d => d.deviceId === activeCamera);
      const selectedCamera = currentIsValid ? activeCamera : (backCamera?.deviceId || videoDevices[0]?.deviceId);


      if (!selectedCamera) {
         throw new Error('Failed to select a camera.');
      }

      // Set the active camera state, which will trigger the scanning useEffect
      // Only update if it's different to avoid unnecessary effect runs
      if (selectedCamera !== activeCamera) {
        setActiveCamera(selectedCamera);
      }

    } catch (err: any) {
      handleError(err);
    }
  };

  const handleSuccessfulScan = (text: string) => {
    // Vibrate if supported
    if (navigator.vibrate) {
      navigator.vibrate(200);
    }
    
    // Don't play sound here as it's handled by the parent component
    
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

  // Retry logic now calls setupCameraSelection
  const retry = async () => {
    setIsRetrying(true);
    setError(undefined);
    // Don't reset activeCamera here, let setupCameraSelection re-evaluate
    scannerRef.current?.stop(); // Stop any existing scanner
    scannerRef.current = undefined;
    if (videoRef.current?.srcObject) { // Clean up video element immediately on retry
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
    }
    try {
      await setupCameraSelection(); // Re-run the selection and initialization process
    } finally {
      setIsRetrying(false);
    }
  };
// Effect to setup camera selection on mount
useEffect(() => {
  setupCameraSelection();
  // Cleanup function for scanner is handled in the next useEffect
}, []); // Run only once on mount

// Effect to start/restart scanning when activeCamera changes or videoRef is ready
useEffect(() => {
  if (!activeCamera || !videoRef.current) {
    return; // Wait for camera selection and video element ref
  }

  // Ensure previous scanner is stopped before starting a new one
  scannerRef.current?.stop();

  const codeReader = new BrowserQRCodeReader(undefined, {
    delayBetweenScanAttempts: 100,
    delayBetweenScanSuccess: 1500
  });

  let active = true;
  let controls: { stop: () => void } | null = null;

  console.log(`Attempting to use camera: ${activeCamera}`); // Debug log

  const startScan = async () => {
      try {
          // Let the library handle getting the stream via deviceId
          controls = await codeReader.decodeFromVideoDevice(
              activeCamera,
              videoRef.current!, // videoRef is checked above
              (result) => {
                  if (result && active) {
                      handleSuccessfulScan(result.getText());
                  }
              }
          );
          scannerRef.current = controls;
          setError(undefined); // Clear previous errors on successful start
      } catch (err: any) {
          console.error(`Error starting scanner for device ${activeCamera}:`, err);
          // Handle specific errors from decodeFromVideoDevice
           if (err.name === 'NotFoundError') {
               setError(`Selected camera (${activeCamera.slice(0,6)}...) not found or is unavailable. Try selecting another camera or refreshing.`);
           } else if (err.name === 'NotReadableError') {
               setError(`Camera (${activeCamera.slice(0,6)}...) is already in use or cannot be accessed. Close other apps using the camera and retry.`);
           } else {
               handleError(err); // Use the general handler for other errors
           }
           // Attempt to cleanup video element if scan failed to start
           if (videoRef.current?.srcObject) {
              const stream = videoRef.current.srcObject as MediaStream;
              stream.getTracks().forEach(track => track.stop());
              videoRef.current.srcObject = null;
           }
      }
  };

  startScan();

  // Cleanup function for this effect
  return () => {
    console.log(`Stopping scanner for device ${activeCamera}`); // Debug log
    active = false;
    controls?.stop();
    scannerRef.current = undefined; // Clear the ref

    // Additional cleanup for video srcObject when component unmounts or camera changes
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null; // Important to release the camera
    }
  };
}, [activeCamera]); // Rerun when activeCamera changes

  // Add a new effect to handle video element attributes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.setAttribute('autoplay', 'true');
      videoRef.current.setAttribute('playsinline', 'true');
      videoRef.current.setAttribute('muted', 'true');
    }
  }, []);

  return (
    <div className="relative w-full max-w-[500px] mx-auto">
      <div className="relative aspect-square">
        <video 
          ref={videoRef}
          className="w-full h-full object-cover rounded-lg"
          autoPlay
          playsInline
          muted
        />
        
        {/* Scanning Guide Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="w-full h-full relative">
            {/* Corner guides - made larger */}
            <div className="absolute top-0 left-0 w-24 h-24 border-t-4 border-l-4 border-primary-500" />
            <div className="absolute top-0 right-0 w-24 h-24 border-t-4 border-r-4 border-primary-500" />
            <div className="absolute bottom-0 left-0 w-24 h-24 border-b-4 border-l-4 border-primary-500" />
            <div className="absolute bottom-0 right-0 w-24 h-24 border-b-4 border-r-4 border-primary-500" />
            
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
                {isRetrying ? <Loader2Icon className="animate-spin" /> : '重试 / Retry'}
              </Button>
            </div>
          </div>
        )}
      </div>

      <p className="mt-2 text-sm text-gray-600 text-center">
        将二维码置于框内以进行扫描。
        <br />
        Position the QR code within the frame to scan.
      </p>
    </div>
  );
};

export default QrCodeScanner;

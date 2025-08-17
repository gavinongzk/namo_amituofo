'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { BrowserQRCodeReader } from '@zxing/browser';
import { Button } from '@/components/ui/button';
import { Flashlight, FlashlightOff, Loader2 as Loader2Icon } from 'lucide-react';

interface QrCodeScannerProps {
  onScan: (decodedText: string) => void;
  onClose?: () => void;
}

const QrCodeScanner: React.FC<QrCodeScannerProps> = ({ onScan, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [activeCamera, setActiveCamera] = useState<string>();
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [error, setError] = useState<string>();
  const [isRetrying, setIsRetrying] = useState(false);
  const [isSafari, setIsSafari] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [retryDelay, setRetryDelay] = useState(3); // seconds
  const maxRetries = 3;
  
  // Refs for cleanup
  const scannerRef = useRef<{ stop: () => void }>();
  const streamRef = useRef<MediaStream | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

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

  // Cleanup function to properly stop camera and scanner
  const cleanupCamera = useCallback(() => {
    console.log('Cleaning up camera resources...');
    
    // Clear any pending retry timeouts
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    // Stop the QR scanner
    if (scannerRef.current) {
      try {
        scannerRef.current.stop();
        scannerRef.current = undefined;
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
    }

    // Stop all media tracks
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
          track.enabled = false;
        });
        streamRef.current = null;
      } catch (err) {
        console.warn('Error stopping media tracks:', err);
      }
    }

    // Clear video element
    if (videoRef.current) {
      try {
        videoRef.current.srcObject = null;
        videoRef.current.load(); // Reset video element
      } catch (err) {
        console.warn('Error clearing video element:', err);
      }
    }

    // Reset state
    setIsActive(false);
    setIsInitializing(false);
    setError(undefined);
    setRetryCount(0);
    setRetryDelay(3);
  }, []);

  // Enhanced error handling for camera access
  const handleCameraError = useCallback((err: Error) => {
    console.error('Camera access error:', err);
    
    // Check for specific error types and provide helpful messages
    if (err.name === 'NotAllowedError') {
      setError('Camera access denied. Please enable camera permissions in your browser settings and refresh the page.\n请在浏览器设置中启用摄像头权限并刷新页面。');
    } else if (err.name === 'NotFoundError') {
      setError('No camera found. Please ensure your device has a camera and it\'s not being used by another application.\n未找到摄像头。请确保您的设备有摄像头且未被其他应用使用。');
    } else if (err.name === 'NotReadableError') {
      setError('Camera is in use by another application. Please close other apps using the camera and try again.\n摄像头被其他应用占用。请关闭其他使用摄像头的应用后重试。');
    } else if (err.name === 'NotSupportedError') {
      setError('Your browser doesn\'t fully support camera access. Please try Chrome, Firefox, or Safari.\n您的浏览器不完全支持摄像头访问。请尝试使用 Chrome、Firefox 或 Safari。');
    } else if (err.message.includes('Permission denied')) {
      setError('Camera permission denied. Please allow camera access and refresh the page.\n摄像头权限被拒绝。请允许摄像头访问并刷新页面。');
    } else {
      setError(`Camera error: ${err.message}. Please refresh the page or try a different browser.\n摄像头错误：${err.message}。请刷新页面或尝试其他浏览器。`);
    }
  }, []);

  const initializeScanner = useCallback(async () => {
    if (!isActive) return;

    try {
      setIsInitializing(true);
      setError(undefined);
      
      checkBrowserCompatibility();

      // Get available cameras first
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

      // Request camera access with specific constraints
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          deviceId: { exact: selectedCamera },
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      // Store stream reference for cleanup
      streamRef.current = stream;

      // Set stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Ensure video plays
        try {
          await videoRef.current.play();
        } catch (playError) {
          console.error('Error playing video:', playError);
          throw new Error('Failed to start video stream');
        }
      }

      // Initialize QR code reader
      const codeReader = new BrowserQRCodeReader(undefined, {
        delayBetweenScanAttempts: 100,
        delayBetweenScanSuccess: 1500
      });

      let active = true;

      const controls = await codeReader.decodeFromVideoDevice(
        selectedCamera,
        videoRef.current!,
        (result) => {
          if (result && active && isActive) {
            handleSuccessfulScan(result.getText());
          }
        }
      );

      scannerRef.current = controls;
      setIsInitializing(false);

      // Return cleanup function
      return () => {
        active = false;
        if (controls) {
          try {
            controls.stop();
          } catch (err) {
            console.warn('Error stopping controls:', err);
          }
        }
      };

    } catch (err: any) {
      setIsInitializing(false);
      handleCameraError(err);
      return () => {};
    }
  }, [isActive, handleCameraError]);

  const handleSuccessfulScan = (text: string) => {
    // Vibrate if supported
    if (navigator.vibrate) {
      navigator.vibrate(200);
    }
    
    onScan(text);
  };

  const handleError = (err: Error) => {
    console.error('QR Scanner Error:', err);
    
    if (
      err.name === 'NotReadableError' ||
      err.message.includes('hardware') ||
      err.message.includes('in use')
    ) {
      if (retryCount < maxRetries) {
        setError(
          `Camera is in use by another application or not accessible. Retrying in ${retryDelay} seconds... (${retryCount + 1}/${maxRetries})` +
          '\n请关闭其他使用摄像头的应用，系统将自动重试。'
        );
        
        // Start countdown
        retryTimeoutRef.current && clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = setTimeout(() => {
          setRetryCount(c => c + 1);
          setRetryDelay(3);
          setError(undefined);
          retry();
        }, retryDelay * 1000);
      } else {
        setError(
          'Camera is in use by another application or not accessible. Please close other apps using the camera and try again.\n摄像头被其他应用占用，请关闭其他应用后重试，或刷新页面。'
        );
      }
    } else {
      // Use enhanced error handler for other errors
      handleCameraError(err);
    }
  };

  const toggleTorch = async () => {
    const stream = streamRef.current;
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
    if (!isActive) return;
    
    setIsRetrying(true);
    setError(undefined);
    
    try {
      // Clean up existing resources first
      cleanupCamera();
      
      // Reset state for retry
      setIsActive(true);
      setIsInitializing(true);
      
      // Initialize scanner
      const cleanupFn = await initializeScanner();
      if (cleanupFn) {
        cleanupRef.current = cleanupFn;
      }
    } finally {
      setIsRetrying(false);
    }
  };

  const stopCamera = useCallback(() => {
    console.log('Stopping camera...');
    cleanupCamera();
    if (onClose) onClose();
  }, [cleanupCamera, onClose]);

  // Initialize scanner when component mounts or camera changes
  useEffect(() => {
    if (!isActive) return;
    
    let cleanupFn: (() => void) | null = null;
    
    const init = async () => {
      try {
        const fn = await initializeScanner();
        if (fn) {
          cleanupFn = fn;
          cleanupRef.current = fn;
        }
      } catch (err) {
        console.error('Failed to initialize scanner:', err);
      }
    };

    init();

    return () => {
      if (cleanupFn) {
        cleanupFn();
      }
      cleanupCamera();
    };
  }, [activeCamera, isActive, initializeScanner, cleanupCamera]);

  // Add video element attributes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.setAttribute('autoplay', 'true');
      videoRef.current.setAttribute('playsinline', 'true');
      videoRef.current.setAttribute('muted', 'true');
    }
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      console.log('QrCodeScanner unmounting, cleaning up...');
      cleanupCamera();
    };
  }, [cleanupCamera]);

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
        <div className="absolute top-4 right-4 flex gap-2 z-10">
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
            disabled={isInitializing}
          >
            {torchEnabled ? <FlashlightOff className="h-4 w-4" /> : <Flashlight className="h-4 w-4" />}
          </Button>
          
          {/* Turn Off Camera Button */}
          {!error && isActive && !isInitializing && (
            <Button 
              onClick={stopCamera}
              variant="destructive"
              size="sm"
              className="bg-red-500 text-white ml-2"
            >
              Turn Off Camera
            </Button>
          )}
        </div>

        {/* Loading State */}
        {isInitializing && !error && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <div className="text-center p-4">
              <Loader2Icon className="animate-spin h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">Initializing camera...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <div className="text-center p-4">
              <p className="text-destructive mb-4 whitespace-pre-line">{error}</p>
              {retryCount >= maxRetries && (
                <Button 
                  onClick={retry} 
                  disabled={isRetrying}
                >
                  {isRetrying ? <Loader2Icon className="animate-spin" /> : '重试 / Retry'}
                </Button>
              )}
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

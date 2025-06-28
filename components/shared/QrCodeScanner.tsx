'use client';

import React, { useEffect, useRef, useState } from 'react';
import { BrowserQRCodeReader } from '@zxing/browser';
import { Button } from '@/components/ui/button';
import { Flashlight, FlashlightOff, Loader2 as Loader2Icon, Camera, CameraOff, RotateCw, Zap } from 'lucide-react';

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
  const scannerRef = useRef<{ stop: () => void }>();
  const [isActive, setIsActive] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [retryDelay, setRetryDelay] = useState(3); // seconds
  const [isScanning, setIsScanning] = useState(false);
  const maxRetries = 3;
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
      setIsScanning(true);
      checkBrowserCompatibility();

      // First explicitly request camera permission with more specific constraints
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      // Immediately set the stream to video element
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

      // Stop the initial stream before starting the code reader
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const controls = await codeReader.decodeFromVideoDevice(
        selectedCamera,
        videoRef.current!,
        (result) => {
          if (result && active) {
            handleSuccessfulScan(result.getText());
          }
        }
      );

      scannerRef.current = controls;
      setIsScanning(false);

      return () => {
        active = false;
        if (controls) {
          controls.stop();
        }
        // Clean up any remaining video tracks
        if (videoRef.current?.srcObject) {
          const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
          tracks.forEach(track => track.stop());
        }
      };
    } catch (err: any) {
      setIsScanning(false);
      handleError(err);
      return () => {};
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
        let seconds = retryDelay;
        retryTimeoutRef.current && clearInterval(retryTimeoutRef.current);
        retryTimeoutRef.current = setInterval(() => {
          seconds -= 1;
          setRetryDelay(seconds);
          setError(
            `Camera is in use by another application or not accessible. Retrying in ${seconds} seconds... (${retryCount + 1}/${maxRetries})` +
            '\n请关闭其他使用摄像头的应用，系统将自动重试。'
          );
          if (seconds <= 0) {
            clearInterval(retryTimeoutRef.current!);
            setRetryCount(c => c + 1);
            setRetryDelay(3);
            setError(undefined);
            retry();
          }
        }, 1000);
      } else {
        setError(
          'Camera is in use by another application or not accessible. Please close other apps using the camera and try again.\n摄像头被其他应用占用，请关闭其他应用后重试，或刷新页面。'
        );
      }
    } else if (err.name === 'NotAllowedError') {
      setError('Camera access denied. Please enable camera permissions in your browser settings and refresh the page.');
    } else if (err.name === 'NotFoundError' || err.message.includes('No cameras')) {
      setError('No camera found. Please ensure your device has a camera and it\'s not being used by another application.');
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

  const stopCamera = () => {
    setIsActive(false);
    if (scannerRef.current) {
      scannerRef.current.stop();
      scannerRef.current = undefined;
    }
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => {
        track.stop();
        track.enabled = false;
      });
      videoRef.current.srcObject = null;
    }
    if (onClose) onClose();
  };

  useEffect(() => {
    if (!isActive) return;
    
    // Reset error state when reactivating
    setError(undefined);
    setRetryCount(0);
    setRetryDelay(3);
    
    const cleanup = initializeScanner();
    return () => {
      cleanup?.then(cleanupFn => {
        if (cleanupFn) {
          cleanupFn();
        }
        // Ensure all tracks are stopped
        if (videoRef.current?.srcObject) {
          const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
          tracks.forEach(track => {
            track.stop();
            track.enabled = false;
          });
          videoRef.current.srcObject = null;
        }
      });
    };
  }, [activeCamera, isActive]);

  // Add a new effect to handle video element attributes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.setAttribute('autoplay', 'true');
      videoRef.current.setAttribute('playsinline', 'true');
      videoRef.current.setAttribute('muted', 'true');
    }
  }, []);

  // Clean up retry timer on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) clearInterval(retryTimeoutRef.current);
    };
  }, []);

  return (
    <div className="relative w-full max-w-[500px] mx-auto">
      <div className="relative aspect-square bg-black rounded-2xl overflow-hidden shadow-2xl">
        <video 
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          playsInline
          muted
        />
        
        {/* Modern Scanning Guide Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="w-full h-full relative">
            
            {/* Animated corner brackets - Modern design */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-64 h-64">
                {/* Top-left corner */}
                <div className="absolute top-0 left-0 w-16 h-16">
                  <div className="absolute top-0 left-0 w-12 h-1.5 bg-gradient-to-r from-blue-400 to-blue-500 animate-corner-pulse rounded-full shadow-lg shadow-blue-400/50" />
                  <div className="absolute top-0 left-0 w-1.5 h-12 bg-gradient-to-b from-blue-400 to-blue-500 animate-corner-pulse rounded-full shadow-lg shadow-blue-400/50" />
                  <div className="absolute top-1 left-1 w-4 h-4 border-2 border-blue-300/60 rounded-tl-lg" />
                </div>
                
                {/* Top-right corner */}
                <div className="absolute top-0 right-0 w-16 h-16">
                  <div className="absolute top-0 right-0 w-12 h-1.5 bg-gradient-to-l from-blue-400 to-blue-500 animate-corner-pulse rounded-full shadow-lg shadow-blue-400/50" />
                  <div className="absolute top-0 right-0 w-1.5 h-12 bg-gradient-to-b from-blue-400 to-blue-500 animate-corner-pulse rounded-full shadow-lg shadow-blue-400/50" />
                  <div className="absolute top-1 right-1 w-4 h-4 border-2 border-blue-300/60 rounded-tr-lg" />
                </div>
                
                {/* Bottom-left corner */}
                <div className="absolute bottom-0 left-0 w-16 h-16">
                  <div className="absolute bottom-0 left-0 w-12 h-1.5 bg-gradient-to-r from-blue-400 to-blue-500 animate-corner-pulse rounded-full shadow-lg shadow-blue-400/50" />
                  <div className="absolute bottom-0 left-0 w-1.5 h-12 bg-gradient-to-t from-blue-400 to-blue-500 animate-corner-pulse rounded-full shadow-lg shadow-blue-400/50" />
                  <div className="absolute bottom-1 left-1 w-4 h-4 border-2 border-blue-300/60 rounded-bl-lg" />
                </div>
                
                {/* Bottom-right corner */}
                <div className="absolute bottom-0 right-0 w-16 h-16">
                  <div className="absolute bottom-0 right-0 w-12 h-1.5 bg-gradient-to-l from-blue-400 to-blue-500 animate-corner-pulse rounded-full shadow-lg shadow-blue-400/50" />
                  <div className="absolute bottom-0 right-0 w-1.5 h-12 bg-gradient-to-t from-blue-400 to-blue-500 animate-corner-pulse rounded-full shadow-lg shadow-blue-400/50" />
                  <div className="absolute bottom-1 right-1 w-4 h-4 border-2 border-blue-300/60 rounded-br-lg" />
                </div>
                
                {/* Center scanning area outline */}
                <div className="absolute inset-4 border-2 border-blue-300/30 rounded-xl" />
              </div>
            </div>
            
            {/* Animated scanning line */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-56 h-56 overflow-hidden rounded-xl">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-red-400 to-transparent animate-scan-line opacity-75" />
              </div>
            </div>
            
            {/* Pulse effect when scanning */}
            {isScanning && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-64 border-2 border-blue-400/50 rounded-xl animate-ping" />
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Camera Controls */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10">
          {/* Left side - Camera selector */}
          <div className="flex items-center gap-2">
            {cameras.length > 1 && (
              <div className="relative">
                <select 
                  value={activeCamera}
                  onChange={e => setActiveCamera(e.target.value)}
                  className="bg-black/70 backdrop-blur-sm text-white rounded-lg px-3 py-2 text-sm border border-white/20 focus:border-blue-400 focus:outline-none appearance-none pr-8"
                >
                  {cameras.map((camera, index) => (
                    <option key={camera.deviceId} value={camera.deviceId} className="bg-black text-white">
                      {camera.label || `Camera ${index + 1}`}
                    </option>
                  ))}
                </select>
                <Camera className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/70 pointer-events-none" />
              </div>
            )}
          </div>
          
          {/* Right side - Action buttons */}
          <div className="flex items-center gap-2">
            <Button 
              onClick={toggleTorch}
              variant="ghost" 
              size="icon"
              className="bg-black/70 backdrop-blur-sm text-white hover:bg-white/20 border border-white/20 rounded-lg"
            >
              {torchEnabled ? (
                <FlashlightOff className="h-4 w-4 text-yellow-400" />
              ) : (
                <Flashlight className="h-4 w-4" />
              )}
            </Button>
            
            <Button 
              onClick={stopCamera}
              variant="ghost"
              size="icon"
              className="bg-red-500/80 backdrop-blur-sm text-white hover:bg-red-600/80 border border-red-400/30 rounded-lg"
            >
              <CameraOff className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Status indicator */}
        <div className="absolute bottom-4 left-4 right-4 flex justify-center z-10">
          <div className="bg-black/70 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm border border-white/20">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isScanning ? 'bg-blue-400 animate-pulse' : error ? 'bg-red-400' : 'bg-green-400'}`} />
              <span>
                {isScanning ? 'Initializing...' : error ? 'Camera Error' : 'Ready to Scan'}
              </span>
            </div>
          </div>
        </div>

        {/* Enhanced Error State */}
        {error && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-20">
            <div className="max-w-sm mx-4">
              <div className="bg-white rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
                  <CameraOff className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-center mb-2 text-gray-900">Camera Issue</h3>
                <p className="text-gray-600 text-center text-sm mb-4 whitespace-pre-line leading-relaxed">{error}</p>
                {retryCount >= maxRetries && (
                  <div className="flex gap-2">
                    <Button 
                      onClick={retry} 
                      disabled={isRetrying}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isRetrying ? (
                        <>
                          <Loader2Icon className="animate-spin h-4 w-4 mr-2" />
                          Retrying...
                        </>
                      ) : (
                        <>
                          <RotateCw className="h-4 w-4 mr-2" />
                          Try Again
                        </>
                      )}
                    </Button>
                    <Button 
                      onClick={stopCamera}
                      variant="outline"
                      className="px-4"
                    >
                      Close
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Instructions */}
      <div className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
            <Zap className="h-4 w-4 text-blue-600" />
          </div>
          <h4 className="font-semibold text-blue-900">Scanning Instructions</h4>
        </div>
        <div className="space-y-2 text-sm text-blue-800">
          <p className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
            将二维码置于蓝色框内 Position QR code within the blue frame
          </p>
          <p className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
            保持设备稳定，等待自动识别 Keep device steady for auto-detection
          </p>
          <p className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
            确保光线充足，可使用闪光灯 Ensure good lighting, use flash if needed
          </p>
        </div>
      </div>
    </div>
  );
};

export default QrCodeScanner;

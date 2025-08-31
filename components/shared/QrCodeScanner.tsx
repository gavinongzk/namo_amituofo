'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BrowserQRCodeReader } from '@zxing/browser';
import { Button } from '@/components/ui/button';
import { Flashlight, FlashlightOff, Loader2 as Loader2Icon, Camera, CameraOff } from 'lucide-react';

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
  const [isInitializing, setIsInitializing] = useState(true);
  const scannerRef = useRef<{ stop: () => void }>();
  const [isActive, setIsActive] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [retryDelay, setRetryDelay] = useState(3); // seconds
  const maxRetries = 3;
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Check browser compatibility
  const checkBrowserCompatibility = useCallback(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Your browser doesn\'t support camera access. Please use a modern browser like Chrome, Firefox, or Safari.');
    }

    // Check if running in insecure context (except localhost)
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      throw new Error('Camera access requires a secure (HTTPS) connection.');
    }

    // Check for mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile && !navigator.mediaDevices.enumerateDevices) {
      throw new Error('Your mobile browser doesn\'t support camera enumeration. Please use a modern mobile browser.');
    }
  }, []);

  // Get available cameras
  const getAvailableCameras = useCallback(async () => {
    try {
      // First try to enumerate devices without permission (works on some browsers)
      let devices = await navigator.mediaDevices.enumerateDevices();
      let videoDevices = devices.filter(d => d.kind === 'videoinput');
      
      // If no devices found or no labels, request permission first
      if (videoDevices.length === 0 || videoDevices.every(d => !d.label)) {
        try {
          // Request permission with minimal constraints
          await navigator.mediaDevices.getUserMedia({ 
            video: { 
              width: { ideal: 640 },
              height: { ideal: 480 }
            } 
          });
          
          // Re-enumerate after permission
          devices = await navigator.mediaDevices.enumerateDevices();
          videoDevices = devices.filter(d => d.kind === 'videoinput');
        } catch (permissionErr) {
          console.error('Permission error:', permissionErr);
          throw new Error('Camera permission denied');
        }
      }
      
      if (videoDevices.length === 0) {
        throw new Error('No cameras found on this device.');
      }
      
      setCameras(videoDevices);
      
      // Prefer back camera for mobile devices
      const backCamera = videoDevices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear') ||
        device.label.toLowerCase().includes('environment')
      );
      
      const selectedCamera = backCamera?.deviceId || videoDevices[0]?.deviceId;
      setActiveCamera(selectedCamera);
      
      return selectedCamera;
    } catch (err: any) {
      console.error('Error getting cameras:', err);
      throw err;
    }
  }, []);

  const initializeScanner = useCallback(async () => {
    try {
      setIsInitializing(true);
      setError(undefined);
      
      console.log('Initializing QR scanner...');
      checkBrowserCompatibility();

      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      // Get camera device
      const selectedCamera = await getAvailableCameras();
      console.log('Selected camera:', selectedCamera);
      
      if (!selectedCamera) {
        throw new Error('Failed to select a camera.');
      }

      // Request camera stream with more flexible constraints for better compatibility
      let stream;
      try {
        console.log('Attempting to get camera stream with device ID...');
        // First try with specific device ID
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: {
            deviceId: { exact: selectedCamera },
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
            frameRate: { ideal: 30, min: 15 }
          }
        });
        console.log('Successfully got stream with device ID');
      } catch (deviceErr) {
        console.warn('Failed with specific device, trying with basic constraints:', deviceErr);
        // Fallback to basic constraints
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: {
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 }
          }
        });
        console.log('Successfully got stream with basic constraints');
      }

      streamRef.current = stream;

      // Set the stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Set video attributes for better compatibility
        videoRef.current.setAttribute('autoplay', 'true');
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('muted', 'true');
        videoRef.current.setAttribute('controls', 'false');
        
        // Check if macOS for special handling
        const isMacOS = /Mac/.test(navigator.platform);
        
        // Ensure video plays
        try {
          await videoRef.current.play();
        } catch (playError) {
          console.error('Error playing video:', playError);
          
          // Try alternative approach for macOS
          if (isMacOS) {
            try {
              // Force play with user interaction simulation
              videoRef.current.muted = true;
              videoRef.current.autoplay = true;
              await videoRef.current.play();
            } catch (macOSError) {
              console.error('macOS video play error:', macOSError);
              throw new Error('Failed to start video stream on macOS');
            }
          } else {
            throw new Error('Failed to start video stream');
          }
        }
      }

      // Initialize QR code reader with proper video stream
      const codeReader = new BrowserQRCodeReader(undefined, {
        delayBetweenScanAttempts: 100,
        delayBetweenScanSuccess: 1500
      });

      let active = true;

      // Ensure video element is properly set up with stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded, starting QR scanner...');
        };
        videoRef.current.oncanplay = () => {
          console.log('Video can play, QR scanner ready');
        };
        videoRef.current.onerror = (e) => {
          console.error('Video error:', e);
        };
        
              // Force video to play for macOS compatibility
      videoRef.current.play().catch((playError) => {
        console.warn('Video play failed, but continuing with QR scanner:', playError);
      });
    }

    // Wait a bit for video to initialize
    await new Promise(resolve => setTimeout(resolve, 500));

    const controls = await codeReader.decodeFromVideoDevice(
        selectedCamera,
        videoRef.current!,
        (result) => {
          if (result && active) {
            console.log('QR Code detected:', result.getText());
            handleSuccessfulScan(result.getText());
          }
        }
      );

      scannerRef.current = controls;

      setIsInitializing(false);

      return () => {
        active = false;
        if (controls) {
          controls.stop();
        }
        // Clean up stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };
    } catch (err: any) {
      setIsInitializing(false);
      handleError(err);
      return () => {};
    }
  }, [checkBrowserCompatibility, getAvailableCameras]);

  const handleSuccessfulScan = useCallback((text: string) => {
    // Vibrate if supported
    if (navigator.vibrate) {
      navigator.vibrate(200);
    }
    
    onScan(text);
  }, [onScan]);

  const handleError = useCallback((err: Error) => {
    console.error('QR Scanner Error:', err);
    
    // Check for specific browser and OS issues
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isMacOS = /Mac/.test(navigator.platform);
    const isChrome = /Chrome/.test(navigator.userAgent);
    
    if (err.name === 'NotReadableError' || err.message.includes('hardware') || err.message.includes('in use')) {
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
    } else if (err.name === 'NotAllowedError' || err.message.includes('denied')) {
      if (isIOS && isSafari) {
        setError('Camera access denied. On iOS Safari, please go to Settings > Safari > Camera and allow access, then refresh the page.\n摄像头权限被拒绝。在iOS Safari上，请前往设置 > Safari > 摄像头并允许访问，然后刷新页面。');
      } else if (isMacOS && isSafari) {
        setError('Camera access denied. On macOS Safari, please go to Safari > Preferences > Websites > Camera and allow access, then refresh the page.\n摄像头权限被拒绝。在macOS Safari上，请前往Safari > 偏好设置 > 网站 > 摄像头并允许访问，然后刷新页面。');
      } else if (isMacOS && isChrome) {
        setError('Camera access denied. On macOS Chrome, please go to Chrome > Preferences > Privacy and security > Site Settings > Camera and allow access, then refresh the page.\n摄像头权限被拒绝。在macOS Chrome上，请前往Chrome > 偏好设置 > 隐私设置和安全性 > 网站设置 > 摄像头并允许访问，然后刷新页面。');
      } else {
        setError('Camera access denied. Please enable camera permissions in your browser settings and refresh the page.\n摄像头权限被拒绝，请在浏览器设置中启用摄像头权限并刷新页面。');
      }
    } else if (err.name === 'NotFoundError' || err.message.includes('No cameras')) {
      setError('No camera found. Please ensure your device has a camera and it\'s not being used by another application.\n未找到摄像头，请确保设备有摄像头且未被其他应用占用。');
    } else if (err.name === 'NotSupportedError' || err.message.includes('support')) {
      setError('Your browser doesn\'t fully support camera access. Please try Chrome, Firefox, or Safari.\n您的浏览器不完全支持摄像头访问，请尝试使用Chrome、Firefox或Safari。');
    } else if (err.message.includes('secure')) {
      setError('Camera access requires a secure (HTTPS) connection. Please use HTTPS or localhost.\n摄像头访问需要安全连接(HTTPS)，请使用HTTPS或localhost。');
    } else if (err.message.includes('Failed to start video stream')) {
      if (isMacOS) {
        setError('Camera stream failed to start. On macOS, please:\n1. Check System Preferences > Security & Privacy > Camera\n2. Ensure your browser has camera access\n3. Close other apps using the camera\n4. Try refreshing the page\n\n摄像头流启动失败。在macOS上，请：\n1. 检查系统偏好设置 > 安全性与隐私 > 摄像头\n2. 确保浏览器有摄像头访问权限\n3. 关闭其他使用摄像头的应用\n4. 尝试刷新页面');
      } else {
        setError('Camera stream failed to start. Please check camera permissions and try refreshing the page.\n摄像头流启动失败。请检查摄像头权限并尝试刷新页面。');
      }
    } else {
      setError(`Camera error: ${err.message}. Please refresh the page or try a different browser.\n摄像头错误：${err.message}。请刷新页面或尝试其他浏览器。`);
    }
  }, [retryCount, retryDelay]);

  const toggleTorch = useCallback(async () => {
    const stream = streamRef.current;
    const track = stream?.getVideoTracks()[0];
      
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
  }, [torchEnabled]);

  const retry = useCallback(async () => {
    setIsRetrying(true);
    setError(undefined);
    setRetryCount(0);
    setRetryDelay(3);
    
    try {
      await initializeScanner();
    } finally {
      setIsRetrying(false);
    }
  }, [initializeScanner]);

  const stopCamera = useCallback(() => {
    setIsActive(false);
    if (scannerRef.current) {
      scannerRef.current.stop();
      scannerRef.current = undefined;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        track.enabled = false;
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (onClose) onClose();
  }, [onClose]);

  const switchCamera = useCallback(async (deviceId: string) => {
    setActiveCamera(deviceId);
    // The scanner will be reinitialized with the new camera in the useEffect
  }, []);

  // Initialize scanner when component mounts or camera changes
  useEffect(() => {
    if (!isActive) return;
    
    const cleanup = initializeScanner();
    return () => {
      cleanup?.then(cleanupFn => {
        if (cleanupFn) {
          cleanupFn();
        }
      });
    };
  }, [activeCamera, isActive, initializeScanner]);

  // Pause camera when tab is hidden; resume when visible
  const pausedByVisibilityRef = useRef(false);
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        if (isActive) {
          pausedByVisibilityRef.current = true;
          stopCamera();
        }
      } else {
        if (pausedByVisibilityRef.current) {
          pausedByVisibilityRef.current = false;
          setIsActive(true);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isActive, stopCamera]);

  // Clean up retry timer on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) clearInterval(retryTimeoutRef.current);
    };
  }, []);

  return (
    <div className="relative w-full max-w-[500px] mx-auto">
      <div className="relative aspect-square bg-black rounded-lg overflow-hidden">
        <video 
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          playsInline
          muted
        />
        
        {/* Scanning Guide Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="w-full h-full relative">
            {/* Corner guides */}
            <div className="absolute top-4 left-4 w-16 h-16 border-t-4 border-l-4 border-blue-500" />
            <div className="absolute top-4 right-4 w-16 h-16 border-t-4 border-r-4 border-blue-500" />
            <div className="absolute bottom-4 left-4 w-16 h-16 border-b-4 border-l-4 border-blue-500" />
            <div className="absolute bottom-4 right-4 w-16 h-16 border-b-4 border-r-4 border-blue-500" />
            
            {/* Scanning line animation */}
            <div className="absolute top-4 left-4 right-4 h-0.5 bg-blue-500 animate-scan" />
          </div>
        </div>

        {/* Camera Controls */}
        <div className="absolute top-4 right-4 flex gap-2 z-10">
          {cameras.length > 1 && (
            <select 
              value={activeCamera}
              onChange={e => switchCamera(e.target.value)}
              className="bg-black/70 text-white rounded-md px-2 py-1 text-sm border border-white/20"
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
            className="bg-black/70 text-white border-white/20 hover:bg-black/80"
          >
            {torchEnabled ? <FlashlightOff className="h-4 w-4" /> : <Flashlight className="h-4 w-4" />}
          </Button>
          
          {!error && isActive && (
            <Button 
              onClick={stopCamera}
              variant="destructive"
              size="icon"
              className="bg-red-500 text-white hover:bg-red-600"
            >
              <CameraOff className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Loading State */}
        {isInitializing && !error && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-center p-4">
              <Loader2Icon className="h-8 w-8 animate-spin text-white mx-auto mb-2" />
              <p className="text-white text-sm">Initializing camera...</p>
              <p className="text-white/70 text-xs">正在初始化摄像头...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
            <div className="text-center p-4 max-w-sm">
              <p className="text-red-400 mb-4 whitespace-pre-line text-sm">{error}</p>
              {retryCount >= maxRetries && (
                <Button 
                  onClick={retry} 
                  disabled={isRetrying}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isRetrying ? (
                    <>
                      <Loader2Icon className="animate-spin h-4 w-4 mr-2" />
                      Retrying...
                    </>
                  ) : (
                    <>
                      <Camera className="h-4 w-4 mr-2" />
                      Retry / 重试
                    </>
                  )}
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

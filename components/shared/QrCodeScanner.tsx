'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BrowserQRCodeReader } from '@zxing/browser';
import { Button } from '@/components/ui/button';
import { Flashlight, FlashlightOff, Loader2 as Loader2Icon } from 'lucide-react';

interface QrCodeScannerProps {
  onScan: (decodedText: string) => void;
  onClose?: () => void;
}

type IntervalHandle = ReturnType<typeof setInterval>;
type TimeoutHandle = ReturnType<typeof setTimeout>;

type BarcodeDetectorLike = {
  detect: (image: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>;
};

const QrCodeScanner: React.FC<QrCodeScannerProps> = ({ onScan, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [activeCamera, setActiveCamera] = useState<string>();
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [error, setError] = useState<string>();
  const [isRetrying, setIsRetrying] = useState(false);
  const scannerRef = useRef<{ stop: () => void }>();
  const [isActive, setIsActive] = useState(true);
  const [restartNonce, setRestartNonce] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [retryDelay, setRetryDelay] = useState(3); // seconds
  const maxRetries = 3;
  const retryIntervalRef = useRef<IntervalHandle | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const videoTrackRef = useRef<MediaStreamTrack | null>(null);
  const rafRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const barcodeDetectorRef = useRef<BarcodeDetectorLike | null>(null);
  const lastScanRef = useRef<{ value: string; at: number } | null>(null);

  useEffect(() => {
    // Check if running on Safari - keeping for future use
    const isSafariBrowser = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    // setIsSafari(isSafariBrowser); // Commented out as not currently used
  }, []);

  const checkBrowserCompatibility = useCallback(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Your browser doesn\'t support camera access. Please use a modern browser like Chrome, Firefox, or Safari.');
    }

    // Check if running in insecure context
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      throw new Error('Camera access requires a secure (HTTPS) connection.');
    }
  }, []);

  const handleSuccessfulScan = useCallback((text: string) => {
    // Vibrate if supported
    if (navigator.vibrate) {
      navigator.vibrate(200);
    }

    // Don't play sound here as it's handled by the parent component
    onScan(text);
  }, [onScan]);

  const retry = useCallback(() => {
    setIsRetrying(true);
    setError(undefined);
    setRestartNonce((n) => n + 1);
    // Small delay to avoid spinner flicker; scanning restarts via effect.
    setTimeout(() => setIsRetrying(false), 250);
  }, []);

  const handleError = useCallback((err: Error) => {
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
        retryIntervalRef.current && clearInterval(retryIntervalRef.current);
        retryIntervalRef.current = setInterval(() => {
          seconds -= 1;
          setRetryDelay(seconds);
          setError(
            `Camera is in use by another application or not accessible. Retrying in ${seconds} seconds... (${retryCount + 1}/${maxRetries})` +
            '\n请关闭其他使用摄像头的应用，系统将自动重试。'
          );
          if (seconds <= 0) {
            clearInterval(retryIntervalRef.current!);
            setRetryCount((c) => c + 1);
            setRetryDelay(3);
            setError(undefined);
            setRestartNonce((n) => n + 1);
          }
        }, 1000);
      } else {
        setError(
          'Camera is in use by another application or not accessible. Please close other apps using the camera and try again.\n摄像头被其他应用占用，请关闭其他应用后重试，或刷新页面。'
        );
      }
    } else if (err.name === 'NotAllowedError' || err.message.includes('denied')) {
      setError('Camera access denied. Please enable camera permissions in your browser settings and refresh the page.');
    } else if (err.name === 'NotFoundError' || err.message.includes('No cameras')) {
      setError('No camera found. Please ensure your device has a camera and it\'s not being used by another application.');
    } else if (err.name === 'NotSupportedError' || err.message.includes('support')) {
      setError('Your browser doesn\'t fully support camera access. Please try Chrome, Firefox, or Safari.');
    } else {
      setError(`Camera error: ${err.message}. Please refresh the page or try a different browser.`);
    }
  }, [retryCount, retryDelay]);

  const stopStreamAndScanner = useCallback((opts?: { close?: boolean }) => {
    if (scannerRef.current) {
      scannerRef.current.stop();
      scannerRef.current = undefined;
    }

    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    setTorchEnabled(false);
    videoTrackRef.current = null;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      try {
        videoRef.current.pause();
      } catch {
        // ignore
      }
      videoRef.current.srcObject = null;
    }

    if (opts?.close && onClose) onClose();
  }, [onClose]);

  const ensureBarcodeDetector = useCallback(() => {
    if (barcodeDetectorRef.current) return;

    // Safari/Chrome support varies; keep it best-effort with safe runtime checks.
    const AnyWindow = window as any;
    const Detector = AnyWindow?.BarcodeDetector as undefined | (new (opts: { formats: string[] }) => BarcodeDetectorLike);
    if (!Detector) return;

    try {
      barcodeDetectorRef.current = new Detector({ formats: ['qr_code'] });
    } catch {
      barcodeDetectorRef.current = null;
    }
  }, []);

  const listCameras = useCallback(async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter((d) => d.kind === 'videoinput');
    setCameras(videoDevices);
    return videoDevices;
  }, []);

  const pickDefaultCameraId = useCallback((videoDevices: MediaDeviceInfo[]) => {
    if (activeCamera) return activeCamera;
    const backCamera = videoDevices.find((device) => {
      const label = (device.label || '').toLowerCase();
      return label.includes('back') || label.includes('rear') || label.includes('environment');
    });
    return backCamera?.deviceId || videoDevices[0]?.deviceId;
  }, [activeCamera]);

  const startStream = useCallback(async (deviceId?: string) => {
    const tryConstraints: MediaStreamConstraints[] = [
      {
        video: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          facingMode: deviceId ? undefined : { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      },
      // iOS sometimes rejects width/height ideals or exact deviceId; fall back.
      {
        video: deviceId
          ? { deviceId: { ideal: deviceId } }
          : { facingMode: { ideal: 'environment' } },
        audio: false,
      },
      { video: true, audio: false },
    ];

    let lastErr: unknown;
    for (const constraints of tryConstraints) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;
        const track = stream.getVideoTracks()[0] || null;
        videoTrackRef.current = track;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try {
            await videoRef.current.play();
          } catch (playError) {
            // If autoplay fails, surface a helpful message rather than silently failing.
            throw new Error('Failed to start video stream. Please tap the video area or check browser autoplay settings.');
          }
        }

        return stream;
      } catch (e) {
        lastErr = e;
      }
    }

    throw lastErr instanceof Error ? lastErr : new Error('Failed to access camera.');
  }, []);

  const startBarcodeDetectorLoop = useCallback(() => {
    const detector = barcodeDetectorRef.current;
    const video = videoRef.current;
    if (!detector || !video) return;

    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const scanIntervalMs = 100; // ~10fps is plenty for QR and keeps CPU low
    let lastTick = 0;

    const tick = async (now: number) => {
      if (!isActive) return;
      rafRef.current = requestAnimationFrame(tick);
      if (now - lastTick < scanIntervalMs) return;
      lastTick = now;

      if (video.readyState < 2) return; // not enough data
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      if (!vw || !vh) return;

      // Crop to center square to reduce decode work and speed up scanning.
      const minDim = Math.min(vw, vh);
      const roi = Math.floor(minDim * 0.65);
      const sx = Math.floor((vw - roi) / 2);
      const sy = Math.floor((vh - roi) / 2);

      const out = 420; // small fixed size keeps detection fast
      if (canvas.width !== out) canvas.width = out;
      if (canvas.height !== out) canvas.height = out;

      ctx.drawImage(video, sx, sy, roi, roi, 0, 0, out, out);

      try {
        const results = await detector.detect(canvas);
        const value = results?.[0]?.rawValue;
        if (!value) return;

        const nowMs = Date.now();
        const last = lastScanRef.current;
        // De-dupe rapid repeat detections of the same QR.
        if (last && last.value === value && nowMs - last.at < 1200) return;
        lastScanRef.current = { value, at: nowMs };
        handleSuccessfulScan(value);
      } catch {
        // ignore intermittent detect failures
      }
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [handleSuccessfulScan, isActive]);

  const initializeScanner = useCallback(async () => {
    try {
      checkBrowserCompatibility();

      // Ensure we start from a clean state.
      stopStreamAndScanner();

      // Request permission + start stream with best-effort rear camera selection.
      const stream = await startStream(activeCamera);

      // After permissions are granted, labels become available.
      const videoDevices = await listCameras();
      if (videoDevices.length === 0) throw new Error('No cameras found on this device.');

      const selectedCamera = pickDefaultCameraId(videoDevices);
      if (!selectedCamera) throw new Error('Failed to select a camera.');
      if (!activeCamera) setActiveCamera(selectedCamera);

      // Prefer native BarcodeDetector (fast on supported browsers). Fall back to ZXing stream decode.
      ensureBarcodeDetector();
      if (barcodeDetectorRef.current) {
        startBarcodeDetectorLoop();
        return () => stopStreamAndScanner();
      }

      const codeReader = new BrowserQRCodeReader(undefined, {
        delayBetweenScanAttempts: 60,
        delayBetweenScanSuccess: 1200,
      });

      let active = true;
      const controls = await codeReader.decodeFromStream(streamRef.current!, videoRef.current!, (result) => {
        if (!active || !result) return;
        const text = result.getText();
        const nowMs = Date.now();
        const last = lastScanRef.current;
        if (last && last.value === text && nowMs - last.at < 1200) return;
        lastScanRef.current = { value: text, at: nowMs };
        handleSuccessfulScan(text);
      });

      scannerRef.current = controls;

      return () => {
        active = false;
        stopStreamAndScanner();
      };
    } catch (err: any) {
      handleError(err);
      return () => {};
    }
  }, [
    activeCamera,
    checkBrowserCompatibility,
    ensureBarcodeDetector,
    handleError,
    handleSuccessfulScan,
    listCameras,
    pickDefaultCameraId,
    startBarcodeDetectorLoop,
    startStream,
    stopStreamAndScanner,
  ]);

  const toggleTorch = async () => {
    const track = videoTrackRef.current;
      
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

  const stopCamera = () => {
    setIsActive(false);
    stopStreamAndScanner({ close: true });
  };

  useEffect(() => {
    if (!isActive) return;
    
    // Reset error state when reactivating
    setError(undefined);
    setRetryCount(0);
    setRetryDelay(3);
    lastScanRef.current = null;
    
    const cleanup = initializeScanner();
    return () => {
      cleanup?.then(cleanupFn => {
        if (cleanupFn) {
          cleanupFn();
        }
        stopStreamAndScanner();
      });
    };
  }, [activeCamera, isActive, initializeScanner, restartNonce]);

  // Pause camera when tab is hidden; resume when visible
  const pausedByVisibilityRef = useRef(false);
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        if (isActive) {
          pausedByVisibilityRef.current = true;
          // Pause without closing the scanner UI (important on iOS background/foreground).
          setIsActive(false);
          stopStreamAndScanner();
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
  }, [isActive, stopStreamAndScanner]);

  // Ensure camera shuts down on navigation / refresh (more reliable on iOS Safari).
  useEffect(() => {
    const handlePageExit = () => {
      stopStreamAndScanner();
    };
    window.addEventListener('pagehide', handlePageExit);
    window.addEventListener('beforeunload', handlePageExit);
    return () => {
      window.removeEventListener('pagehide', handlePageExit);
      window.removeEventListener('beforeunload', handlePageExit);
    };
  }, [stopStreamAndScanner]);

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
      if (retryIntervalRef.current) clearInterval(retryIntervalRef.current);
    };
  }, []);

  const torchAvailable = useMemo(() => {
    const track = videoTrackRef.current;
    if (!track || !('getCapabilities' in track)) return false;
    try {
      const caps = track.getCapabilities() as MediaTrackCapabilities & { torch?: boolean };
      return !!caps.torch;
    } catch {
      return false;
    }
  }, [cameras, activeCamera, isActive]);

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
            disabled={!torchAvailable}
          >
            {torchEnabled ? <FlashlightOff className="h-4 w-4" /> : <Flashlight className="h-4 w-4" />}
          </Button>
          {/* Turn Off Camera Button */}
          {!error && isActive && (
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

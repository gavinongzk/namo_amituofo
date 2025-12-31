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
  const [needsUserGesture, setNeedsUserGesture] = useState(false);
  const [isDecodingImage, setIsDecodingImage] = useState(false);
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
    if (!window.isSecureContext && window.location.hostname !== 'localhost') {
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
    setNeedsUserGesture(false);
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
    setNeedsUserGesture(false);
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
        // Always attach stream + track to refs only after we know we can use them.
        const track = stream.getVideoTracks()[0] || null;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try {
            await videoRef.current.play();
          } catch (playError) {
            // Some browsers (notably iOS Safari / in-app browsers) require an explicit user gesture to start playback.
            // Keep the stream attached, and let the user tap to start.
            console.warn('Video play() blocked; waiting for user gesture:', playError);
            setNeedsUserGesture(true);
          }
        }

        streamRef.current = stream;
        videoTrackRef.current = track;
        return stream;
      } catch (e) {
        // Prevent leaking a camera stream on partial failures.
        try {
          const maybeStream = streamRef.current;
          if (maybeStream) maybeStream.getTracks().forEach((t) => t.stop());
        } catch {
          // ignore
        } finally {
          streamRef.current = null;
          videoTrackRef.current = null;
          if (videoRef.current) {
            try {
              videoRef.current.pause();
            } catch {
              // ignore
            }
            videoRef.current.srcObject = null;
          }
        }
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
      setNeedsUserGesture(false);

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

  const handleUserGestureStart = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      await video.play();
      setNeedsUserGesture(false);
    } catch (e) {
      console.error('Still unable to start video playback:', e);
      setError('Unable to start camera preview. Please try another browser (Safari/Chrome) or use "Scan from Photo".');
    }
  }, []);

  const decodeFromImageFile = useCallback(
    async (file: File) => {
      setIsDecodingImage(true);
      setError(undefined);
      try {
        // Prefer native BarcodeDetector for images if available.
        ensureBarcodeDetector();
        const detector = barcodeDetectorRef.current;
        if (detector) {
          const bitmap = await createImageBitmap(file);
          const results = await detector.detect(bitmap);
          const value = results?.[0]?.rawValue?.trim();
          if (!value) throw new Error('No QR code found in the selected image.');
          handleSuccessfulScan(value);
          return;
        }

        // Fallback to ZXing image decode.
        const url = URL.createObjectURL(file);
        try {
          const reader = new BrowserQRCodeReader();
          const result = await reader.decodeFromImageUrl(url);
          const text = result?.getText?.() || '';
          const value = String(text).trim();
          if (!value) throw new Error('No QR code found in the selected image.');
          handleSuccessfulScan(value);
        } finally {
          URL.revokeObjectURL(url);
        }
      } catch (e: any) {
        console.error('Failed to decode image QR:', e);
        setError(`Scan from photo failed: ${e?.message || 'Unknown error'}`);
      } finally {
        setIsDecodingImage(false);
      }
    },
    [ensureBarcodeDetector, handleSuccessfulScan]
  );

  useEffect(() => {
    if (!isActive) return;
    
    // Reset error state when reactivating
    setError(undefined);
    setRetryCount(0);
    setRetryDelay(3);
    lastScanRef.current = null;
    setNeedsUserGesture(false);
    
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

  // Refresh camera list if devices change (e.g., permission granted, camera plugged/unplugged).
  useEffect(() => {
    if (!navigator?.mediaDevices?.addEventListener) return;
    const handler = () => {
      listCameras().catch(() => {
        // ignore
      });
    };
    navigator.mediaDevices.addEventListener('devicechange', handler);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handler);
    };
  }, [listCameras]);

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
    <div className="relative w-full max-w-[500px] mx-auto px-2 sm:px-0">
      <div className="relative aspect-square">
        <video 
          ref={videoRef}
          className="w-full h-full object-cover rounded-lg"
          autoPlay
          playsInline
          muted
          onClick={() => {
            if (needsUserGesture) void handleUserGestureStart();
          }}
        />
        
        {/* Scanning Guide Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="w-full h-full relative">
            {/* Corner guides - responsive sizing for mobile */}
            <div className="absolute top-0 left-0 w-16 h-16 sm:w-24 sm:h-24 border-t-[3px] sm:border-t-4 border-l-[3px] sm:border-l-4 border-primary-500" />
            <div className="absolute top-0 right-0 w-16 h-16 sm:w-24 sm:h-24 border-t-[3px] sm:border-t-4 border-r-[3px] sm:border-r-4 border-primary-500" />
            <div className="absolute bottom-0 left-0 w-16 h-16 sm:w-24 sm:h-24 border-b-[3px] sm:border-b-4 border-l-[3px] sm:border-l-4 border-primary-500" />
            <div className="absolute bottom-0 right-0 w-16 h-16 sm:w-24 sm:h-24 border-b-[3px] sm:border-b-4 border-r-[3px] sm:border-r-4 border-primary-500" />
            
            {/* Scanning line animation */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary-500 animate-scan" />
          </div>
        </div>

        {/* Camera Controls - Mobile optimized layout */}
        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 flex flex-col sm:flex-row gap-1.5 sm:gap-2">
          {/* Primary controls row (always visible) */}
          <div className="flex gap-1.5 sm:gap-2">
            {cameras.length > 1 && (
              <select 
                value={activeCamera}
                onChange={e => setActiveCamera(e.target.value)}
                className="bg-background/90 backdrop-blur-sm rounded-md px-1.5 sm:px-2 py-1 text-xs sm:text-sm border border-border/50 min-w-0 flex-shrink"
              >
                {cameras.map(camera => (
                  <option key={camera.deviceId} value={camera.deviceId}>
                    {camera.label || `Camera ${camera.deviceId.slice(0, 4)}`}
                  </option>
                ))}
              </select>
            )}

            {/* Scan from photo (fallback for browsers that block camera) */}
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
                // reset so selecting the same file again re-triggers change
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

          {/* Turn Off Camera Button - separate row on mobile */}
          {!error && isActive && (
            <Button 
              onClick={stopCamera}
              variant="destructive"
              size="sm"
              className="bg-red-500/90 backdrop-blur-sm hover:bg-red-600 text-white text-xs sm:text-sm px-2 sm:px-3 h-8 sm:h-9 w-full sm:w-auto"
            >
              <span className="hidden sm:inline">Turn Off Camera</span>
              <span className="sm:hidden">Turn Off</span>
            </Button>
          )}
        </div>

        {/* iOS / in-app browser recovery: user gesture needed to start video playback */}
        {needsUserGesture && !error && (
          <div className="absolute inset-0 bg-background/60 flex items-center justify-center p-4">
            <div className="text-center max-w-[280px] sm:max-w-[320px]">
              <p className="text-xs sm:text-sm text-gray-900 mb-3">
                Tap to start camera preview (required on some phones/browsers).<br />
                某些手机/浏览器需要点击才能启动摄像头预览。
              </p>
              <Button onClick={() => void handleUserGestureStart()} className="text-xs sm:text-sm px-4 py-2">
                Start Camera / 启动摄像头
              </Button>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center p-4">
            <div className="text-center max-w-full">
              <p className="text-xs sm:text-sm text-destructive mb-4 whitespace-pre-line break-words">{error}</p>
              {retryCount >= maxRetries && (
                <Button 
                  onClick={retry} 
                  disabled={isRetrying}
                  className="text-xs sm:text-sm px-4 py-2"
                >
                  {isRetrying ? <Loader2Icon className="animate-spin h-4 w-4" /> : '重试 / Retry'}
                </Button>
              )}
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

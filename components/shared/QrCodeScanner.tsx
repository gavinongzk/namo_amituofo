'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Flashlight, FlashlightOff, Loader2 as Loader2Icon, Settings, RefreshCw } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Scanner types
export type ScannerType = 'html5-qrcode' | 'zxing' | 'jsqr' | 'qr-scanner';

interface QrCodeScannerProps {
  onScan: (decodedText: string) => void;
  onClose?: () => void;
}

interface CameraDevice {
  id: string;
  label: string;
}

interface ScannerAdapter {
  startScanning: (containerId: string, onScan: (text: string) => Promise<void>) => Promise<void>;
  stopScanning: () => Promise<void>;
  listCameras: () => Promise<CameraDevice[]>;
  decodeFromImageFile: (file: File) => Promise<string>;
  getVideoTrack?: () => MediaStreamTrack | null;
  cleanup?: () => void;
}

// HTML5-QRCode Scanner Adapter
class Html5QrcodeAdapter implements ScannerAdapter {
  private scanner: any = null;
  private containerId: string = '';
  private videoTrack: MediaStreamTrack | null = null;

  async listCameras(): Promise<CameraDevice[]> {
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const devices = await Html5Qrcode.getCameras();
      return devices.map((d: any) => ({ id: d.id, label: d.label }));
    } catch (err) {
      console.error('Error listing cameras (html5-qrcode):', err);
      return [];
    }
  }

  async startScanning(containerId: string, onScan: (text: string) => Promise<void>): Promise<void> {
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      this.containerId = containerId;
      
      if (!this.scanner) {
        this.scanner = new Html5Qrcode(containerId);
      }

      const devices = await this.listCameras();
      if (devices.length === 0) {
        throw new Error('No cameras found');
      }

      const backCamera = devices.find(d => 
        d.label.toLowerCase().includes('back') || 
        d.label.toLowerCase().includes('rear') ||
        d.label.toLowerCase().includes('environment')
      );
      const cameraId = backCamera?.id || devices[0].id;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        disableFlip: false,
      };

      await this.scanner.start(
        cameraId,
        config,
        (decodedText: string) => {
          void onScan(decodedText);
        },
        () => {
          // Ignore scan errors
        }
      );

      // Get video track for torch
      setTimeout(() => {
        const container = document.getElementById(containerId);
        const videoElement = container?.querySelector('video');
        if (videoElement && videoElement.srcObject) {
          const stream = videoElement.srcObject as MediaStream;
          const tracks = stream.getVideoTracks();
          if (tracks.length > 0) {
            this.videoTrack = tracks[0];
          }
        }
      }, 500);
    } catch (err: any) {
      throw new Error(`html5-qrcode error: ${err.message || 'Unknown error'}`);
    }
  }

  async stopScanning(): Promise<void> {
    if (this.scanner) {
      try {
        await this.scanner.stop();
        this.scanner.clear();
      } catch (err) {
        console.warn('Error stopping html5-qrcode scanner:', err);
      }
      this.scanner = null;
    }
    this.videoTrack = null;
  }

  async decodeFromImageFile(file: File): Promise<string> {
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode(this.containerId || 'qr-reader-temp');
      const result = await scanner.scanFile(file, false);
      return result.trim();
    } catch (err: any) {
      throw new Error(`Failed to decode image: ${err.message || 'No QR code found'}`);
    }
  }

  getVideoTrack(): MediaStreamTrack | null {
    return this.videoTrack;
  }

  cleanup(): void {
    this.stopScanning();
  }
}

// ZXing Scanner Adapter
class ZXingAdapter implements ScannerAdapter {
  private codeReader: any = null;
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private containerId: string = '';

  async listCameras(): Promise<CameraDevice[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices
        .filter(device => device.kind === 'videoinput')
        .map(device => ({ id: device.deviceId, label: device.label || `Camera ${device.deviceId.slice(0, 4)}` }));
      return videoDevices;
    } catch (err) {
      console.error('Error listing cameras (ZXing):', err);
      return [];
    }
  }

  async startScanning(containerId: string, onScan: (text: string) => Promise<void>): Promise<void> {
    try {
      const { BrowserMultiFormatReader } = await import('@zxing/browser');
      this.containerId = containerId;
      
      this.codeReader = new BrowserMultiFormatReader();
      const container = document.getElementById(containerId);
      if (!container) {
        throw new Error('Container not found');
      }

      const devices = await this.listCameras();
      if (devices.length === 0) {
        throw new Error('No cameras found');
      }

      const backCamera = devices.find(d => 
        d.label.toLowerCase().includes('back') || 
        d.label.toLowerCase().includes('rear') ||
        d.label.toLowerCase().includes('environment')
      );
      const deviceId = backCamera?.id || devices[0].id;

      // Create video element if it doesn't exist
      let video = container.querySelector('video') as HTMLVideoElement;
      if (!video) {
        video = document.createElement('video');
        video.style.width = '100%';
        video.style.height = '100%';
        video.style.objectFit = 'cover';
        container.appendChild(video);
      }
      this.videoElement = video;

      await this.codeReader.decodeFromVideoDevice(
        deviceId,
        video,
        (result: any, err: any) => {
          if (result) {
            void onScan(result.getText());
          }
          if (err && err.name !== 'NotFoundException') {
            // Ignore NotFoundException - it's expected when no QR code is visible
          }
        }
      );

      // Get stream from video element (ZXing sets it internally)
      setTimeout(() => {
        if (video.srcObject) {
          this.stream = video.srcObject as MediaStream;
        }
      }, 500);
    } catch (err: any) {
      throw new Error(`ZXing error: ${err.message || 'Unknown error'}`);
    }
  }

  async stopScanning(): Promise<void> {
    if (this.codeReader) {
      try {
        this.codeReader.reset();
      } catch (err) {
        console.warn('Error stopping ZXing scanner:', err);
      }
      this.codeReader = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }
  }

  async decodeFromImageFile(file: File): Promise<string> {
    try {
      const { BrowserMultiFormatReader } = await import('@zxing/browser');
      const codeReader = new BrowserMultiFormatReader();
      
      const imageUrl = URL.createObjectURL(file);
      try {
        const result = await codeReader.decodeFromImageUrl(imageUrl);
        return result.getText().trim();
      } finally {
        URL.revokeObjectURL(imageUrl);
      }
    } catch (err: any) {
      throw new Error(`Failed to decode image: ${err.message || 'No QR code found'}`);
    }
  }

  getVideoTrack(): MediaStreamTrack | null {
    if (this.stream) {
      const tracks = this.stream.getVideoTracks();
      return tracks.length > 0 ? tracks[0] : null;
    }
    return null;
  }

  cleanup(): void {
    this.stopScanning();
  }
}

// jsQR Scanner Adapter
class JsqrAdapter implements ScannerAdapter {
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private containerId: string = '';
  private scanningInterval: any = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  async listCameras(): Promise<CameraDevice[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices
        .filter(device => device.kind === 'videoinput')
        .map(device => ({ id: device.deviceId, label: device.label || `Camera ${device.deviceId.slice(0, 4)}` }));
      return videoDevices;
    } catch (err) {
      console.error('Error listing cameras (jsQR):', err);
      return [];
    }
  }

  async startScanning(containerId: string, onScan: (text: string) => Promise<void>): Promise<void> {
    try {
      this.containerId = containerId;
      const container = document.getElementById(containerId);
      if (!container) {
        throw new Error('Container not found');
      }

      const devices = await this.listCameras();
      if (devices.length === 0) {
        throw new Error('No cameras found');
      }

      const backCamera = devices.find(d => 
        d.label.toLowerCase().includes('back') || 
        d.label.toLowerCase().includes('rear') ||
        d.label.toLowerCase().includes('environment')
      );
      const deviceId = backCamera?.id || devices[0].id;

      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: { exact: deviceId },
          facingMode: 'environment',
        },
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);

      // Create video element
      let video = container.querySelector('video') as HTMLVideoElement;
      if (!video) {
        video = document.createElement('video');
        video.style.width = '100%';
        video.style.height = '100%';
        video.style.objectFit = 'cover';
        video.setAttribute('playsinline', 'true');
        video.setAttribute('autoplay', 'true');
        container.appendChild(video);
      }
      this.videoElement = video;
      video.srcObject = this.stream;
      await video.play();

      // Create canvas for processing
      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
      if (!this.ctx) {
        throw new Error('Could not get canvas context');
      }

      // Import jsQR dynamically
      const jsQR = (await import('jsqr')).default;

      // Start scanning loop
      this.scanningInterval = setInterval(async () => {
        if (!video || !this.canvas || !this.ctx || video.readyState !== video.HAVE_ENOUGH_DATA) return;

        this.canvas.width = video.videoWidth;
        this.canvas.height = video.videoHeight;
        this.ctx.drawImage(video, 0, 0, this.canvas.width, this.canvas.height);

        try {
          const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code && code.data) {
            void onScan(code.data);
          }
        } catch (err) {
          // Ignore decode errors
        }
      }, 300);
    } catch (err: any) {
      throw new Error(`jsQR error: ${err.message || 'Unknown error'}`);
    }
  }

  async stopScanning(): Promise<void> {
    if (this.scanningInterval) {
      clearInterval(this.scanningInterval);
      this.scanningInterval = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }

    this.canvas = null;
    this.ctx = null;
  }

  async decodeFromImageFile(file: File): Promise<string> {
    try {
      const jsQR = (await import('jsqr')).default;
      const imageUrl = URL.createObjectURL(file);
      
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (!ctx) {
            URL.revokeObjectURL(imageUrl);
            reject(new Error('Could not get canvas context'));
            return;
          }

          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          
          URL.revokeObjectURL(imageUrl);
          
          if (code && code.data) {
            resolve(code.data.trim());
          } else {
            reject(new Error('No QR code found'));
          }
        };
        img.onerror = () => {
          URL.revokeObjectURL(imageUrl);
          reject(new Error('Failed to load image'));
        };
        img.src = imageUrl;
      });
    } catch (err: any) {
      throw new Error(`Failed to decode image: ${err.message || 'No QR code found'}`);
    }
  }

  getVideoTrack(): MediaStreamTrack | null {
    if (this.stream) {
      const tracks = this.stream.getVideoTracks();
      return tracks.length > 0 ? tracks[0] : null;
    }
    return null;
  }

  cleanup(): void {
    this.stopScanning();
  }
}

// qr-scanner Scanner Adapter
class QrScannerAdapter implements ScannerAdapter {
  private qrScanner: any = null;
  private containerId: string = '';

  async listCameras(): Promise<CameraDevice[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices
        .filter(device => device.kind === 'videoinput')
        .map(device => ({ id: device.deviceId, label: device.label || `Camera ${device.deviceId.slice(0, 4)}` }));
      return videoDevices;
    } catch (err) {
      console.error('Error listing cameras (qr-scanner):', err);
      return [];
    }
  }

  async startScanning(containerId: string, onScan: (text: string) => Promise<void>): Promise<void> {
    try {
      const QrScanner = (await import('qr-scanner')).default;
      this.containerId = containerId;
      
      const container = document.getElementById(containerId);
      if (!container) {
        throw new Error('Container not found');
      }

      const devices = await this.listCameras();
      if (devices.length === 0) {
        throw new Error('No cameras found');
      }

      const backCamera = devices.find(d => 
        d.label.toLowerCase().includes('back') || 
        d.label.toLowerCase().includes('rear') ||
        d.label.toLowerCase().includes('environment')
      );
      const deviceId = backCamera?.id || devices[0].id;

      // qr-scanner uses video element directly
      let video = container.querySelector('video') as HTMLVideoElement;
      if (!video) {
        video = document.createElement('video');
        video.style.width = '100%';
        video.style.height = '100%';
        video.style.objectFit = 'cover';
        container.appendChild(video);
      }

      this.qrScanner = new QrScanner(
        video,
        (result: any) => {
          // result can be string or ScanResult object
          const data = typeof result === 'string' ? result : result.data;
          void onScan(data);
        },
        {
          preferredCamera: deviceId,
          returnDetailedScanResult: true,
        }
      );

      await this.qrScanner.start();
    } catch (err: any) {
      throw new Error(`qr-scanner error: ${err.message || 'Unknown error'}`);
    }
  }

  async stopScanning(): Promise<void> {
    if (this.qrScanner) {
      try {
        await this.qrScanner.stop();
        this.qrScanner.destroy();
      } catch (err) {
        console.warn('Error stopping qr-scanner:', err);
      }
      this.qrScanner = null;
    }
  }

  async decodeFromImageFile(file: File): Promise<string> {
    try {
      const QrScanner = (await import('qr-scanner')).default;
      const result = await QrScanner.scanImage(file, { returnDetailedScanResult: true });
      return result.data.trim();
    } catch (err: any) {
      throw new Error(`Failed to decode image: ${err.message || 'No QR code found'}`);
    }
  }

  getVideoTrack(): MediaStreamTrack | null {
    if (this.qrScanner && this.qrScanner.$video) {
      const video = this.qrScanner.$video as HTMLVideoElement;
      if (video.srcObject) {
        const stream = video.srcObject as MediaStream;
        const tracks = stream.getVideoTracks();
        return tracks.length > 0 ? tracks[0] : null;
      }
    }
    return null;
  }

  cleanup(): void {
    this.stopScanning();
  }
}

const QrCodeScanner: React.FC<QrCodeScannerProps> = ({ onScan, onClose }) => {
  const [scannerType, setScannerType] = useState<ScannerType>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('qr-scanner-type');
      if (saved && ['html5-qrcode', 'zxing', 'jsqr', 'qr-scanner'].includes(saved)) {
        return saved as ScannerType;
      }
    }
    return 'html5-qrcode';
  });

  const [error, setError] = useState<string>();
  const [isScanning, setIsScanning] = useState(false);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [isDecodingImage, setIsDecodingImage] = useState(false);
  const [showScannerSettings, setShowScannerSettings] = useState(false);

  const adapterRef = useRef<ScannerAdapter | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScanRef = useRef<{ value: string; at: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSuccessfulScan = useCallback(async (text: string) => {
    // Vibrate if supported
    if (navigator.vibrate) {
      navigator.vibrate(200);
    }

    // De-dupe rapid repeat detections
    const nowMs = Date.now();
    const last = lastScanRef.current;
    if (last && last.value === text && nowMs - last.at < 1200) {
      return;
    }
    lastScanRef.current = { value: text, at: nowMs };
    
    onScan(text);
  }, [onScan]);

  const getAdapter = useCallback((): ScannerAdapter => {
    switch (scannerType) {
      case 'zxing':
        return new ZXingAdapter();
      case 'jsqr':
        return new JsqrAdapter();
      case 'qr-scanner':
        return new QrScannerAdapter();
      case 'html5-qrcode':
      default:
        return new Html5QrcodeAdapter();
    }
  }, [scannerType]);

  const listCameras = useCallback(async () => {
    try {
      const adapter = getAdapter();
      const devices = await adapter.listCameras();
      setCameras(devices);
      return devices;
    } catch (err) {
      console.error('Error listing cameras:', err);
      setCameras([]);
      return [];
    }
  }, [getAdapter]);

  const startScanning = useCallback(async () => {
    if (isScanning || !containerRef.current) return;

    try {
      setError(undefined);
      
      // Clean up previous adapter
      if (adapterRef.current) {
        await adapterRef.current.stopScanning();
        adapterRef.current.cleanup?.();
      }

      const adapter = getAdapter();
      adapterRef.current = adapter;

      const containerId = containerRef.current.id || 'qr-reader';
      if (!containerRef.current.id) {
        containerRef.current.id = containerId;
      }

      await adapter.startScanning(containerId, handleSuccessfulScan);
      setIsScanning(true);
    } catch (err: any) {
      console.error('Error starting scanner:', err);
      let errorMessage = 'Failed to start camera. ';
      
      if (err.message?.includes('denied') || err.name === 'NotAllowedError') {
        errorMessage = 'Camera access denied. Please enable camera permissions in your browser settings and refresh the page.';
      } else if (err.message?.includes('No cameras') || err.name === 'NotFoundError') {
        errorMessage = 'No camera found. Please ensure your device has a camera.';
      } else if (err.message?.includes('in use') || err.name === 'NotReadableError') {
        errorMessage = 'Camera is in use by another application. Please close other apps using the camera and try again.\n摄像头被其他应用占用，请关闭其他应用后重试。';
      } else {
        errorMessage = `Camera error: ${err.message || 'Unknown error'}. Please try a different scanner type or refresh the page.`;
      }
      
      setError(errorMessage);
      setIsScanning(false);
    }
  }, [isScanning, getAdapter, handleSuccessfulScan]);

  const stopScanning = useCallback(async () => {
    if (adapterRef.current) {
      try {
        await adapterRef.current.stopScanning();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
      adapterRef.current.cleanup?.();
      adapterRef.current = null;
    }
    setIsScanning(false);
  }, []);

  const toggleTorch = useCallback(async () => {
    if (!adapterRef.current) return;
    
    const track = adapterRef.current.getVideoTrack?.();
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

  const decodeFromImageFile = useCallback(async (file: File) => {
    setIsDecodingImage(true);
    setError(undefined);
    
    try {
      const adapter = getAdapter();
      const decodedText = await adapter.decodeFromImageFile(file);
      if (decodedText) {
        await handleSuccessfulScan(decodedText);
      } else {
        throw new Error('No QR code found in the selected image.');
      }
    } catch (err: any) {
      console.error('Failed to decode image QR:', err);
      setError('No QR code found in the selected image. Please try another image.');
    } finally {
      setIsDecodingImage(false);
    }
  }, [getAdapter, handleSuccessfulScan]);

  const handleScannerTypeChange = useCallback(async (newType: ScannerType) => {
    setScannerType(newType);
    if (typeof window !== 'undefined') {
      localStorage.setItem('qr-scanner-type', newType);
    }
    
    // Stop current scanner and restart with new type
    await stopScanning();
    setError(undefined);
    
    // Small delay before restarting
    setTimeout(() => {
      startScanning();
    }, 300);
  }, [stopScanning, startScanning]);

  const handleRetryCamera = useCallback(async () => {
    setError(undefined);
    await stopScanning();
    
    // Force refresh camera list
    await listCameras();
    
    // Small delay before restarting
    setTimeout(() => {
      startScanning();
    }, 500);
  }, [stopScanning, listCameras, startScanning]);

  const torchAvailable = adapterRef.current?.getVideoTrack?.() && 
    'getCapabilities' in (adapterRef.current.getVideoTrack() as MediaStreamTrack) &&
    ((adapterRef.current.getVideoTrack() as MediaStreamTrack).getCapabilities() as MediaTrackCapabilities & { torch?: boolean }).torch;

  // Initialize on mount
  useEffect(() => {
    listCameras();
    return () => {
      stopScanning();
    };
  }, [listCameras, stopScanning]);

  // Start scanning when scanner type is ready
  useEffect(() => {
    if (containerRef.current && cameras.length > 0 && !isScanning) {
      startScanning();
    }
    
    return () => {
      stopScanning();
    };
  }, [cameras.length, scannerType]); // Restart when scanner type changes

  // Handle visibility change
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        if (isScanning) {
          stopScanning();
        }
      } else if (cameras.length > 0 && !isScanning) {
        startScanning();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isScanning, cameras.length, startScanning, stopScanning]);

  const scannerTypeNames: Record<ScannerType, string> = {
    'html5-qrcode': 'HTML5 QR Code',
    'zxing': 'ZXing Browser',
    'jsqr': 'jsQR',
    'qr-scanner': 'QR Scanner',
  };

  return (
    <div className="relative w-full max-w-[500px] mx-auto px-2 sm:px-0">
      {/* Scanner Type Selector */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <label className="text-xs sm:text-sm text-gray-600">
          Scanner Type / 扫描器类型:
        </label>
        <Select value={scannerType} onValueChange={handleScannerTypeChange}>
          <SelectTrigger className="w-[160px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="html5-qrcode">HTML5 QR Code</SelectItem>
            <SelectItem value="zxing">ZXing Browser</SelectItem>
            <SelectItem value="jsqr">jsQR</SelectItem>
            <SelectItem value="qr-scanner">QR Scanner</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="relative aspect-square">
        <div
          id="qr-reader"
          ref={containerRef}
          className="w-full h-full rounded-lg overflow-hidden bg-black"
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
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary-500 animate-pulse" />
          </div>
        </div>

        {/* Camera Controls */}
        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-20 flex flex-col sm:flex-row gap-1.5 sm:gap-2">
          <div className="flex gap-1.5 sm:gap-2">
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
              className="bg-white dark:bg-gray-800 border-border/50 text-xs sm:text-sm px-2 sm:px-3 h-8 sm:h-9"
              disabled={isDecodingImage}
            >
              <span className="hidden sm:inline">{isDecodingImage ? 'Scanning…' : 'Scan Photo'}</span>
              <span className="sm:hidden">{isDecodingImage ? '…' : '📷'}</span>
            </Button>
            
            <Button 
              onClick={toggleTorch}
              variant="outline" 
              size="icon"
              className="bg-white dark:bg-gray-800 border-border/50 h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0"
              disabled={!torchAvailable}
            >
              {torchEnabled ? <FlashlightOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Flashlight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
            </Button>

            {/* Retry Camera Button */}
            <Button 
              onClick={handleRetryCamera}
              variant="outline" 
              size="icon"
              className="bg-white dark:bg-gray-800 border-border/50 h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0"
              title="Retry Camera / 重试摄像头"
            >
              <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
              className="bg-red-500 hover:bg-red-600 text-white text-xs sm:text-sm px-2 sm:px-3 h-8 sm:h-9 w-full sm:w-auto"
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
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button 
                  onClick={handleRetryCamera}
                  className="text-xs sm:text-sm px-4 py-2"
                >
                  Retry Camera / 重试摄像头
                </Button>
                {scannerType !== 'html5-qrcode' && (
                  <Button 
                    onClick={() => handleScannerTypeChange('html5-qrcode')}
                    variant="outline"
                    className="text-xs sm:text-sm px-4 py-2"
                  >
                    Try HTML5 Scanner
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <p className="mt-2 text-xs sm:text-sm text-gray-600 text-center px-2">
        将二维码置于框内以进行扫描。
        <br className="hidden sm:block" />
        <span className="sm:hidden"> / </span>
        Position the QR code within the frame to scan.
        <br />
        <span className="text-xs text-gray-500">Using: {scannerTypeNames[scannerType]}</span>
      </p>
    </div>
  );
};

export default QrCodeScanner;
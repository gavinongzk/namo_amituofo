'use client';

import React, { useEffect, useRef, useState } from 'react';
import { BrowserQRCodeReader } from '@zxing/browser';
import { Button } from '@/components/ui/button';
import { Camera, CameraOff, RotateCw, X, Zap } from 'lucide-react';

interface QrCodeScannerProps {
  onScan: (decodedText: string) => void;
  onClose?: () => void;
}

const QrCodeScanner: React.FC<QrCodeScannerProps> = ({ onScan, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [codeReader, setCodeReader] = useState<BrowserQRCodeReader | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');

  const checkCameraDevices = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        setDebugInfo('Device enumeration not supported');
        return;
      }
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setDebugInfo(`Found ${videoDevices.length} camera(s): ${videoDevices.map(d => d.label || 'Unknown camera').join(', ')}`);
    } catch (error) {
      setDebugInfo(`Error checking devices: ${error}`);
    }
  };

  const startCamera = async () => {
    try {
      setIsLoading(true);
      setError('');
      setIsScanning(false);
      setDebugInfo('正在初始化摄像头... Initializing camera...');

      // Stop any existing stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      // Check if browser supports camera access
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser does not support camera access');
      }

      // Check if page is served over HTTPS (required for camera access in most browsers)
      if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
        throw new Error('Camera access requires HTTPS. Please use a secure connection.');
      }

      let mediaStream = null;
      
      // Try different camera configurations in order of preference (simplified for better compatibility)
      const cameraConfigs = [
        {
          name: 'back camera (ideal)',
          config: {
            video: {
              facingMode: { ideal: 'environment' }
            }
          }
        },
        {
          name: 'front camera (ideal)',
          config: {
            video: {
              facingMode: { ideal: 'user' }
            }
          }
        },
        {
          name: 'any camera (no constraints)',
          config: {
            video: true
          }
        }
      ];

      let lastError = null;
      for (const { name, config } of cameraConfigs) {
        try {
          console.log(`Attempting to access ${name}...`);
          setDebugInfo(`尝试访问 ${name}... Trying ${name}...`);
          mediaStream = await navigator.mediaDevices.getUserMedia(config);
          console.log(`Successfully accessed ${name}`);
          setDebugInfo(`成功访问 ${name} Successfully accessed ${name}`);
          break;
        } catch (error: any) {
          console.log(`Failed to access ${name}:`, error);
          setDebugInfo(`${name} 失败: ${error.name} ${name} failed: ${error.name}`);
          lastError = error;
          
          // If it's a permission error, don't try other configs
          if (error.name === 'NotAllowedError') {
            throw error;
          }
          continue;
        }
      }

      if (!mediaStream) {
        throw lastError || new Error('Failed to access any camera');
      }

      // Set up video element
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        
        // Wait for video to be ready with timeout
        await new Promise((resolve, reject) => {
          if (!videoRef.current) {
            reject(new Error('Video element not available'));
            return;
          }

          const timeout = setTimeout(() => {
            reject(new Error('Video loading timeout'));
          }, 10000); // 10 second timeout

          const handleLoadedMetadata = () => {
            clearTimeout(timeout);
            resolve(true);
          };

          const handleError = () => {
            clearTimeout(timeout);
            reject(new Error('Video element error'));
          };

          videoRef.current.onloadedmetadata = handleLoadedMetadata;
          videoRef.current.onerror = handleError;

          // Try to play the video
          videoRef.current.play().catch(e => {
            console.log('Video play failed:', e);
            // Don't reject here, sometimes play fails but video still works
          });
        });

        // Initialize QR code reader
        const reader = new BrowserQRCodeReader();
        setCodeReader(reader);

        // Start scanning with error handling
        try {
          reader.decodeFromVideoDevice(undefined, videoRef.current, (result, error) => {
            if (result) {
              console.log('QR Code detected:', result.getText());
              setIsScanning(false);
              onScan(result.getText());
            }
            // Ignore scanning errors, they're usually just "no QR code found"
          });
        } catch (scanError) {
          console.error('QR scanner initialization failed:', scanError);
          // Continue anyway, the camera is working
        }

        setIsLoading(false);
        setIsScanning(true);
        console.log('Camera initialization successful');
      } else {
        throw new Error('Video element not found');
      }
    } catch (err: any) {
      console.error('Camera initialization error:', err);
      setIsLoading(false);
      setIsScanning(false);
      
      if (err.name === 'NotAllowedError') {
        setError('摄像头权限被拒绝，请允许摄像头访问后重试 / Camera permission denied. Please allow camera access and try again.');
      } else if (err.name === 'NotFoundError') {
        setError('未找到摄像头，请检查设备是否有摄像头 / No camera found. Please check your device has a camera.');
      } else if (err.name === 'NotSupportedError') {
        setError('此浏览器不支持摄像头，请使用Chrome、Firefox或Safari / Camera not supported in this browser. Try Chrome, Firefox, or Safari.');
      } else if (err.name === 'NotReadableError') {
        setError('摄像头被其他应用占用，请关闭其他使用摄像头的应用 / Camera is being used by another application. Please close other camera apps.');
      } else if (err.message.includes('timeout')) {
        setError('摄像头启动超时，请重试 / Camera startup timeout. Please try again.');
      } else {
        setError(`摄像头错误 Camera error: ${err.message || '未知错误 Unknown error'}`);
      }
    }
  };

  const stopCamera = () => {
    // Clean up code reader if needed
    setCodeReader(null);
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  const handleClose = () => {
    stopCamera();
    if (onClose) onClose();
  };

  const retry = () => {
    stopCamera();
    setTimeout(startCamera, 500);
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  return (
    <div className="relative w-full max-w-lg mx-auto p-4">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-full shadow-lg">
          <Zap className="w-5 h-5" />
          <span className="font-semibold">QR 扫描器 / QR Scanner</span>
        </div>
      </div>

      {/* Camera Container */}
      <div className="relative aspect-square bg-gradient-to-br from-gray-900 to-black rounded-3xl overflow-hidden shadow-2xl ring-4 ring-blue-500/20">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          playsInline
          muted
        />

        {/* Gradient overlay for better contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/20 pointer-events-none" />

        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-900/90 to-indigo-900/90 backdrop-blur-sm">
            <div className="text-white text-center">
              <div className="relative mb-4">
                <div className="animate-spin w-12 h-12 border-3 border-white/30 border-t-white rounded-full mx-auto"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Camera className="w-6 h-6 text-white animate-pulse" />
                </div>
              </div>
              <p className="text-lg font-medium">启动摄像头中...</p>
              <p className="text-sm text-white/80">Starting camera...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-red-900/90 to-red-800/90 backdrop-blur-sm">
            <div className="text-white text-center p-6 max-w-xs">
              <div className="bg-red-500/20 rounded-full p-4 inline-block mb-4">
                <CameraOff className="w-8 h-8 text-red-300" />
              </div>
              <p className="text-sm mb-4 leading-relaxed">{error}</p>
              {debugInfo && (
                <p className="text-xs mb-4 text-white/70 bg-black/20 p-2 rounded">{debugInfo}</p>
              )}
              <div className="flex flex-col gap-3">
                <Button 
                  onClick={retry} 
                  size="sm" 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg"
                >
                  <RotateCw className="w-4 h-4 mr-2" />
                  重试 Retry
                </Button>
                <Button 
                  onClick={checkCameraDevices} 
                  size="sm" 
                  variant="outline" 
                  className="border-white/30 text-white hover:bg-white/10"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  检查设备 Check Devices
                </Button>
                <Button 
                  onClick={handleClose} 
                  size="sm" 
                  variant="outline" 
                  className="border-white/30 text-white hover:bg-white/10"
                >
                  <X className="w-4 h-4 mr-2" />
                  关闭 Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Scanning Frame */}
        {!isLoading && !error && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-56 h-56 sm:w-64 sm:h-64">
              {/* Animated corner brackets with glow */}
              <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-blue-400 animate-corner-pulse drop-shadow-lg">
                <div className="absolute -top-1 -left-1 w-10 h-10 border-t-2 border-l-2 border-blue-300/50 animate-scan-glow"></div>
              </div>
              <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-blue-400 animate-corner-pulse drop-shadow-lg">
                <div className="absolute -top-1 -right-1 w-10 h-10 border-t-2 border-r-2 border-blue-300/50 animate-scan-glow"></div>
              </div>
              <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-blue-400 animate-corner-pulse drop-shadow-lg">
                <div className="absolute -bottom-1 -left-1 w-10 h-10 border-b-2 border-l-2 border-blue-300/50 animate-scan-glow"></div>
              </div>
              <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-blue-400 animate-corner-pulse drop-shadow-lg">
                <div className="absolute -bottom-1 -right-1 w-10 h-10 border-b-2 border-r-2 border-blue-300/50 animate-scan-glow"></div>
              </div>
              
              {/* Animated scanning line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-400 to-transparent animate-scan-line drop-shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-scan-glow"></div>
              </div>
              
              {/* Subtle grid overlay */}
              <div className="absolute inset-4 border border-dashed border-white/20 rounded-lg"></div>
              
              {/* Central target dot */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse shadow-lg shadow-red-400/50">
                  <div className="absolute inset-0 bg-red-300 rounded-full animate-ping"></div>
                </div>
              </div>

              {/* Status indicator */}
              {isScanning && (
                <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 bg-green-500/90 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium animate-pulse">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
                    扫描中... Scanning...
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Enhanced Close button */}
        <Button
          onClick={handleClose}
          size="icon"
          variant="ghost"
          className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white border border-white/20 backdrop-blur-sm shadow-lg"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Enhanced Instructions */}
      <div className="mt-6 text-center">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 shadow-lg border border-blue-100">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-gray-800">使用说明 Instructions</span>
          </div>
          <p className="text-gray-700 leading-relaxed">
            将二维码对准扫描框内，保持稳定等待识别<br />
            <span className="text-sm text-gray-600">Position QR code within the frame and hold steady</span>
          </p>
          {debugInfo && !error && (
            <p className="text-xs mt-3 text-blue-600 bg-blue-50 p-2 rounded">{debugInfo}</p>
          )}
        </div>
      </div>

      {/* Enhanced Manual retry button */}
      {error && (
        <div className="mt-6">
          <Button 
            onClick={retry} 
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-4 rounded-2xl shadow-lg font-medium text-lg"
          >
            <Camera className="w-5 h-5 mr-3" />
            重新尝试摄像头 Try Camera Again
          </Button>
        </div>
      )}
    </div>
  );
};

export default QrCodeScanner;

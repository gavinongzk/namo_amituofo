'use client';

import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface QrCodeWithLogoProps {
  qrCode: string;
  isAttended: boolean;
  isNewlyMarked?: boolean;
  queueNumber?: string;
}

const QrCodeWithLogo: React.FC<QrCodeWithLogoProps> = React.memo(({ 
  qrCode, 
  isAttended,
  isNewlyMarked,
  queueNumber 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const logoSrc = '/assets/images/amitabha_image.png';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !qrCode) {
      setIsLoading(true);
      return;
    }

    setIsLoading(true);
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) {
      console.error('Failed to get canvas context');
      setIsLoading(false);
      return;
    }

    const qrCodeImage = new Image();
    qrCodeImage.onload = () => {
      const logoImage = new Image();
      logoImage.onload = () => {
        // Set high DPI for sharper rendering
        const scale = window.devicePixelRatio || 1;
        const scaledWidth = qrCodeImage.width * scale;
        const scaledHeight = qrCodeImage.height * scale;

        // Set canvas dimensions with scale
        canvas.width = scaledWidth;
        canvas.height = scaledHeight;
        canvas.style.width = `${qrCodeImage.width}px`;
        canvas.style.height = `${qrCodeImage.height}px`;

        // Enable image smoothing for better quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Scale context to match device pixel ratio
        ctx.scale(scale, scale);

        // Fill white background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, qrCodeImage.width, qrCodeImage.height);

        // Draw QR code
        ctx.drawImage(qrCodeImage, 0, 0, qrCodeImage.width, qrCodeImage.height);

        // Calculate logo size (20% of QR code size for better readability)
        const logoSize = qrCodeImage.width * 0.2;
        const logoX = (qrCodeImage.width - logoSize) / 2;
        const logoY = (qrCodeImage.height - logoSize) / 2;

        // Create a circular clip path for the logo with anti-aliasing
        ctx.save();
        ctx.beginPath();
        ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        
        // Add a white background with a slight padding for the logo
        const padding = logoSize * 0.1;
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        
        // Add a subtle shadow effect
        ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 2;
        
        // Clip and draw the logo
        ctx.clip();
        ctx.drawImage(
          logoImage,
          logoX - padding,
          logoY - padding,
          logoSize + (padding * 2),
          logoSize + (padding * 2)
        );
        
        ctx.restore();
        setIsLoading(false);
      };
      logoImage.onerror = (e) => {
        console.error('Failed to load logo image:', e);
        // Draw QR code without logo as fallback
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(qrCodeImage, 0, 0, canvas.width, canvas.height);
        setIsLoading(false);
      };
      logoImage.src = logoSrc;
    };
    qrCodeImage.onerror = (e) => {
      console.error('Failed to load QR code image:', e);
      setIsLoading(false);
    };
    qrCodeImage.src = qrCode;

  }, [qrCode, logoSrc]);

  // Apply opacity and grayscale via CSS classes on the container
  const containerClasses = cn(
    "relative aspect-square w-full transition-all duration-300",
    isAttended ? 'opacity-40 grayscale' : '',
    isNewlyMarked ? 'animate-flash' : ''
  );

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className={containerClasses}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        )}
        <canvas 
          ref={canvasRef} 
          className="w-full h-full object-contain"
          style={{ imageRendering: 'crisp-edges' }}
        />
        {isAttended && (
          <div className={`absolute inset-0 flex flex-col items-center justify-center gap-2 transition-all duration-300
            ${isNewlyMarked ? 'animate-fade-in scale-105' : ''}`}>
            <div className="bg-green-100/90 p-3 rounded-lg shadow-lg backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <svg 
                  className={`w-6 h-6 text-green-600 ${isNewlyMarked ? 'animate-check-mark' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M5 13l4 4L19 7" 
                  />
                </svg>
                <span className="text-lg font-semibold text-green-700">已出席</span>
              </div>
              <p className="text-sm text-green-600 text-center mt-1">Attendance Marked</p>
            </div>
            <div className="bg-yellow-100/90 px-3 py-1 rounded-lg mt-2">
              <p className="text-sm text-yellow-700">请保留此二维码以供核实 Please keep this QR code for verification</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for React.memo
  return (
    prevProps.qrCode === nextProps.qrCode &&
    prevProps.isAttended === nextProps.isAttended &&
    prevProps.isNewlyMarked === nextProps.isNewlyMarked &&
    prevProps.queueNumber === nextProps.queueNumber
  );
});

QrCodeWithLogo.displayName = 'QrCodeWithLogo';

export default QrCodeWithLogo; 
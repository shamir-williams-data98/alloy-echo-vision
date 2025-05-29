
import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { useCamera } from '@/hooks/useCamera';
import CameraControls from '@/components/CameraControls';
import CameraOverlay from '@/components/CameraOverlay';
import CameraError from '@/components/CameraError';
import CameraLoading from '@/components/CameraLoading';
import CameraDisabled from '@/components/CameraDisabled';

interface WebcamCaptureProps {
  enabled: boolean;
  onImageCapture?: (imageData: string) => void;
}

const WebcamCapture = forwardRef<any, WebcamCaptureProps>(({ enabled, onImageCapture }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [videoReady, setVideoReady] = useState(false);
  
  const { stream, error, isLoading, isReady, startCamera, requestPermission } = useCamera({
    enabled,
    facingMode
  });

  // Start camera when enabled changes
  useEffect(() => {
    if (enabled) {
      startCamera();
    }
  }, [enabled, startCamera]);

  useImperativeHandle(ref, () => ({
    captureImage: () => {
      if (!videoRef.current || !canvasRef.current || !isReady || !videoReady) {
        console.log('Video not ready for capture');
        return null;
      }
      
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) return null;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      console.log('Image captured successfully');
      onImageCapture?.(imageData);
      return imageData;
    }
  }));

  useEffect(() => {
    if (stream && videoRef.current) {
      const video = videoRef.current;
      video.srcObject = stream;
      setVideoReady(false);
      
      const handleLoadedData = () => {
        console.log('Video loaded, starting playback');
        video.play()
          .then(() => {
            console.log('Video playing successfully');
            setVideoReady(true);
          })
          .catch(err => {
            console.error('Error playing video:', err);
          });
      };

      video.addEventListener('loadeddata', handleLoadedData);
      
      return () => {
        video.removeEventListener('loadeddata', handleLoadedData);
        setVideoReady(false);
      };
    }
  }, [stream]);

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    setVideoReady(false);
  };

  if (!enabled) {
    return <CameraDisabled />;
  }

  if (error) {
    return (
      <CameraError 
        error={error} 
        onRetry={startCamera}
        onRequestPermission={requestPermission}
      />
    );
  }

  if (isLoading || !videoReady) {
    return <CameraLoading />;
  }

  return (
    <div className="w-full h-full relative bg-black rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />
      <canvas ref={canvasRef} className="hidden" />
      
      <CameraControls 
        facingMode={facingMode}
        onToggleCamera={toggleCamera}
      />
      
      <CameraOverlay 
        facingMode={facingMode}
        isReady={isReady && videoReady}
      />
    </div>
  );
});

WebcamCapture.displayName = 'WebcamCapture';

export default WebcamCapture;

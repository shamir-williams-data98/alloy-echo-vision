
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
  
  const { 
    stream, 
    error, 
    isLoading, 
    isReady, 
    permissionGranted,
    requestPermission 
  } = useCamera({
    enabled,
    facingMode
  });

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

  // Show error state for permission denied or other errors
  if (error && permissionGranted === false) {
    return (
      <CameraError 
        error={error} 
        onRetry={() => window.location.reload()}
        onRequestPermission={requestPermission}
      />
    );
  }

  // Show error for other types of errors
  if (error && !isLoading) {
    return (
      <CameraError 
        error={error} 
        onRetry={() => window.location.reload()}
      />
    );
  }

  // Show loading state
  if (isLoading || (!stream && permissionGranted !== false)) {
    return <CameraLoading />;
  }

  // Show permission request UI only when we know permission is needed
  if (permissionGranted === false && !error) {
    return (
      <div className="w-full h-full bg-gray-800 rounded-lg flex items-center justify-center p-4">
        <div className="text-center text-gray-300">
          <div className="w-16 h-16 mx-auto mb-4 bg-cyan-500/20 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-sm mb-3">Camera access required</p>
          <button 
            onClick={requestPermission}
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded text-sm"
          >
            Allow Camera
          </button>
        </div>
      </div>
    );
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

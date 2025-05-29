
import { useState, useRef, useCallback } from 'react';

interface UseCameraProps {
  enabled: boolean;
  facingMode: 'user' | 'environment';
}

export const useCamera = ({ enabled, facingMode }: UseCameraProps) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setStream(null);
    setIsReady(false);
    setIsLoading(false);
  }, []);

  const requestPermission = useCallback(async () => {
    try {
      setError('');
      console.log('Requesting camera permission...');
      
      // Simple permission request
      const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
      tempStream.getTracks().forEach(track => track.stop());
      
      console.log('Permission granted, starting camera');
      startCamera();
    } catch (err) {
      console.error('Permission denied:', err);
      setError('Camera permission denied. Please allow camera access.');
    }
  }, []);

  const startCamera = useCallback(async () => {
    if (!enabled) {
      stopCamera();
      return;
    }

    try {
      setError('');
      setIsLoading(true);
      setIsReady(false);

      // Stop existing stream
      stopCamera();

      console.log('Starting camera with facingMode:', facingMode);

      const constraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: facingMode
        }
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      streamRef.current = mediaStream;
      setStream(mediaStream);
      setIsLoading(false);
      setIsReady(true);
      
      console.log('Camera started successfully');
      
    } catch (err) {
      console.error('Camera error:', err);
      setIsLoading(false);
      setIsReady(false);
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError('Camera access denied. Click "Grant Permission" below.');
        } else if (err.name === 'NotFoundError') {
          setError('No camera found on this device.');
        } else {
          setError('Unable to access camera. Please try again.');
        }
      }
    }
  }, [enabled, facingMode]);

  return {
    stream,
    error,
    isLoading,
    isReady,
    startCamera,
    stopCamera,
    requestPermission
  };
};

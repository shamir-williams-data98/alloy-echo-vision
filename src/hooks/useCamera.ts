
import { useState, useRef, useCallback, useEffect } from 'react';

interface UseCameraProps {
  enabled: boolean;
  facingMode: 'user' | 'environment';
}

export const useCamera = ({ enabled, facingMode }: UseCameraProps) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    console.log('Stopping camera...');
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setStream(null);
    setIsReady(false);
    setIsLoading(false);
  }, []);

  const startCamera = useCallback(async () => {
    if (!enabled) {
      stopCamera();
      return;
    }

    try {
      setError('');
      setIsLoading(true);
      console.log('Starting camera with facingMode:', facingMode);

      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

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
      setPermissionGranted(true);
      
      console.log('Camera started successfully');
      
    } catch (err) {
      console.error('Camera start error:', err);
      setIsLoading(false);
      setIsReady(false);
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setPermissionGranted(false);
          setError('Camera access denied. Please allow camera access.');
        } else if (err.name === 'NotFoundError') {
          setError('No camera found on this device.');
        } else if (err.name === 'NotReadableError') {
          setError('Camera is already in use by another application.');
        } else {
          setError(`Camera error: ${err.message}`);
        }
      }
    }
  }, [enabled, facingMode, stopCamera]);

  const requestPermission = useCallback(() => {
    console.log('Requesting camera permission by attempting to start camera...');
    startCamera();
  }, [startCamera]);

  // Initialize camera when enabled or facingMode changes
  useEffect(() => {
    if (!enabled) {
      stopCamera();
      setPermissionGranted(null);
      setError('');
      return;
    }

    startCamera();
  }, [enabled, facingMode, startCamera]);

  return {
    stream,
    error,
    isLoading,
    isReady,
    permissionGranted,
    startCamera,
    stopCamera,
    requestPermission
  };
};

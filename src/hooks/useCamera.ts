
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

  const requestPermission = useCallback(async () => {
    try {
      setError('');
      setIsLoading(true);
      console.log('Requesting camera permission...');
      
      const tempStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      
      // Permission granted, clean up temp stream
      tempStream.getTracks().forEach(track => track.stop());
      setPermissionGranted(true);
      console.log('Permission granted');
      
      // Now start the actual camera
      await startCamera();
    } catch (err) {
      console.error('Permission request failed:', err);
      setPermissionGranted(false);
      setIsLoading(false);
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError('Camera access denied. Please click the camera icon in your browser\'s address bar to allow access.');
        } else if (err.name === 'NotFoundError') {
          setError('No camera found on this device.');
        } else {
          setError('Unable to access camera. Please try again.');
        }
      }
    }
  }, []);

  const startCamera = useCallback(async () => {
    if (!enabled) {
      stopCamera();
      return;
    }

    // If permission is explicitly denied, don't try to start
    if (permissionGranted === false) {
      setError('Camera permission denied. Please allow camera access.');
      setIsLoading(false);
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
          setError('Camera access denied. Please allow camera access below.');
        } else if (err.name === 'NotFoundError') {
          setError('No camera found on this device.');
        } else {
          setError(`Camera error: ${err.message}`);
        }
      }
    }
  }, [enabled, facingMode, permissionGranted]);

  // Initialize camera when enabled
  useEffect(() => {
    if (!enabled) {
      stopCamera();
      setPermissionGranted(null);
      return;
    }

    // Check if we already know the permission state
    if (permissionGranted === true) {
      startCamera();
    } else if (permissionGranted === false) {
      setError('Camera permission denied. Please allow camera access.');
      setIsLoading(false);
    } else {
      // Permission state unknown, try to start camera directly
      startCamera();
    }
  }, [enabled]);

  // Handle facingMode changes
  useEffect(() => {
    if (enabled && permissionGranted === true && !isLoading) {
      startCamera();
    }
  }, [facingMode]);

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

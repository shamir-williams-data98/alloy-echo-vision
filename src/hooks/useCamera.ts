
import { useState, useRef, useEffect, useCallback } from 'react';

interface UseCameraProps {
  enabled: boolean;
  facingMode: 'user' | 'environment';
}

export const useCamera = ({ enabled, facingMode }: UseCameraProps) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
      });
      setStream(null);
    }
    setIsReady(false);
    setIsLoading(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, [stream]);

  const requestPermission = useCallback(async () => {
    try {
      setError('');
      console.log('Requesting camera permission...');
      
      const tempStream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: false 
      });
      
      tempStream.getTracks().forEach(track => track.stop());
      console.log('Permission granted');
      
      // Immediately start camera after permission
      initializeCamera();
    } catch (err) {
      console.error('Permission request failed:', err);
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError('Camera permission was denied. Please click "Grant Permission" and allow camera access.');
        } else {
          setError('Failed to request camera permission. Please try again.');
        }
      }
    }
  }, []);

  const initializeCamera = useCallback(async () => {
    if (!enabled) return;
    
    try {
      setError('');
      setIsLoading(true);
      setIsReady(false);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Shorter timeout and immediate failure
      timeoutRef.current = setTimeout(() => {
        console.log('Camera loading timeout - trying simplified constraints');
        setIsLoading(false);
        setError('Camera is taking too long to load. Click "Grant Permission" to try again.');
      }, 3000);
      
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera not supported by this browser');
      }

      console.log('Starting camera with facing mode:', facingMode);
      
      // Very simple constraints for faster loading
      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 320 },
          height: { ideal: 240 },
          facingMode: facingMode
        },
        audio: false
      };

      console.log('Requesting camera with simplified constraints');
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      console.log('Camera stream obtained successfully');
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      setStream(mediaStream);
      setIsLoading(false);
      setIsReady(true);
      
    } catch (err) {
      console.error('Camera error:', err);
      setIsLoading(false);
      setIsReady(false);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError('Camera access denied. Click "Grant Permission" to allow camera access.');
        } else if (err.name === 'NotFoundError') {
          setError('No camera found. Please connect a camera device.');
        } else if (err.name === 'NotReadableError') {
          setError('Camera is being used by another application. Please close other camera apps.');
        } else {
          setError('Unable to access camera. Click "Grant Permission" to try again.');
        }
      }
    }
  }, [enabled, facingMode, stream]);

  // Only initialize when enabled changes
  useEffect(() => {
    if (enabled) {
      initializeCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [enabled]);

  // Handle facing mode changes separately
  useEffect(() => {
    if (enabled && stream) {
      console.log('Facing mode changed, reinitializing camera');
      initializeCamera();
    }
  }, [facingMode]);

  return {
    stream,
    error,
    isLoading,
    isReady,
    startCamera: initializeCamera,
    stopCamera,
    requestPermission
  };
};

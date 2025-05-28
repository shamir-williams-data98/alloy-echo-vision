
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
  const currentFacingMode = useRef(facingMode);

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
      
      // Request basic camera access to trigger permission dialog
      const tempStream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: false 
      });
      
      // Immediately stop the temp stream
      tempStream.getTracks().forEach(track => track.stop());
      
      console.log('Permission granted, starting camera...');
      
      // Trigger camera start by setting a flag
      window.dispatchEvent(new CustomEvent('camera-permission-granted'));
    } catch (err) {
      console.error('Permission request failed:', err);
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError('Camera permission was denied. Please refresh the page and try again.');
        } else {
          setError('Failed to request camera permission. Please try again.');
        }
      }
    }
  }, []);

  const initializeCamera = useCallback(async () => {
    try {
      setError('');
      setIsLoading(true);
      setIsReady(false);
      
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set timeout for camera loading - reduced to 5 seconds
      timeoutRef.current = setTimeout(() => {
        console.log('Camera loading timeout');
        setIsLoading(false);
        setError('Camera is taking too long to load. Please try refreshing the page or check your camera.');
      }, 5000);
      
      // Stop existing stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }

      // Check browser support
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera not supported by this browser');
      }

      console.log('Starting camera with facing mode:', currentFacingMode.current);
      
      // Simplified constraints for faster loading
      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 480 },
          height: { ideal: 360 },
          facingMode: currentFacingMode.current === 'environment' ? 'environment' : 'user'
        },
        audio: false
      };

      console.log('Requesting camera with constraints:', constraints);
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      console.log('Camera stream obtained successfully');
      
      // Clear timeout on success
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      setStream(mediaStream);
      setIsLoading(false);
      setIsReady(true);
      
      return mediaStream;
    } catch (err) {
      console.error('Camera error:', err);
      setIsLoading(false);
      setIsReady(false);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError('Camera access denied. Please grant camera permission to continue.');
        } else if (err.name === 'NotFoundError') {
          setError('No camera found. Please connect a camera device.');
        } else if (err.name === 'NotReadableError') {
          setError('Camera is already in use by another application. Please close other camera apps and try again.');
        } else if (err.name === 'OverconstrainedError') {
          setError('Camera settings not supported. Please try switching cameras.');
        } else if (err.name === 'NotSupportedError') {
          setError('Camera not supported by this browser.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Unable to access camera. Please check your permissions and try again.');
      }
    }
  }, [stream]);

  // Update facing mode reference when it changes
  useEffect(() => {
    currentFacingMode.current = facingMode;
  }, [facingMode]);

  // Main effect for enabling/disabling camera
  useEffect(() => {
    if (enabled) {
      initializeCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled]); // Only depend on enabled

  // Handle facing mode changes
  useEffect(() => {
    if (enabled && stream) {
      console.log('Facing mode changed, reinitializing camera');
      initializeCamera();
    }
  }, [facingMode]); // Only depend on facingMode

  // Listen for permission granted event
  useEffect(() => {
    const handlePermissionGranted = () => {
      if (enabled) {
        initializeCamera();
      }
    };

    window.addEventListener('camera-permission-granted', handlePermissionGranted);
    return () => {
      window.removeEventListener('camera-permission-granted', handlePermissionGranted);
    };
  }, [enabled, initializeCamera]);

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

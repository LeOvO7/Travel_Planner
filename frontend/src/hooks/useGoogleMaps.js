import { useEffect, useState } from 'react';

// Singleton pattern: ensure Google Maps is only loaded once
let isGoogleMapsLoading = false;
let isGoogleMapsLoaded = false;
let googleMapsLoadError = null;

/**
 * Custom hook to load Google Maps API using the new v2.x functional API
 * Returns { isLoaded, loadError, google }
 *
 * This hook ensures the Google Maps API is only loaded once across the entire app,
 * even if multiple components use this hook simultaneously.
 */
export function useGoogleMaps() {
  const [isLoaded, setIsLoaded] = useState(isGoogleMapsLoaded);
  const [loadError, setLoadError] = useState(googleMapsLoadError);
  const [google, setGoogle] = useState(isGoogleMapsLoaded ? window.google : null);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      const error = new Error('VITE_GOOGLE_MAPS_API_KEY not found in environment variables');
      setLoadError(error);
      googleMapsLoadError = error;
      return;
    }

    // If already loaded, just set state
    if (isGoogleMapsLoaded) {
      setIsLoaded(true);
      setGoogle(window.google);
      return;
    }

    // If currently loading, wait for it
    if (isGoogleMapsLoading) {
      const checkInterval = setInterval(() => {
        if (isGoogleMapsLoaded) {
          setIsLoaded(true);
          setGoogle(window.google);
          clearInterval(checkInterval);
        } else if (googleMapsLoadError) {
          setLoadError(googleMapsLoadError);
          clearInterval(checkInterval);
        }
      }, 100);
      return () => clearInterval(checkInterval);
    }

    // Load Google Maps using native script injection
    isGoogleMapsLoading = true;

    const loadGoogleMaps = () => {
      return new Promise((resolve, reject) => {
        // Check if already loaded via script tag
        if (window.google && window.google.maps) {
          resolve(window.google);
          return;
        }

        // Create script element
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&v=weekly`;
        script.async = true;
        script.defer = true;

        script.onload = () => {
          if (window.google && window.google.maps) {
            resolve(window.google);
          } else {
            reject(new Error('Google Maps failed to load'));
          }
        };

        script.onerror = () => {
          reject(new Error('Failed to load Google Maps script'));
        };

        document.head.appendChild(script);
      });
    };

    loadGoogleMaps()
      .then((googleInstance) => {
        isGoogleMapsLoaded = true;
        isGoogleMapsLoading = false;
        setGoogle(googleInstance);
        setIsLoaded(true);
        console.log('✅ Google Maps loaded successfully');
      })
      .catch((error) => {
        isGoogleMapsLoading = false;
        googleMapsLoadError = error;
        console.error('❌ Failed to load Google Maps API:', error);
        setLoadError(error);
      });
  }, []);

  return { isLoaded, loadError, google };
}

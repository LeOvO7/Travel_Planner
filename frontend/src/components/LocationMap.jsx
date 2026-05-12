import { useMemo, useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';
import CollapsibleSection from './CollapsibleSection';
import { useGoogleMaps } from '../hooks/useGoogleMaps';
import { createMarkerForPlace } from '../utils/googleMapsMarkers';

/**
 * LocationMap - Embedded map component for chat messages
 * Displays a small map with markers for hotels, restaurants, and attractions
 *
 * @param {Array} places - Array of place objects with { name, type, lat, lng, info }
 * @param {Array} center - [latitude, longitude] for map center
 * @param {number} zoom - Initial zoom level (default: 12)
 */
export default function LocationMap({ places, center, zoom = 12 }) {
  const { isLoaded, loadError, google } = useGoogleMaps();

  // Refs for Google Maps instances
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const infoWindowRef = useRef(null);

  // Filter valid places with coordinates
  const validPlaces = useMemo(
    () => places.filter(p => p.lat && p.lng && !isNaN(p.lat) && !isNaN(p.lng)),
    [places]
  );

  // Return null if no valid places or center
  if (!places || places.length === 0 || !center) return null;
  if (validPlaces.length === 0) return null;

  // Initialize Google Map
  useEffect(() => {
    if (!isLoaded || !google || !mapContainerRef.current || mapInstanceRef.current) return;

    const map = new google.maps.Map(mapContainerRef.current, {
      center: { lat: center[0], lng: center[1] },
      zoom,
      disableDefaultUI: true,
      zoomControl: true,
      gestureHandling: 'cooperative'
    });

    mapInstanceRef.current = map;
    infoWindowRef.current = new google.maps.InfoWindow();
  }, [isLoaded, google, center, zoom]);

  // Create markers and fit bounds
  useEffect(() => {
    if (!mapInstanceRef.current || !google || !isLoaded) return;

    // Clean up old markers
    markersRef.current.forEach(marker => {
      marker.setMap(null);
    });
    markersRef.current = [];

    // Create new markers
    if (validPlaces.length > 0) {
      // Convert place types to match expected format
      const placesWithIds = validPlaces.map((place, idx) => ({
        ...place,
        id: idx + 1,
        color: place.type === 'hotel' ? '#6366F1' : place.type === 'restaurant' ? '#10B981' : '#F59E0B',
        type: place.type === 'attraction' ? 'sight' : place.type === 'restaurant' ? 'food' : 'hotel'
      }));

      const newMarkers = placesWithIds.map(place =>
        createMarkerForPlace(google, mapInstanceRef.current, place, (p) => handleMarkerClick(p))
      );
      markersRef.current = newMarkers;

      // Auto-fit bounds to show all markers
      const bounds = new google.maps.LatLngBounds();
      validPlaces.forEach(p => {
        bounds.extend({ lat: p.lat, lng: p.lng });
      });
      mapInstanceRef.current.fitBounds(bounds, 40); // 40px padding
    }
  }, [validPlaces, google, isLoaded]);

  // Handle marker click
  const handleMarkerClick = (place) => {
    if (!infoWindowRef.current || !mapInstanceRef.current) return;

    const originalPlace = validPlaces.find(p => p.lat === place.lat && p.lng === place.lng);

    const content = `
      <div style="padding: 8px;">
        <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">${originalPlace?.name || place.name}</div>
        ${originalPlace?.info ? `<div style="font-size: 12px; color: #64748B;">${originalPlace.info}</div>` : ''}
      </div>
    `;

    infoWindowRef.current.setContent(content);

    // Find corresponding marker
    const markerIndex = validPlaces.findIndex(p => p.lat === place.lat && p.lng === place.lng);
    const marker = markersRef.current[markerIndex];

    if (marker) {
      infoWindowRef.current.open(mapInstanceRef.current, marker);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up markers
      markersRef.current.forEach(marker => {
        marker.setMap(null);
      });

      // Close info window
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
      }
    };
  }, []);

  // Loading state
  if (!isLoaded && !loadError) {
    return (
      <CollapsibleSection icon={MapPin} title="Map" count={validPlaces.length}>
        <div className="rounded-lg overflow-hidden border border-[#E2E8F0] flex items-center justify-center" style={{ height: '360px' }}>
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-[#6366F1] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs text-[#64748B]">Loading map...</p>
          </div>
        </div>
      </CollapsibleSection>
    );
  }

  // Error state
  if (loadError) {
    return (
      <CollapsibleSection icon={MapPin} title="Map" count={validPlaces.length}>
        <div className="rounded-lg overflow-hidden border border-[#E2E8F0] flex items-center justify-center bg-red-50" style={{ height: '360px' }}>
          <div className="text-center p-4">
            <p className="text-xs text-red-600">Failed to load map</p>
          </div>
        </div>
      </CollapsibleSection>
    );
  }

  return (
    <CollapsibleSection icon={MapPin} title="Map" count={validPlaces.length}>
      <div className="rounded-lg overflow-hidden border border-[#E2E8F0]" style={{ height: '360px' }}>
        <div
          ref={mapContainerRef}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
      {/* Legend */}
      <div className="flex gap-4 mt-2.5 text-[11px] text-[#64748B]">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
          Restaurants
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#6366F1]" />
          Hotels
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-2.5 rounded-full bg-[#F59E0B]" />
          Recommended spots
        </div>
      </div>
    </CollapsibleSection>
  );
}

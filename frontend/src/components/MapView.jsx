import { useState, useMemo, useEffect, useRef } from 'react';
import {
  ArrowLeft, Layers, Building2, Utensils, Landmark,
  Star, MapPin, AlertCircle, List
} from 'lucide-react';
import { useGoogleMaps } from '../hooks/useGoogleMaps';
import { createMarkerForPlace } from '../utils/googleMapsMarkers';

// ---------------------------------------------------------------------------
// Helpers: extract structured data from session messages
// ---------------------------------------------------------------------------

function extractStructuredData(session) {
  if (!session?.messages) return [];
  const allData = [];
  for (const msg of session.messages) {
    if (msg.type === 'assistant' && msg.structuredData) {
      allData.push(...msg.structuredData);
    }
  }
  return allData;
}

function buildPlaces(structuredData) {
  const places = [];
  let id = 1;

  const hotels = structuredData.find(d => d.type === 'hotels')?.items || [];
  const restaurants = structuredData.find(d => d.type === 'restaurants')?.items || [];
  const attractions = structuredData.find(d => d.type === 'attractions')?.items || [];

  for (const h of hotels) {
    places.push({
      id: id++,
      name: h.name,
      desc: `Hotel · ${h.city || ''}${h.price != null ? ` · ${h.currency || 'USD'} ${Math.round(h.price)}/night` : ''}`,
      rating: h.reviewScore ? (typeof h.reviewScore === 'number' ? h.reviewScore : parseFloat(h.reviewScore)) : null,
      ratingMax: 10,
      reviews: h.reviewCount || 0,
      extra: h.reviewScoreWord || '',
      type: 'hotel',
      color: '#6366F1',
      lat: h.latitude || null,
      lng: h.longitude || null,
      photoUrl: h.photoUrl || null,
    });
  }

  for (const r of restaurants) {
    places.push({
      id: id++,
      name: r.name,
      desc: `Restaurant · ${r.city || ''}${r.priceTag ? ` · ${r.priceTag}` : ''}`,
      rating: r.averageRating && r.averageRating !== 'N/A' ? parseFloat(r.averageRating) : null,
      ratingMax: 5,
      reviews: r.userReviewCount || 0,
      extra: r.cuisineTags?.join(', ') || '',
      type: 'food',
      color: '#10B981',
      lat: r.latitude || null,
      lng: r.longitude || null,
      address: r.address || '',
    });
  }

  for (const a of attractions) {
    places.push({
      id: id++,
      name: a.name,
      desc: `Attraction · ${a.city || ''}${a.price != null && a.price !== '' ? ` · ${a.currency || 'USD'} ${a.price}` : a.price === 0 ? ' · Free' : ''}`,
      rating: a.rating ? parseFloat(a.rating) : null,
      ratingMax: 5,
      reviews: a.reviewCount || 0,
      extra: a.shortDescription || '',
      type: 'sight',
      color: '#F59E0B',
      lat: a.latitude || null,
      lng: a.longitude || null,
      photoUrl: a.photoUrl || null,
    });
  }

  return places;
}

// ---------------------------------------------------------------------------
// Filter definitions
// ---------------------------------------------------------------------------

const FILTER_DEFS = [
  { key: 'all',   label: 'All',    icon: Layers },
  { key: 'hotel', label: 'Hotels', icon: Building2 },
  { key: 'food',  label: 'Food',   icon: Utensils },
  { key: 'sight', label: 'Sights', icon: Landmark },
];

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function MapView({ session, onBack }) {
  const { isLoaded, loadError, google } = useGoogleMaps();

  // Refs for Google Maps instances
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const infoWindowRef = useRef(null);
  const listItemRefs = useRef({});

  // Component state
  const [selectedId, setSelectedId] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [showListOnMobile, setShowListOnMobile] = useState(false);

  // Build places from real session data
  const structuredData = useMemo(() => extractStructuredData(session), [session]);
  const allPlaces = useMemo(() => buildPlaces(structuredData), [structuredData]);
  const placesWithCoords = useMemo(() => allPlaces.filter(p => p.lat && p.lng), [allPlaces]);

  // Get city center from weather data
  const weather = structuredData.find(d => d.type === 'weather')?.items?.[0];
  const mapCenter = useMemo(() => {
    if (weather?.latitude && weather?.longitude) return { lat: weather.latitude, lng: weather.longitude };
    if (placesWithCoords.length > 0) return { lat: placesWithCoords[0].lat, lng: placesWithCoords[0].lng };
    return { lat: 40.7128, lng: -74.0060 }; // Default to New York City
  }, [weather, placesWithCoords]);

  const cityName = weather?.cityName || session?.title?.replace(/^Trip to\s*/i, '') || '';

  // Debug logging
  useEffect(() => {
    console.log('🗺️ MapView Debug Info:', {
      hasSession: !!session,
      sessionTitle: session?.title,
      messageCount: session?.messages?.length || 0,
      structuredDataCount: structuredData.length,
      structuredDataTypes: structuredData.map(d => d.type),
      allPlacesCount: allPlaces.length,
      placesWithCoordsCount: placesWithCoords.length,
      mapCenter,
      weather: weather ? { city: weather.cityName, lat: weather.latitude, lng: weather.longitude } : null,
      firstPlace: placesWithCoords[0],
      apiKeyLoaded: !!import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
      apiKeyPrefix: import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.substring(0, 20) + '...',
      isLoaded,
      loadError: loadError?.message
    });
  }, [session, structuredData, allPlaces, placesWithCoords, mapCenter, weather, isLoaded, loadError]);

  // Filter
  const filtered = activeFilter === 'all'
    ? allPlaces
    : allPlaces.filter(p => p.type === activeFilter);

  // Initialize Google Map (runs once when API is loaded)
  useEffect(() => {
    if (!isLoaded || !google || !mapContainerRef.current || mapInstanceRef.current) return;

    const map = new google.maps.Map(mapContainerRef.current, {
      center: mapCenter,
      zoom: 12,
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      styles: [] // Clean, modern style
    });

    mapInstanceRef.current = map;
    infoWindowRef.current = new google.maps.InfoWindow();
  }, [isLoaded, google, mapCenter]);

  // Update markers when places change
  useEffect(() => {
    if (!mapInstanceRef.current || !google || !isLoaded) return;

    // Clean up old markers
    markersRef.current.forEach(marker => {
      marker.setMap(null);
    });
    markersRef.current = [];

    // Create new markers
    if (placesWithCoords.length > 0) {
      const newMarkers = placesWithCoords.map(place =>
        createMarkerForPlace(google, mapInstanceRef.current, place, handleMarkerClick)
      );
      markersRef.current = newMarkers;

      // Fit bounds to show all markers
      fitAllMarkers();
    }
  }, [placesWithCoords, google, isLoaded]);

  // Fit all markers in view
  const fitAllMarkers = () => {
    if (!mapInstanceRef.current || !google || placesWithCoords.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    placesWithCoords.forEach(place => {
      bounds.extend({ lat: place.lat, lng: place.lng });
    });
    mapInstanceRef.current.fitBounds(bounds, 50); // 50px padding
  };

  // Handle list item click -> map interaction
  const handleListClick = (place) => {
    setSelectedId(place.id);

    if (mapInstanceRef.current && place.lat && place.lng) {
      // Smooth pan to location
      mapInstanceRef.current.panTo({ lat: place.lat, lng: place.lng });
      mapInstanceRef.current.setZoom(15);

      // Open info window
      showInfoWindow(place);
    }
  };

  // Handle map marker click -> list interaction
  const handleMarkerClick = (place) => {
    setSelectedId(place.id);

    // Scroll list item into view
    const listItem = listItemRefs.current[place.id];
    if (listItem) {
      listItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Open info window
    showInfoWindow(place);
  };

  // Show info window for a place
  const showInfoWindow = (place) => {
    if (!infoWindowRef.current || !mapInstanceRef.current) return;

    const content = `
      <div style="min-width: 180px; padding: 8px;">
        <div style="font-size: 14px; font-weight: 600; margin-bottom: 4px;">${place.name}</div>
        <div style="font-size: 12px; color: #64748B; margin-bottom: 4px;">${place.desc}</div>
        ${place.rating != null ? `
          <div style="font-size: 12px;">
            <span style="color: #F59E0B;">★</span> ${place.rating}/${place.ratingMax}
            ${place.reviews > 0 ? ` · ${place.reviews.toLocaleString()} reviews` : ''}
          </div>
        ` : ''}
      </div>
    `;

    infoWindowRef.current.setContent(content);

    // Find corresponding marker and open info window
    const marker = markersRef.current.find((m, idx) =>
      placesWithCoords[idx]?.id === place.id
    );

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

      // Map instance will be garbage collected
    };
  }, []);

  // No data state
  if (allPlaces.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
        <AlertCircle className="w-12 h-12 text-[#94A3B8] mb-4" />
        <h2 className="text-lg font-semibold text-[#0F172A] mb-2">No map data yet</h2>
        <p className="text-sm text-[#64748B] max-w-sm mb-6">
          Start a trip planning session first. The map will show hotels, restaurants, and attractions from your travel plan.
        </p>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#6366F1] text-white rounded-lg text-sm font-medium hover:bg-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to chat
        </button>
      </div>
    );
  }

  // Loading state
  if (!isLoaded && !loadError) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#6366F1] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-[#64748B]">Loading map...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (loadError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-lg font-semibold text-[#0F172A] mb-2">Failed to load map</h2>
        <p className="text-sm text-[#64748B] max-w-sm mb-6">
          {loadError.message || 'An error occurred while loading Google Maps'}
        </p>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#6366F1] text-white rounded-lg text-sm font-medium hover:bg-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to chat
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden relative">
      {/* Debug overlay - Remove this after debugging */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[9999] bg-yellow-100 border-2 border-yellow-500 rounded-lg p-3 shadow-lg max-w-md">
        <div className="text-xs font-mono space-y-1">
          <div className="font-bold text-yellow-800 mb-2">🐛 Debug Info (Remove after fixing)</div>
          <div><strong>API Key:</strong> {import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? '✅ Loaded' : '❌ Missing'}</div>
          <div><strong>isLoaded:</strong> {isLoaded ? '✅' : '❌'} {isLoaded.toString()}</div>
          <div><strong>loadError:</strong> {loadError ? '❌ ' + loadError.message : '✅ null'}</div>
          <div><strong>Places:</strong> {allPlaces.length} total, {placesWithCoords.length} with coords</div>
          <div><strong>Center:</strong> [{mapCenter.lat.toFixed(4)}, {mapCenter.lng.toFixed(4)}]</div>
          <div><strong>Map Container:</strong> {mapContainerRef.current ? '✅ Exists' : '❌ Missing'}</div>
          <div><strong>Map Instance:</strong> {mapInstanceRef.current ? '✅ Created' : '❌ Not created'}</div>
          <div><strong>Markers:</strong> {markersRef.current.length} markers</div>
        </div>
      </div>

      {/* Mobile list toggle button */}
      <button
        onClick={() => setShowListOnMobile(!showListOnMobile)}
        className="md:hidden fixed top-4 left-4 z-[1001] bg-white border border-[#E2E8F0] rounded-lg p-2.5 shadow-lg hover:bg-slate-50 transition-colors"
        title={showListOnMobile ? 'Hide list' : 'Show list'}
      >
        <List className="w-5 h-5 text-[#0F172A]" />
      </button>

      {/* Mobile back button */}
      <button
        onClick={onBack}
        className="md:hidden fixed top-4 right-4 z-[1001] bg-white border border-[#E2E8F0] rounded-lg p-2.5 shadow-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5"
        title="Back to chat"
      >
        <ArrowLeft className="w-4 h-4 text-[#0F172A]" />
        <span className="text-sm font-medium text-[#0F172A]">Back</span>
      </button>

      {/* Backdrop for mobile list */}
      {showListOnMobile && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-[999]"
          onClick={() => setShowListOnMobile(false)}
        />
      )}

      {/* Left list panel */}
      <div className={`
        w-full max-w-[85vw] md:w-[340px] bg-white border-r border-[#E2E8F0] flex flex-col flex-shrink-0
        md:relative md:translate-x-0
        max-md:fixed max-md:left-0 max-md:top-0 max-md:h-full max-md:z-[1000]
        max-md:transition-transform max-md:duration-300
        ${showListOnMobile ? 'max-md:translate-x-0' : 'max-md:-translate-x-full'}
      `}>
        {/* Header */}
        <div className="px-5 py-[18px] border-b border-[#E2E8F0]">
          <button
            onClick={onBack}
            className="text-xs text-[#64748B] flex gap-1.5 items-center mb-1.5 hover:text-[#0F172A] transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            {session?.title || 'Back'}
          </button>
          <h2 className="text-[17px] font-bold tracking-[-0.01em]">Map view</h2>
          <div className="text-[12.5px] text-[#64748B] mt-0.5">
            {filtered.length} places{cityName ? ` · ${cityName}` : ''}
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex gap-1.5 px-5 py-2.5 border-b border-[#E2E8F0] bg-[#F8FAFC] overflow-x-auto">
          {FILTER_DEFS.map(f => {
            const Icon = f.icon;
            const count = f.key === 'all' ? allPlaces.length : allPlaces.filter(p => p.type === f.key).length;
            if (f.key !== 'all' && count === 0) return null;
            return (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={`inline-flex gap-1.5 items-center px-3 py-[5px] rounded-full text-xs whitespace-nowrap border transition-colors ${
                  activeFilter === f.key
                    ? 'bg-[#EEF2FF] border-[#A5B4FC] text-[#4338CA] font-medium'
                    : 'bg-white border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]'
                }`}
              >
                <Icon className="w-[11px] h-[11px]" />
                {f.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Place list */}
        <div className="flex-1 overflow-y-auto">
          {filtered.map(place => {
            const hasCoords = place.lat != null && place.lng != null;
            return (
              <button
                key={place.id}
                ref={el => listItemRefs.current[place.id] = el}
                onClick={() => handleListClick(place)}
                className={`w-full flex gap-3 px-[18px] py-3 border-b border-[#F1F5F9] text-left transition-colors ${
                  selectedId === place.id
                    ? 'bg-[#EEF2FF] border-l-[3px] border-l-[#6366F1] pl-[15px]'
                    : 'hover:bg-[#F8FAFC]'
                }`}
              >
                {/* Numbered pin */}
                <div
                  className="w-[26px] h-[26px] rounded-full text-white font-mono text-xs font-semibold flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: place.color }}
                >
                  {place.id}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-semibold leading-snug">{place.name}</div>
                  <div className="text-xs text-[#64748B] mt-0.5">{place.desc}</div>
                  <div className="flex gap-2 mt-1.5 text-[11px] text-[#64748B] items-center flex-wrap">
                    {place.rating != null && (
                      <>
                        <span className="text-[#F59E0B] flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5 fill-current" />
                          {place.rating}/{place.ratingMax}
                        </span>
                        {place.reviews > 0 && (
                          <>
                            <span className="w-[3px] h-[3px] rounded-full bg-[#CBD5E1]" />
                            <span>{place.reviews.toLocaleString()} reviews</span>
                          </>
                        )}
                      </>
                    )}
                    {place.extra && (
                      <>
                        {place.rating != null && <span className="w-[3px] h-[3px] rounded-full bg-[#CBD5E1]" />}
                        <span className="truncate">{place.extra}</span>
                      </>
                    )}
                    {!hasCoords && (
                      <>
                        <span className="w-[3px] h-[3px] rounded-full bg-[#CBD5E1]" />
                        <span className="flex items-center gap-0.5 text-[#94A3B8]">
                          <MapPin className="w-2.5 h-2.5" /> No location
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right map panel */}
      <div className="flex-1 relative overflow-hidden">
        <div
          ref={mapContainerRef}
          style={{ width: '100%', height: '100%' }}
        />

        {/* Legend */}
        <div className="absolute bottom-3.5 right-[18px] bg-white border border-[#E2E8F0] rounded-[10px] px-3 py-2.5 flex flex-col gap-1.5 text-[11px] z-[1000]">
          <div className="flex gap-2 items-center text-[#475569]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#6366F1]" />
            Hotels
          </div>
          <div className="flex gap-2 items-center text-[#475569]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
            Restaurants
          </div>
          <div className="flex gap-2 items-center text-[#475569]">
            <span className="w-4 h-2.5 rounded-full bg-[#F59E0B]" />
            Recommended spots
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Google Maps Marker Creation Utilities
 *
 * Provides functions to create custom markers with styled appearance
 * matching the app's design system using standard google.maps.Marker
 */

/**
 * Create a circular numbered pin marker for hotels and restaurants
 * Uses standard Marker with SVG data URL icon
 *
 * @param {google.maps} google - Google Maps API instance
 * @param {google.maps.Map} map - Map instance
 * @param {Object} place - Place object with id, name, color, lat, lng
 * @param {Function} onClick - Click handler function
 * @returns {google.maps.Marker} The created marker
 */
export function createCircleMarker(google, map, place, onClick) {
  // Create SVG icon with number
  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
      <circle cx="18" cy="18" r="15" fill="${place.color}" stroke="white" stroke-width="3"/>
      <text x="18" y="23" text-anchor="middle" fill="white" font-size="12" font-weight="700" font-family="monospace">${place.id}</text>
    </svg>
  `.trim();

  const icon = {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svgIcon),
    scaledSize: new google.maps.Size(36, 36),
    anchor: new google.maps.Point(18, 18)
  };

  const marker = new google.maps.Marker({
    position: { lat: place.lat, lng: place.lng },
    map: map,
    icon: icon,
    title: place.name,
    optimized: false // Required for custom SVG icons
  });

  // Add click listener
  marker.addListener('click', () => onClick(place));

  return marker;
}

/**
 * Create a tag-style label marker for attractions
 * Uses standard Marker with SVG data URL
 *
 * @param {google.maps} google - Google Maps API instance
 * @param {google.maps.Map} map - Map instance
 * @param {Object} place - Place object with name, lat, lng
 * @param {Function} onClick - Click handler function
 * @returns {google.maps.Marker} The created marker
 */
export function createTagMarker(google, map, place, onClick) {
  // Truncate long names
  const short = place.name.length > 16 ? place.name.slice(0, 15) + '…' : place.name;
  const textWidth = short.length * 6 + 20; // Approximate width

  // Create SVG tag icon
  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${textWidth}" height="30" viewBox="0 0 ${textWidth} 30">
      <rect x="2" y="2" width="${textWidth - 4}" height="26" rx="13" fill="#F59E0B" stroke="white" stroke-width="2"/>
      <text x="14" y="20" fill="white" font-size="11" font-weight="600" font-family="Inter, system-ui, sans-serif">📍${short}</text>
    </svg>
  `.trim();

  const icon = {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svgIcon),
    scaledSize: new google.maps.Size(textWidth, 30),
    anchor: new google.maps.Point(textWidth / 2, 15)
  };

  const marker = new google.maps.Marker({
    position: { lat: place.lat, lng: place.lng },
    map: map,
    icon: icon,
    title: place.name,
    optimized: false
  });

  // Add click listener
  marker.addListener('click', () => onClick(place));

  return marker;
}

/**
 * Create a marker for a place based on its type
 * Automatically chooses between circle marker or tag marker
 *
 * @param {google.maps} google - Google Maps API instance
 * @param {google.maps.Map} map - Map instance
 * @param {Object} place - Place object with type, id, name, lat, lng
 * @param {Function} onClick - Click handler function
 * @returns {google.maps.Marker} The created marker
 */
export function createMarkerForPlace(google, map, place, onClick) {
  if (place.type === 'sight') {
    return createTagMarker(google, map, place, onClick);
  }
  return createCircleMarker(google, map, place, onClick);
}

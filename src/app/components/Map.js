import { useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const Map = ({ properties, activeLocation, onMarkerClick, darkMode, userLocation, centerOnUserLocation }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const tileLayerRef = useRef(null);
  const userMarkerRef = useRef(null);
  const hasUserSearched = useRef(false);

  const bhutanBounds = L.latLngBounds(
    L.latLng(26.7, 88.7), // SW corner
    L.latLng(28.3, 92.1)  // NE corner
  );
  const thimphu = [27.4728, 89.6390];
  const phuentsholing = useMemo(() => [26.8516, 89.3883], []);
  const defaultZoom = 12;
  const userLocationZoom = 14;

  // Track search state
  useEffect(() => {
    if (activeLocation && (!userLocation || activeLocation[0] !== userLocation[0] || activeLocation[1] !== userLocation[1])) {
      hasUserSearched.current = true;
    }
  }, [activeLocation, userLocation]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    mapInstanceRef.current = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
      maxBounds: bhutanBounds,
      maxBoundsViscosity: 1.0,
      center: thimphu,
      zoom: defaultZoom,
    });

    tileLayerRef.current = L.tileLayer(
      darkMode
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        minZoom: 7,
        maxZoom: 15,
      }
    ).addTo(mapInstanceRef.current);

    L.control.zoom({ position: 'topright' }).addTo(mapInstanceRef.current);

    L.rectangle(bhutanBounds, {
      color: darkMode ? '#10B981' : '#065F46',
      weight: 2,
      fillOpacity: 0,
      dashArray: '5, 5',
    }).addTo(mapInstanceRef.current);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [darkMode]);

  // Center map on userLocation on initial load
  useEffect(() => {
    if (
      mapInstanceRef.current &&
      userLocation &&
      Array.isArray(userLocation) &&
      userLocation.length === 2 &&
      !hasUserSearched.current
    ) {
      mapInstanceRef.current.setView(userLocation, userLocationZoom);
      console.log('Initial Map View: Centered on userLocation', { userLocation, zoom: userLocationZoom });
    }
  }, [userLocation, userLocationZoom, hasUserSearched]);

  // Update map center when activeLocation or centerOnUserLocation changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (
      centerOnUserLocation &&
      userLocation &&
      Array.isArray(userLocation) &&
      userLocation.length === 2
    ) {
      mapInstanceRef.current.setView(userLocation, userLocationZoom);
      console.log('Map View Updated: Centered on userLocation due to centerOnUserLocation', { userLocation, zoom: userLocationZoom });
    } else if (
      activeLocation &&
      Array.isArray(activeLocation) &&
      activeLocation.length === 2
    ) {
      mapInstanceRef.current.setView(activeLocation, defaultZoom);
      console.log('Map View Updated: Centered on activeLocation', { activeLocation, zoom: defaultZoom });
    } else if (hasUserSearched.current) {
      mapInstanceRef.current.setView(phuentsholing, defaultZoom);
      console.log('Map View Updated: Fallback to Phuentsholing', { center: phuentsholing, zoom: defaultZoom });
    }
  }, [activeLocation, userLocation, centerOnUserLocation, userLocationZoom, defaultZoom, phuentsholing, hasUserSearched]);

  // Add or update user location marker
  useEffect(() => {
    if (!mapInstanceRef.current) {
      console.warn('Map not initialized for user marker');
      return;
    }

    console.log('User Location Prop:', { userLocation });

    if (
      !userLocation ||
      !Array.isArray(userLocation) ||
      userLocation.length !== 2 ||
      !isFinite(userLocation[0]) ||
      !isFinite(userLocation[1])
    ) {
      console.warn('Invalid userLocation, skipping marker:', { userLocation });
      return;
    }

    // Create a custom blue marker icon with pulsing effect
    const blueIcon = L.divIcon({
      className: 'custom-blue-marker',
      html: `
        <div style="
          position: relative;
          width: 30px;
          height: 30px;
        ">
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 20px;
            height: 20px;
            background-color: #3B82F6;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 0 10px rgba(0,0,0,0.3);
            animation: pulse 2s infinite;
          "></div>
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 8px;
            height: 8px;
            background-color: white;
            border-radius: 50%;
          "></div>
        </div>
        <style>
          @keyframes pulse {
            0% {
              transform: translate(-50%, -50%) scale(1);
              opacity: 1;
            }
            50% {
              transform: translate(-50%, -50%) scale(1.2);
              opacity: 0.8;
            }
            100% {
              transform: translate(-50%, -50%) scale(1);
              opacity: 1;
            }
          }
        </style>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });

    // Remove existing user marker if it exists
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
    }

    // Create new user marker
    userMarkerRef.current = L.marker(userLocation, {
      icon: blueIcon,
      zIndexOffset: 2000,
    })
      .addTo(mapInstanceRef.current)
      .bindPopup('Your Location')
      .openPopup();

    // Add a circle around the marker for better visibility
    const accuracyCircle = L.circle(userLocation, {
      radius: 50,
      color: '#3B82F6',
      fillColor: '#3B82F6',
      fillOpacity: 0.1,
      weight: 1,
    }).addTo(mapInstanceRef.current);

    console.log('User Marker Added:', { userLocation });

    // Cleanup function
    return () => {
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
      }
      if (accuracyCircle) {
        accuracyCircle.remove();
      }
    };
  }, [userLocation]);

  // Update markers when properties change
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Remove only property markers, not the user marker
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    const greenIcon = new L.Icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    if (properties && Array.isArray(properties)) {
      properties.forEach(property => {
        if (
          property.coordinates &&
          Array.isArray(property.coordinates) &&
          property.coordinates.length === 2
        ) {
          const marker = L.marker(property.coordinates, { icon: greenIcon })
            .addTo(mapInstanceRef.current)
            .bindPopup(`
              <div class="text-sm font-semibold">${property.title}</div>
              <div class="text-emerald-600">Nu.${property.price.toLocaleString()}/mo</div>
            `);
          marker.on('click', () => onMarkerClick(property));
          markersRef.current.push(marker);
        }
      });
    }
  }, [properties, onMarkerClick]);

  useEffect(() => {
    if (mapRef.current) {
      const map = mapRef.current;
      map.setView(phuentsholing, defaultZoom);
      map.fitBounds(bhutanBounds);
    }
  }, [phuentsholing, defaultZoom, bhutanBounds, thimphu]);

  useEffect(() => {
    if (mapRef.current) {
      const map = mapRef.current;
      if (userLocation && userLocationZoom && hasUserSearched) {
        map.setView(userLocation, userLocationZoom);
      }
    }
  }, [userLocation, userLocationZoom, hasUserSearched]);

  useEffect(() => {
    if (mapRef.current) {
      const map = mapRef.current;
      if (activeLocation) {
        map.setView(activeLocation, userLocationZoom || defaultZoom);
      } else if (centerOnUserLocation && userLocation) {
        map.setView(userLocation, userLocationZoom || defaultZoom);
      } else if (!hasUserSearched) {
        map.setView(phuentsholing, defaultZoom);
      }
    }
  }, [activeLocation, userLocation, centerOnUserLocation, userLocationZoom, defaultZoom, phuentsholing, hasUserSearched]);

  return (
    <div
      ref={mapRef}
      id="map"
      style={{ height: '500px', width: '100%' }}
      className="rounded-b-lg"
    />
  );
};

export default Map;
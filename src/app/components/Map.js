import { useEffect, useRef } from 'react';
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
  }, [userLocation]);

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
      mapInstanceRef.current.setView(thimphu, defaultZoom);
      console.log('Map View Updated: Fallback to Thimphu', { center: thimphu, zoom: defaultZoom });
    }
  }, [activeLocation, userLocation, centerOnUserLocation]);

  // Update markers when properties change
  useEffect(() => {
    if (!mapInstanceRef.current) return;

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

    const blueIcon = new L.Icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
      // Fallback to default Leaflet icon if blue icon fails
      iconUrlFallback: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    });

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng(userLocation);
      console.log('User Marker Updated:', { userLocation });
    } else {
      userMarkerRef.current = L.marker(userLocation, {
        icon: blueIcon,
        zIndexOffset: 2000, // Increased to ensure visibility
      })
        .addTo(mapInstanceRef.current)
        .bindPopup('Your Location')
        .openPopup();
      console.log('User Marker Added:', { userLocation });
      // Verify marker in DOM
      const markerElement = document.querySelector(`img[src$='marker-icon-2x-blue.png'], img[src$='marker-icon.png']`);
      console.log('User Marker DOM Check:', { isPresent: !!markerElement, src: markerElement?.src });
    }
  }, [userLocation]);

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
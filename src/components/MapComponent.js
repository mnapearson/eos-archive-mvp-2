'use client';

import { useEffect, useState, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

// Define marker colors for different space types
const markerColors = {
  'off-space': '#FF6EC7', // neon pink
  bar: '#1F51FF', // neon blue
  club: '#9D00FF', // neon purple
  gallery: '#FFFF00', // neon yellow
  studio: '#39FF14', // neon green
  kino: '#FF073A', // neon red
  default: '#F8F8F8', // off-white
};

export default function MapComponent({
  eventId,
  spaces,
  address: fallbackAddress,
}) {
  const [mapData, setMapData] = useState([]);
  // activeTypes remains empty by default (meaning no filter: show all markers)
  const [activeTypes, setActiveTypes] = useState([]);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  // Fetch data based on eventId or spaces
  useEffect(() => {
    async function fetchData() {
      if (eventId) {
        const response = await fetch(`/api/events/${eventId}`);
        const data = await response.json();
        setMapData([data]); // Wrap single event in an array
      } else if (spaces) {
        const response = await fetch('/api/spaces');
        const data = await response.json();
        setMapData(data);
      }
    }
    fetchData();
  }, [eventId, spaces]);

  // Initialize the map once mapData is available
  useEffect(() => {
    if (mapData.length === 0 || !mapContainerRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/dark-v10',
      center: eventId
        ? [mapData[0].longitude, mapData[0].latitude]
        : [12.3731, 51.3397], // Default center (Leipzig)
      zoom: eventId ? 14 : 6,
    });

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    mapRef.current = map;

    return () => map.remove();
  }, [mapData, eventId]);

  // Helper: Clear all existing markers
  const clearMarkers = () => {
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];
  };

  // Add markers filtered by activeTypes.
  // If activeTypes is empty, all markers are shown.
  const addMarkers = () => {
    if (!mapRef.current) return;
    clearMarkers();
    const filteredData =
      activeTypes.length > 0
        ? mapData.filter((item) => {
            const typeKey = item.type ? item.type.toLowerCase() : 'default';
            return activeTypes.includes(typeKey);
          })
        : mapData;

    filteredData.forEach((item) => {
      const markerEl = document.createElement('div');
      markerEl.style.width = '15px';
      markerEl.style.height = '15px';
      markerEl.style.borderRadius = '50%';
      const typeKey = item.type ? item.type.toLowerCase() : 'default';
      markerEl.style.backgroundColor =
        markerColors[typeKey] || markerColors.default;

      const popupTitle = (item.name || item.space || 'UNKNOWN').toUpperCase();
      const popupAddress = item.address || fallbackAddress || '';

      const popupContent = `
        <div style="color:#000; font-size:12px; line-height:1.4;">
          <strong>${popupTitle}</strong>
          ${
            popupAddress
              ? `<br/><a href="#" class="copy-address" data-address="${popupAddress}" style="text-decoration:underline; color:inherit;">${popupAddress}</a>`
              : ''
          }
        </div>
      `;

      const marker = new mapboxgl.Marker({ element: markerEl })
        .setLngLat([item.longitude, item.latitude])
        .setPopup(new mapboxgl.Popup().setHTML(popupContent))
        .addTo(mapRef.current);
      markersRef.current.push(marker);
    });
  };

  // Update markers when mapData or activeTypes changes
  useEffect(() => {
    if (mapData.length > 0 && mapRef.current) {
      addMarkers();
    }
  }, [mapData, activeTypes, eventId, fallbackAddress]);

  // Global event listener to enable copying the address from the popup
  useEffect(() => {
    function handleCopy(e) {
      if (e.target.classList.contains('copy-address')) {
        e.preventDefault();
        const text = e.target.getAttribute('data-address');
        navigator.clipboard
          .writeText(text)
          .then(() => {
            e.target.textContent = 'Copied!';
            setTimeout(() => {
              e.target.textContent = text;
            }, 2000);
          })
          .catch((err) => console.error('Copy failed:', err));
      }
    }
    document.addEventListener('click', handleCopy);
    return () => document.removeEventListener('click', handleCopy);
  }, []);

  // Compute unique types for the legend (include default for null values)
  const uniqueTypes = Array.from(
    new Set(
      mapData.map((item) => (item.type ? item.type.toLowerCase() : 'default'))
    )
  );

  // Toggle a type in the activeTypes filter.
  // Default behavior: If activeTypes is empty, all markers are shown.
  // When user clicks a legend item, that type is toggled in activeTypes.
  const toggleType = (type) => {
    setActiveTypes((prev) => {
      if (prev.includes(type)) {
        // Remove type from filter
        return prev.filter((t) => t !== type);
      } else {
        // Add type to filter
        return [...prev, type];
      }
    });
  };

  return (
    <div className='relative w-full h-[400px]'>
      <div
        ref={mapContainerRef}
        className='w-full h-full'
      />
      {/* Legend Overlay: Positioned outside the map frame if desired */}
      <div className='absolute -top-12 left-4 bg-[var(--background)]/80 backdrop-blur-md p-2 rounded shadow z-10'>
        <div className='text-xs font-semibold mb-1'>Space Types</div>
        <div className='flex flex-wrap gap-2'>
          {uniqueTypes.map((type) => (
            <button
              key={type}
              onClick={() => toggleType(type)}
              className={`flex items-center gap-1 px-2 py-1 text-xs rounded ${
                activeTypes.length === 0 || activeTypes.includes(type)
                  ? 'border border-[var(--foreground)]'
                  : 'opacity-50'
              }`}>
              <span
                className='w-3 h-3 rounded-full'
                style={{
                  backgroundColor: markerColors[type] || markerColors.default,
                }}></span>
              <span>{type.toUpperCase()}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

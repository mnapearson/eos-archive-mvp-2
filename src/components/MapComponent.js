'use client';

import { useEffect, useState, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

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
  activeTypes,
}) {
  const [mapData, setMapData] = useState([]);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    async function fetchData() {
      if (eventId) {
        const response = await fetch(`/api/events/${eventId}`);
        const data = await response.json();
        setMapData([data]);
      } else if (spaces) {
        const response = await fetch('/api/spaces');
        const data = await response.json();
        setMapData(data);
      }
    }
    fetchData();
  }, [eventId, spaces]);

  useEffect(() => {
    if (mapData.length === 0 || !mapContainerRef.current) return;
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/dark-v10',
      center: eventId
        ? [mapData[0].longitude, mapData[0].latitude]
        : [12.3731, 51.3397],
      zoom: eventId ? 14 : 6,
    });

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    mapRef.current = map;
    return () => map.remove();
  }, [mapData, eventId]);

  const clearMarkers = () => {
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];
  };

  const addMarkers = () => {
    if (!mapRef.current) return;
    clearMarkers();
    const filteredData =
      activeTypes && activeTypes.length > 0
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
      // Use existing address or fallbackAddress if provided;
      // if neither is available, display "Loading address..."
      let initialAddress =
        item.address || fallbackAddress || 'Loading address...';

      const popupContent = `
      <div style="color:#000; font-size:12px; line-height:1.4;">
        <strong>${popupTitle}</strong>
        ${initialAddress ? `<br/>${initialAddress}` : ''}
      </div>
    `;

      const marker = new mapboxgl.Marker({ element: markerEl })
        .setLngLat([item.longitude, item.latitude])
        .setPopup(new mapboxgl.Popup().setHTML(popupContent))
        .addTo(mapRef.current);
      markersRef.current.push(marker);

      // If no address is provided in the item or fallback, perform reverse geocoding.
      if (!(item.address || fallbackAddress)) {
        fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${item.longitude},${item.latitude}.json?access_token=${mapboxgl.accessToken}`
        )
          .then((res) => res.json())
          .then((geoData) => {
            let address = 'UNKNOWN ADDRESS';
            if (geoData.features && geoData.features.length > 0) {
              address = geoData.features[0].place_name;
            }
            const newPopupContent = `
            <div style="color:#000; font-size:12px; line-height:1.4;">
              <strong>${popupTitle}</strong><br/>
              <a href="#" class="copy-address" data-address="${address}" style="text-decoration:underline; color:inherit;">${address}</a>
            </div>
          `;
            marker.getPopup().setHTML(newPopupContent);
          })
          .catch((err) => {
            console.error('Reverse geocoding error:', err);
          });
      }
    });
  };

  useEffect(() => {
    if (mapData.length > 0 && mapRef.current) {
      addMarkers();
    }
  }, [mapData, activeTypes, eventId, fallbackAddress]);

  // Global listener for copying address to clipboard from popup links
  useEffect(() => {
    function handleCopy(e) {
      if (e.target.classList.contains('copy-address')) {
        e.preventDefault();
        const text = e.target.getAttribute('data-address');
        navigator.clipboard
          .writeText(text)
          .then(() => {
            e.target.textContent = 'Address copied to clipboard.';
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

  return (
    <div className='w-full h-[400px]'>
      <div
        ref={mapContainerRef}
        className='w-full h-full'
      />
    </div>
  );
}

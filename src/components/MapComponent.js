'use client';

import { useEffect, useState, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import { space } from 'postcss/lib/list';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const markerColors = {
  'off-space': '#FF6EC7', // neon pink
  bar: '#1F51FF', // neon blue
  cafe: '#9D00FF', // neon purple
  gallery: '#FFFF00', // neon yellow
  studio: '#39FF14', // neon green
  kino: '#FF073A', // neon red
  club: '#F8F8F8', // off-white
  default: '#000000', // default black
};

export default function MapComponent({
  eventId,
  spaces,
  address: fallbackAddress,
  activeTypes,
  initialCenter,
  initialZoom,
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
        if ((!data.latitude || !data.longitude) && data.space) {
          if (data.space.latitude && data.space.longitude) {
            data.latitude = data.space.latitude;
            data.longitude = data.space.longitude;
            data.type = data.space.type;
            data.name = data.space.name;
          }
        }
        setMapData([data]);
      } else if (spaces && spaces.length > 0) {
        setMapData(spaces);
      } else {
        const response = await fetch('/api/spaces');
        const data = await response.json();
        setMapData(data);
      }
    }
    fetchData();
  }, [eventId, spaces]);

  useEffect(() => {
    if (mapData.length === 0 || !mapContainerRef.current) return;

    let centerLng, centerLat;
    if (eventId) {
      const eventData = mapData[0];
      centerLat = Number(eventData.latitude);
      centerLng = Number(eventData.longitude);
      if (isNaN(centerLat) || isNaN(centerLng)) {
        centerLat = 51.3397;
        centerLng = 12.3731;
      }
    } else if (initialCenter) {
      centerLat = initialCenter.lat;
      centerLng = initialCenter.lng;
    } else if (spaces && spaces.length > 0) {
      const firstSpace = spaces[0];
      centerLat = Number(firstSpace.latitude) || 51.3397;
      centerLng = Number(firstSpace.longitude) || 12.3731;
    } else {
      centerLat = 51.3397;
      centerLng = 12.3731;
    }

    // Determine the zoom level based on props and context.
    // If an initialZoom is passed in, use that.
    // Otherwise, if this is an event detail, use 14, or a default for spaces like 12.
    const finalZoom =
      typeof initialZoom === 'number' ? initialZoom : eventId ? 14 : 12; // change 12 to whatever default you prefer for spaces

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/dark-v10',
      center: [centerLng, centerLat],
      zoom: finalZoom,
    });

    // Add navigation controls.
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add Mapbox Geocoder control at the top-left.
    const geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl: mapboxgl,
      marker: false, // we already add markers manually
    });
    map.addControl(geocoder, 'top-left');

    mapRef.current = map;
    return () => map.remove();
  }, [mapData, eventId, initialCenter, initialZoom, spaces]);

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
            const typeKey = item.type
              ? item.type.toLowerCase()
              : item.space && item.space.type
              ? item.space.type.toLowerCase()
              : 'default';
            return activeTypes.includes(typeKey);
          })
        : mapData;

    filteredData.forEach((item) => {
      const markerEl = document.createElement('div');
      markerEl.style.width = '12px';
      markerEl.style.height = '12px';
      markerEl.style.borderRadius = '50%';
      const typeKey = item.type
        ? item.type.toLowerCase()
        : item.space && item.space.type
        ? item.space.type.toLowerCase()
        : 'default';
      markerEl.style.backgroundColor =
        markerColors[typeKey] || markerColors.default;

      const spaceId = (item.space && item.space.id) || item.id;
      const popupTitle = (
        item.name ||
        (item.space && item.space.name) ||
        'UNKNOWN'
      ).toUpperCase();

      const popupTitleHtml = spaceId
        ? `<a href="/spaces/${spaceId}" target="_blank" style="text-decoration:underline; color:inherit;">${popupTitle}</a>`
        : popupTitle;

      let initialAddress = item.address || fallbackAddress;
      if (!initialAddress) {
        initialAddress = 'Loading address...';
      }

      const popupContent = `
        <div style="color:#000; font-size:12px; line-height:1.4;">
          <strong>${popupTitleHtml}</strong>
          ${
            initialAddress && initialAddress !== 'Loading address...'
              ? `<br/><a href="#" class="copy-address" data-address="${initialAddress}" style="text-decoration:underline; color:inherit;">${initialAddress}</a>`
              : ''
          }
        </div>
      `;

      const lng = Number(item.longitude);
      const lat = Number(item.latitude);
      const markerLng = isNaN(lng) ? 12.3731 : lng;
      const markerLat = isNaN(lat) ? 51.3397 : lat;

      const marker = new mapboxgl.Marker({ element: markerEl })
        .setLngLat([markerLng, markerLat])
        .setPopup(new mapboxgl.Popup().setHTML(popupContent))
        .addTo(mapRef.current);
      markersRef.current.push(marker);

      if (!item.address && !fallbackAddress) {
        fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${markerLng},${markerLat}.json?access_token=${mapboxgl.accessToken}`
        )
          .then((res) => res.json())
          .then((geoData) => {
            let address = 'UNKNOWN ADDRESS';
            if (geoData.features && geoData.features.length > 0) {
              address = geoData.features[0].place_name;
            }
            const newPopupContent = `
              <div style="color:#000; font-size:12px; line-height:1.4;">
                <strong>${popupTitleHtml}</strong><br/>
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
    <div className='w-full h-full'>
      <div
        ref={mapContainerRef}
        className='w-full h-full'
      />
    </div>
  );
}

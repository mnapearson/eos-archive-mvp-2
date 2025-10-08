'use client';

import { useEffect, useState, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import markerColors from '@/lib/markerColors';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

function buildPopupHTML({
  spaceId,
  name,
  fullAddress,
  typeLabel,
  directionsAddress,
}) {
  const safeName = (name || 'UNKNOWN').toString().toUpperCase();
  const link = spaceId
    ? `<a href="/spaces/${spaceId}" style="text-decoration:underline; color:inherit;">${safeName}</a>`
    : safeName;
  const typeLine = typeLabel
    ? `<br/><em style="font-size:10px; color:#555;">${typeLabel}</em>`
    : '';
  const addr = fullAddress
    ? `<br/>
        <a href="#" class="copy-address" data-address="${fullAddress}" style="color:inherit;">
          ${fullAddress}
        </a>`
    : '';
  const directions =
    directionsAddress || fullAddress
      ? `<br/>
        <a href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
          directionsAddress || fullAddress
        )}" target="_blank" rel="noopener noreferrer" style="text-decoration:underline; color:inherit;">
          Directions
        </a>`
      : '';
  return `
    <div style="color:#000; font-size:12px; line-height:1.4;">
      <strong>${link}</strong>
      ${typeLine}
      ${addr}
      ${directions}
    </div>`;
}

export default function MapComponent({
  eventId,
  spaces,
  address: fallbackAddress,
  activeTypes,
  initialCenter,
  initialZoom,
  autoFit = false,
  fitKey,
  focusSpaceId,
  onMarkerSelect,
  showPopups = true,
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

    const finalZoom =
      typeof initialZoom === 'number' ? initialZoom : eventId ? 14 : 12;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/dark-v10',
      center: [centerLng, centerLat],
      zoom: finalZoom,
    });

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    mapRef.current = map;
    return () => map.remove();
  }, [mapData, eventId, initialCenter, initialZoom, spaces]);

  const updateMarkerFocusStyles = (currentFocusId) => {
    markersRef.current.forEach(({ element, id }) => {
      if (!element) return;
      const isActive =
        currentFocusId != null &&
        String(id) === String(currentFocusId);
      element.style.transform = isActive ? 'scale(1.6)' : 'scale(1)';
      element.style.boxShadow = isActive
        ? '0 0 0 6px rgba(255,255,255,0.32)'
        : '0 0 0 0 rgba(0,0,0,0)';
      element.style.opacity = isActive ? '1' : '0.9';
    });
  };

  const clearMarkers = () => {
    markersRef.current.forEach(({ marker, element, listeners }) => {
      if (element && Array.isArray(listeners)) {
        listeners.forEach(([event, handler]) => {
          element.removeEventListener(event, handler);
        });
      }
      marker.remove();
    });
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

    const bounds = new mapboxgl.LngLatBounds();
    let hasValidBounds = false;

    filteredData.forEach((item) => {
      const markerEl = document.createElement('div');
      markerEl.style.width = '12px';
      markerEl.style.height = '12px';
      markerEl.style.borderRadius = '50%';
      markerEl.style.transition =
        'transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease';
      markerEl.style.cursor = 'pointer';
      const typeKey = item.type
        ? item.type.toLowerCase()
        : item.space && item.space.type
        ? item.space.type.toLowerCase()
        : 'default';
      markerEl.style.backgroundColor =
        markerColors[typeKey] || markerColors.default;

      const spaceId = (item.space && item.space.id) || item.id;
      const spaceName = item.name || item.space?.name || 'UNKNOWN';
      const addrParts = [];
      if (item.address) addrParts.push(item.address);
      else if (item.space?.address) addrParts.push(item.space.address);
      if (item.city) addrParts.push(item.city);
      else if (item.space?.city) addrParts.push(item.space.city);
      const fullAddress = addrParts.join(', ');
      const popupContent = showPopups
        ? buildPopupHTML({
            spaceId,
            name: spaceName,
            fullAddress,
            typeLabel: typeKey,
            directionsAddress: fullAddress || fallbackAddress,
          })
        : null;

      const lng = Number(item.longitude);
      const lat = Number(item.latitude);
      const markerLng = isNaN(lng) ? 12.3731 : lng;
      const markerLat = isNaN(lat) ? 51.3397 : lat;

      const marker = new mapboxgl.Marker({ element: markerEl }).setLngLat([
        markerLng,
        markerLat,
      ]);
      if (showPopups && popupContent) {
        marker.setPopup(new mapboxgl.Popup().setHTML(popupContent));
      }
      marker.addTo(mapRef.current);

      const listeners = [];
      if (typeof onMarkerSelect === 'function') {
        const handleMarkerClick = (event) => {
          event.stopPropagation();
          onMarkerSelect(spaceId);
        };
        markerEl.addEventListener('click', handleMarkerClick);
        listeners.push(['click', handleMarkerClick]);
      }

      markersRef.current.push({ marker, id: spaceId, element: markerEl, listeners });

      if (!Number.isNaN(markerLng) && !Number.isNaN(markerLat)) {
        bounds.extend([markerLng, markerLat]);
        hasValidBounds = true;
      }

      if (showPopups && !item.address && !fallbackAddress) {
        fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${markerLng},${markerLat}.json?access_token=${mapboxgl.accessToken}`
        )
          .then((res) => res.json())
          .then((geoData) => {
            let address = 'UNKNOWN ADDRESS';
            if (geoData.features && geoData.features.length > 0) {
              address = geoData.features[0].place_name;
            }
            const newFullAddress = address;
            const newPopupContent = buildPopupHTML({
              spaceId,
              name: spaceName,
              fullAddress: newFullAddress,
              typeLabel: typeKey,
              directionsAddress: newFullAddress || fallbackAddress,
            });
            marker.getPopup().setHTML(newPopupContent);
          })
          .catch((err) => {
            console.error('Reverse geocoding error:', err);
          });
      }
    });

    updateMarkerFocusStyles(focusSpaceId);

    if (autoFit && hasValidBounds) {
      try {
        const padding = typeof window !== 'undefined' && window.innerWidth < 640 ? 60 : 120;
        mapRef.current.fitBounds(bounds, {
          padding,
          maxZoom: 14,
          duration: 800,
        });
      } catch (err) {
        console.warn('Map fitBounds failed:', err);
      }
    }
  };

  useEffect(() => {
    if (mapData.length > 0 && mapRef.current) {
      addMarkers();
    }
  }, [mapData, activeTypes, eventId, fallbackAddress, autoFit, fitKey, onMarkerSelect, showPopups]);

  useEffect(() => {
    if (!autoFit || !mapRef.current) return;
    const resizeHandler = () => {
      addMarkers();
    };
    window.addEventListener('resize', resizeHandler);
    return () => window.removeEventListener('resize', resizeHandler);
  }, [autoFit, mapData, activeTypes, fallbackAddress, fitKey, showPopups]);

  useEffect(() => {
    if (!mapRef.current) return;
    if (!focusSpaceId) {
      updateMarkerFocusStyles(null);
      return;
    }
    const entry = markersRef.current.find(
      (item) => String(item.id) === String(focusSpaceId)
    );
    if (!entry) {
      updateMarkerFocusStyles(null);
      return;
    }
    const coords = entry.marker.getLngLat();
    mapRef.current.flyTo({
      center: coords,
      zoom: Math.max(mapRef.current.getZoom(), 13),
      essential: true,
    });
    if (showPopups) {
      const popup = entry.marker.getPopup();
      if (popup && !popup.isOpen()) {
        popup.addTo(mapRef.current);
      }
    }
    updateMarkerFocusStyles(focusSpaceId);
  }, [focusSpaceId, showPopups]);

  useEffect(() => {
    function handleCopy(e) {
      if (e?.target?.classList?.contains?.('copy-address')) {
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

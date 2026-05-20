'use client';

import { useEffect, useState, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import markerColors from '@/lib/markerColors';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const DEFAULT_FIT_PADDING = {
  mobile: { top: 72, right: 44, bottom: 200, left: 44 },
  desktop: { top: 140, right: 240, bottom: 320, left: 240 },
};

const DEFAULT_FOCUS_PADDING = {
  mobile: { top: 64, right: 56, bottom: 320, left: 56 },
  desktop: { top: 120, right: 240, bottom: 320, left: 240 },
};

const DEFAULT_MAX_AUTO_FIT_ZOOM = 14;

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

function getViewportPadding(customPadding, defaults) {
  const clampMobilePadding = (value) => {
    if (typeof window === 'undefined') return value;
    if (!value || typeof value !== 'object') return value;
    const viewportHeight = window.innerHeight || 0;
    if (viewportHeight <= 0) return value;
    const maxBottom = Math.max(
      140,
      Math.min(
        defaults.mobile?.bottom ?? 200,
        Math.round(viewportHeight * 0.45)
      )
    );
    return {
      ...value,
      bottom:
        typeof value.bottom === 'number'
          ? Math.min(value.bottom, maxBottom)
          : maxBottom,
    };
  };

  if (typeof window === 'undefined') {
    if (customPadding == null) return defaults.desktop;
    if (typeof customPadding === 'number') return customPadding;
    return customPadding.desktop ?? customPadding.mobile ?? defaults.desktop;
  }

  const isMobile = window.innerWidth < 768;
  let resolvedPadding;

  if (typeof customPadding === 'number') {
    resolvedPadding = customPadding;
  } else if (customPadding && typeof customPadding === 'object') {
    if (isMobile) {
      resolvedPadding =
        customPadding.mobile ?? customPadding.desktop ?? defaults.mobile;
    } else {
      resolvedPadding =
        customPadding.desktop ?? customPadding.mobile ?? defaults.desktop;
    }
  } else {
    resolvedPadding = isMobile ? defaults.mobile : defaults.desktop;
  }

  if (!isMobile || typeof resolvedPadding !== 'object') {
    return resolvedPadding;
  }

  return clampMobilePadding(resolvedPadding);
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
  fallbackToAllSpaces = true,
  fitPadding,
  maxAutoFitZoom = DEFAULT_MAX_AUTO_FIT_ZOOM,
  minAutoFitZoom = null,
  initialAutoFitZoomOffset = 0,
  focusPadding,
}) {
  const [mapData, setMapData] = useState([]);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const focusMarkerRef = useRef(null);
  const initialAutoFitOffsetAppliedRef = useRef(false);

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
      } else if (fallbackToAllSpaces) {
        const response = await fetch('/api/spaces');
        const data = await response.json();
        setMapData(data);
      } else {
        setMapData([]);
      }
    }
    fetchData();
  }, [eventId, spaces, fallbackToAllSpaces]);

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
      style: 'mapbox://styles/mapbox/light-v11',
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
      const isActive = currentFocusId != null && String(id) === String(currentFocusId);
      element.style.transform = isActive ? 'scale(1.35)' : 'scale(1)';
      element.style.boxShadow = isActive
        ? '0 4px 20px rgba(0,0,0,0.22), 0 0 0 3px rgba(255,255,255,0.9)'
        : '0 2px 10px rgba(0,0,0,0.18)';
      element.style.zIndex = isActive ? '6' : '2';
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
    if (focusMarkerRef.current) {
      focusMarkerRef.current.remove();
      focusMarkerRef.current = null;
    }
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

    filteredData.forEach((item, markerIndex) => {
      const typeKey = item.type
        ? item.type.toLowerCase()
        : item.space && item.space.type
        ? item.space.type.toLowerCase()
        : 'other';
      const markerColor = markerColors[typeKey] || markerColors.other || '#888';

      const markerEl = document.createElement('div');
      markerEl.style.width = '28px';
      markerEl.style.height = '28px';
      markerEl.style.borderRadius = '50%';
      markerEl.style.display = 'flex';
      markerEl.style.alignItems = 'center';
      markerEl.style.justifyContent = 'center';
      markerEl.style.backgroundColor = markerColor;
      markerEl.style.border = '2px solid rgba(255,255,255,0.9)';
      markerEl.style.boxShadow = '0 2px 10px rgba(0,0,0,0.18)';
      markerEl.style.boxSizing = 'border-box';
      markerEl.style.cursor = 'pointer';
      markerEl.style.pointerEvents = 'auto';
      markerEl.style.transition = 'transform 0.18s ease, box-shadow 0.18s ease';
      markerEl.style.zIndex = '2';

      const numEl = document.createElement('span');
      numEl.textContent = String(markerIndex + 1);
      numEl.style.color = '#fff';
      numEl.style.fontSize = '11px';
      numEl.style.fontWeight = '700';
      numEl.style.lineHeight = '1';
      numEl.style.userSelect = 'none';
      numEl.style.pointerEvents = 'none';
      markerEl.appendChild(numEl);

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

      const marker = new mapboxgl.Marker({
        element: markerEl,
        anchor: 'center',
      }).setLngLat([
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

      markersRef.current.push({
        marker,
        id: spaceId,
        element: markerEl,
        listeners,
        color: markerColor,
      });

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
    updateFocusMarker(focusSpaceId);

    if (autoFit && hasValidBounds) {
      try {
        const padding = getViewportPadding(fitPadding, DEFAULT_FIT_PADDING);
        const map = mapRef.current;

        const camera = map.cameraForBounds(bounds, {
          padding,
          maxZoom: maxAutoFitZoom,
        });

        const wouldZoomOutTooFar =
          minAutoFitZoom != null &&
          camera &&
          typeof camera.zoom === 'number' &&
          camera.zoom < minAutoFitZoom;

        if (wouldZoomOutTooFar) {
          map.easeTo({
            center: initialCenter
              ? [initialCenter.lng, initialCenter.lat]
              : camera.center,
            zoom: typeof initialZoom === 'number' ? initialZoom : minAutoFitZoom,
            duration: 800,
            essential: true,
          });
        } else {
          const shouldApplyInitialOffset =
            typeof initialAutoFitZoomOffset === 'number' &&
            initialAutoFitZoomOffset !== 0 &&
            !initialAutoFitOffsetAppliedRef.current;

          if (shouldApplyInitialOffset && camera && typeof camera.zoom === 'number') {
            initialAutoFitOffsetAppliedRef.current = true;
            const targetZoom = Math.min(
              map.getMaxZoom(),
              Math.max(map.getMinZoom(), camera.zoom + initialAutoFitZoomOffset)
            );
            map.easeTo({ ...camera, zoom: targetZoom, duration: 800, essential: true });
          } else {
            map.fitBounds(bounds, {
              padding,
              maxZoom: maxAutoFitZoom,
              duration: 800,
            });
          }
        }
      } catch (err) {
        console.warn('Map fitBounds failed:', err);
      }
    }
  };

  const updateFocusMarker = (currentFocusId) => {
    if (focusMarkerRef.current) {
      focusMarkerRef.current.remove();
      focusMarkerRef.current = null;
    }
    if (!currentFocusId || !mapRef.current) return;
    const entry = markersRef.current.find(
      (item) => String(item.id) === String(currentFocusId)
    );
    if (!entry) return;
    const coords = entry.marker.getLngLat();
    const highlightEl = document.createElement('div');
    highlightEl.style.width = '44px';
    highlightEl.style.height = '44px';
    highlightEl.style.borderRadius = '50%';
    highlightEl.style.background = 'transparent';
    highlightEl.style.boxShadow = '0 0 0 3px rgba(0,0,0,0.12), 0 6px 24px rgba(0,0,0,0.14)';
    highlightEl.style.border = '2px solid rgba(255,255,255,0.8)';
    highlightEl.style.pointerEvents = 'none';
    focusMarkerRef.current = new mapboxgl.Marker({
      element: highlightEl,
      anchor: 'center',
    })
      .setLngLat(coords)
      .addTo(mapRef.current);
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
      updateFocusMarker(null);
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
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth < 768;
      const padding = isMobile
        ? { top: 64, right: 56, bottom: 320, left: 56 }
        : { top: 120, right: 240, bottom: 320, left: 240 };
      mapRef.current.easeTo({
        center: coords,
        zoom: Math.max(mapRef.current.getZoom(), 13.5),
        padding,
        duration: 700,
        essential: true,
      });
    } else {
      mapRef.current.flyTo({
        center: coords,
        zoom: Math.max(mapRef.current.getZoom(), 13),
        essential: true,
      });
    }
    if (showPopups) {
      const popup = entry.marker.getPopup();
      if (popup && !popup.isOpen()) {
        popup.addTo(mapRef.current);
      }
    }
    updateMarkerFocusStyles(focusSpaceId);
    updateFocusMarker(focusSpaceId);
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

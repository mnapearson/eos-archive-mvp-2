'use client';

import { useEffect, useState, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import markerColors from '@/lib/markerColors';
import { getMarkerState } from '@/lib/markerState';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const ZOOM_ICON_PLUS =
  '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';
const ZOOM_ICON_MINUS =
  '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>';

// Custom Mapbox GL IControl — replaces the browser-default NavigationControl
// with buttons styled/positioned to match eos-archive-app's Map tab
// zoomControls (rounded card, divider between + and -).
class ZoomControl {
  onAdd(map) {
    this._map = map;
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.background = 'var(--card)';
    container.style.border = '1px solid var(--card-border)';
    container.style.borderRadius = '8px';
    container.style.overflow = 'hidden';
    container.style.boxShadow = '0 4px 16px rgba(0,0,0,0.25)';

    const makeButton = (icon, label, onClick) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-label', label);
      button.innerHTML = icon;
      button.style.width = '40px';
      button.style.height = '40px';
      button.style.display = 'flex';
      button.style.alignItems = 'center';
      button.style.justifyContent = 'center';
      button.style.background = 'transparent';
      button.style.border = 'none';
      button.style.color = 'var(--foreground)';
      button.style.cursor = 'pointer';
      button.addEventListener('click', onClick);
      return button;
    };

    const zoomInBtn = makeButton(ZOOM_ICON_PLUS, 'Zoom in', () => map.zoomIn());
    const divider = document.createElement('div');
    divider.style.height = '1px';
    divider.style.background = 'var(--card-border)';
    const zoomOutBtn = makeButton(ZOOM_ICON_MINUS, 'Zoom out', () => map.zoomOut());

    container.appendChild(zoomInBtn);
    container.appendChild(divider);
    container.appendChild(zoomOutBtn);

    this._container = container;
    return container;
  }

  onRemove() {
    this._container.parentNode?.removeChild(this._container);
    this._map = undefined;
  }
}

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

// Spaces synced via Airtable only populate lat/lng and city_name; older
// "registered" spaces only populate latitude/longitude and city. Normalize
// once here so the rest of this component can keep reading
// latitude/longitude/city without every call site needing its own fallback.
function normalizeSpaceLocation(item) {
  if (!item) return item;
  const normalized = {
    ...item,
    latitude: item.latitude ?? item.lat,
    longitude: item.longitude ?? item.lng,
    city: item.city ?? item.city_name,
  };
  if (item.space) {
    normalized.space = {
      ...item.space,
      latitude: item.space.latitude ?? item.space.lat,
      longitude: item.space.longitude ?? item.space.lng,
      city: item.space.city ?? item.space.city_name,
    };
  }
  return normalized;
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
  eventMap = {},
  initialCenter,
  initialZoom,
  mapStyle = 'mapbox://styles/mapbox/dark-v11',
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
  // Imperative camera move independent of the spaces/autoFit pipeline —
  // { bounds: [[minLng,minLat],[maxLng,maxLat]] } or { center: [lng,lat], zoom }.
  // Used by the Map tab's city pills, which move the camera to a city
  // regardless of which category/event filters are currently narrowing
  // the visible markers.
  cameraTarget = null,
}) {
  const [mapData, setMapData] = useState([]);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const focusMarkerRef = useRef(null);
  const initialAutoFitOffsetAppliedRef = useRef(false);
  const lastFitKeyRef = useRef(null);

  useEffect(() => {
    async function fetchData() {
      if (eventId) {
        const response = await fetch(`/api/events/${eventId}`);
        const rawData = await response.json();
        const data = normalizeSpaceLocation(rawData);
        if ((!data.latitude || !data.longitude) && data.space) {
          if (data.space.latitude && data.space.longitude) {
            data.latitude = data.space.latitude;
            data.longitude = data.space.longitude;
            data.type = data.space.type;
            data.name = data.space.name;
            data.city = data.city ?? data.space.city;
          }
        }
        setMapData([data]);
      } else if (spaces && spaces.length > 0) {
        setMapData(spaces.map(normalizeSpaceLocation));
      } else if (fallbackToAllSpaces) {
        const response = await fetch('/api/spaces');
        const data = await response.json();
        setMapData(data.map(normalizeSpaceLocation));
      } else {
        setMapData([]);
      }
    }
    fetchData();
  }, [eventId, spaces, fallbackToAllSpaces]);

  // Creates the map exactly once per mount (or when mapStyle genuinely
  // changes). Previously this also depended on `mapData`, which meant the
  // whole Mapbox instance was torn down and recreated on every filter/search
  // change — silently undoing any flyTo/fitBounds call (e.g. from a city
  // pill) that had just run moments earlier in the same tick.
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const centerLat = initialCenter ? initialCenter.lat : 51.3397;
    const centerLng = initialCenter ? initialCenter.lng : 12.3731;
    const finalZoom =
      typeof initialZoom === 'number' ? initialZoom : eventId ? 14 : 12;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: mapStyle,
      center: [centerLng, centerLat],
      zoom: finalZoom,
    });

    map.addControl(new ZoomControl(), 'bottom-right');

    mapRef.current = map;
    return () => {
      clearMarkers();
      map.remove();
      mapRef.current = null;
    };
  }, [mapStyle]);

  // For callers that don't pass initialCenter (event/space detail embeds),
  // center on the data once it first arrives — without recreating the map.
  const didInitialCenterRef = useRef(false);
  useEffect(() => {
    if (initialCenter || didInitialCenterRef.current) return;
    if (!mapRef.current || mapData.length === 0) return;

    let centerLng, centerLat;
    if (eventId) {
      const eventData = mapData[0];
      centerLat = Number(eventData.latitude);
      centerLng = Number(eventData.longitude);
      if (isNaN(centerLat) || isNaN(centerLng)) return;
    } else if (spaces && spaces.length > 0) {
      const firstSpace = mapData[0];
      centerLat = Number(firstSpace.latitude);
      centerLng = Number(firstSpace.longitude);
      if (isNaN(centerLat) || isNaN(centerLng)) return;
    } else {
      return;
    }

    didInitialCenterRef.current = true;
    const finalZoom =
      typeof initialZoom === 'number' ? initialZoom : eventId ? 14 : 12;
    mapRef.current.jumpTo({ center: [centerLng, centerLat], zoom: finalZoom });
  }, [mapData, eventId, spaces, initialCenter, initialZoom]);

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
    markersRef.current.forEach(({ marker, element, listeners, underlayMarker }) => {
      if (element && Array.isArray(listeners)) {
        listeners.forEach(([event, handler]) => {
          element.removeEventListener(event, handler);
        });
      }
      marker.remove();
      underlayMarker?.remove();
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
            const typeKey = (
              item.category ||
              item.type ||
              (item.space && (item.space.category || item.space.type)) ||
              'other'
            ).toLowerCase();
            return activeTypes.includes(typeKey);
          })
        : mapData;

    const bounds = new mapboxgl.LngLatBounds();
    let hasValidBounds = false;

    filteredData.forEach((item) => {
      // Number(null) is 0, not NaN — without this explicit check, a space
      // with no coordinates at all would silently plot at [0, 0] (Null
      // Island) instead of being skipped.
      const hasCoords =
        item.latitude != null &&
        item.longitude != null &&
        !Number.isNaN(Number(item.latitude)) &&
        !Number.isNaN(Number(item.longitude));
      if (!hasCoords) return;

      const typeKey = (
        item.category ||
        item.type ||
        (item.space && (item.space.category || item.space.type)) ||
        'other'
      ).toLowerCase();
      const markerColor = markerColors[typeKey] || markerColors.other || '#888';

      const spaceId = (item.space && item.space.id) || item.id;
      const eventState = getMarkerState(spaceId, eventMap);

      const markerEl = document.createElement('div');
      markerEl.style.width = '16px';
      markerEl.style.height = '16px';
      markerEl.style.borderRadius = '50%';
      markerEl.style.backgroundColor = markerColor;
      markerEl.style.border = '2.5px solid rgba(255,255,255,0.95)';
      markerEl.style.boxSizing = 'border-box';
      markerEl.style.boxShadow = '0 2px 8px rgba(0,0,0,0.22)';
      markerEl.style.cursor = 'pointer';
      markerEl.style.pointerEvents = 'auto';
      markerEl.style.transition = 'transform 0.15s ease, box-shadow 0.15s ease';
      markerEl.style.zIndex = '2';

      // Event-state underlay — pulses for an event today/tomorrow ('live'),
      // a static ring for one further out but within 7 days ('soon'), or
      // nothing for 'default'. Mirrors eos-archive-app's MarkerDot.tsx.
      let underlayEl = null;
      if (eventState === 'live') {
        underlayEl = document.createElement('div');
        underlayEl.style.width = '16px';
        underlayEl.style.height = '16px';
        underlayEl.style.borderRadius = '50%';
        underlayEl.style.backgroundColor = markerColor;
        underlayEl.style.pointerEvents = 'none';
        underlayEl.style.zIndex = '1';
        underlayEl.style.animation = 'marker-pulse 1400ms ease-out infinite';
      } else if (eventState === 'soon') {
        underlayEl = document.createElement('div');
        underlayEl.style.width = '30px';
        underlayEl.style.height = '30px';
        underlayEl.style.borderRadius = '50%';
        underlayEl.style.border = '1.5px solid var(--silver)';
        underlayEl.style.backgroundColor = 'transparent';
        underlayEl.style.pointerEvents = 'none';
        underlayEl.style.zIndex = '1';
      }

      const spaceName = item.name || item.space?.name || 'UNKNOWN';
      const addrParts = [];
      if (item.address) addrParts.push(item.address);
      else if (item.space?.address) addrParts.push(item.space.address);
      if (item.city_name || item.city) addrParts.push(item.city_name ?? item.city);
      else if (item.space?.city_name || item.space?.city) addrParts.push(item.space.city_name ?? item.space.city);
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

      let underlayMarker = null;
      if (underlayEl) {
        underlayMarker = new mapboxgl.Marker({
          element: underlayEl,
          anchor: 'center',
        })
          .setLngLat([markerLng, markerLat])
          .addTo(mapRef.current);
      }

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
        underlayMarker,
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

    if (autoFit && hasValidBounds && fitKey !== lastFitKeyRef.current) {
      lastFitKeyRef.current = fitKey;
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
    highlightEl.style.width = '32px';
    highlightEl.style.height = '32px';
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
  }, [mapData, activeTypes, eventId, fallbackAddress, autoFit, fitKey, onMarkerSelect, showPopups, mapStyle, eventMap]);

  useEffect(() => {
    if (!autoFit || !mapRef.current) return;
    const resizeHandler = () => {
      addMarkers();
    };
    window.addEventListener('resize', resizeHandler);
    return () => window.removeEventListener('resize', resizeHandler);
  }, [autoFit, mapData, activeTypes, fallbackAddress, fitKey, showPopups]);

  useEffect(() => {
    if (!mapRef.current || !cameraTarget) return;
    const map = mapRef.current;
    if (cameraTarget.bounds) {
      map.fitBounds(cameraTarget.bounds, {
        padding: 80,
        maxZoom: 14,
        duration: 700,
      });
    } else if (cameraTarget.center) {
      map.flyTo({
        center: cameraTarget.center,
        zoom: cameraTarget.zoom ?? 11,
        duration: 700,
        essential: true,
      });
    }
  }, [cameraTarget]);

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

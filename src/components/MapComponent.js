'use client';

import { useEffect, useState, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import markerColors from '@/lib/markerColors';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function MapComponent({
  eventId,
  spaces,
  address: fallbackAddress,
  activeTypes,
  initialCenter,
  initialZoom,
}) {
  const [mapData, setMapData] = useState([]);
  const [selectedSpace, setSelectedSpace] = useState(null);
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

    const geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl: mapboxgl,
      marker: false,
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

      // compute full address for marker popups
      const addrParts = [];
      if (item.address) addrParts.push(item.address);
      else if (item.space?.address) addrParts.push(item.space.address);
      if (item.city) addrParts.push(item.city);
      else if (item.space?.city) addrParts.push(item.space.city);
      if (item.zipcode) addrParts.push(item.zipcode);
      else if (item.space?.zipcode) addrParts.push(item.space.zipcode);
      const fullAddress = addrParts.join(', ');

      const popupContent = `
        <div style="color:#000; font-size:12px; line-height:1.4;">
          <strong>
            <a href="/spaces/${spaceId}" target="_blank" style=" color:inherit;">
              ${popupTitle}
            </a>
          </strong>
          
          ${
            fullAddress
              ? `<br/>
            <a href="#" class="copy-address" data-address="${fullAddress}"
               style="color:inherit;">
              ${fullAddress}
            </a>
            <br/>
            <a href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
              fullAddress
            )}"
               target="_blank"
               style="text-decoration:underline; color:inherit;">
              Directions
            </a>
          `
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
      marker
        .getElement()
        .addEventListener('click', () => setSelectedSpace(item));
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
            // update fullAddress with new address from reverse geocoding
            const newFullAddress = address;
            const newPopupContent = `
              <div style="color:#000; font-size:12px; line-height:1.4;">
                <strong>${popupTitleHtml}</strong>
                <br/><em style="font-size:10px; color:#555;">${typeKey}</em>
                <br/>
                <a href="#" class="copy-address" data-address="${newFullAddress}" style=" color:inherit;">${newFullAddress}</a>
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

  // compute full address for selectedSpace bottom panel
  const selectedAddrParts = [];
  if (selectedSpace?.address) selectedAddrParts.push(selectedSpace.address);
  else if (selectedSpace?.space?.address)
    selectedAddrParts.push(selectedSpace.space.address);
  if (selectedSpace?.city) selectedAddrParts.push(selectedSpace.city);
  else if (selectedSpace?.space?.city)
    selectedAddrParts.push(selectedSpace.space.city);
  if (selectedSpace?.zipcode) selectedAddrParts.push(selectedSpace.zipcode);
  else if (selectedSpace?.space?.zipcode)
    selectedAddrParts.push(selectedSpace.space.zipcode);
  const selectedFullAddress = selectedAddrParts.join(', ');

  return (
    <div className='w-full h-full'>
      <div
        ref={mapContainerRef}
        className='w-full h-full'
      />
      {selectedSpace && (
        <div className='fixed bottom-0 left-0 right-0 bg-[var(--background)] border-t border-[var(--accent)] p-6 z-50 max-h-[40vh] overflow-auto'>
          <div className='container mx-auto flex flex-col md:flex-row gap-6 md:gap-12 items-start'>
            <div className='flex-shrink-0 w-full md:w-1/3'>
              <h3 className='font-bold text-xl mb-1'>
                <a
                  href={`/spaces/${
                    selectedSpace.space?.id || selectedSpace.id
                  }`}
                  className='hover:text-[var(--accent)]'>
                  {selectedSpace.name || selectedSpace.space?.name}
                </a>{' '}
              </h3>
              <p className='text-sm mb-2'>{selectedFullAddress}</p>
              {selectedSpace.eventCount > 0 && (
                <p className='text-sm mb-2'>
                  {selectedSpace.eventCount} event
                  {selectedSpace.eventCount > 1 ? 's' : ''}
                </p>
              )}
              {/* <p className='text-sm italic mb-1'>No events listed yet</p> */}
            </div>
            <div className='flex-grow w-full md:w-2/3'>
              {selectedSpace.description && (
                <p className='mb-4 text-sm text-[var(--text-secondary)] whitespace-pre-wrap'>
                  {selectedSpace.description}
                </p>
              )}
              <div className='flex flex-wrap gap-3'>
                {selectedSpace.website && (
                  <a
                    href={selectedSpace.website}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='button'>
                    Website
                  </a>
                )}
                <a
                  href={`/spaces/${
                    (selectedSpace.space && selectedSpace.space.id) ||
                    selectedSpace.id
                  }`}
                  className='button'>
                  Archive
                </a>
                <button
                  onClick={() => setSelectedSpace(null)}
                  className='ml-auto text-[var(--accent)] text-2xl font-bold leading-none p-0 border-none bg-transparent cursor-pointer'
                  aria-label='Close details panel'>
                  ×
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

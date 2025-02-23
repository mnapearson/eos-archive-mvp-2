'use client';

import { useEffect, useState, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

// Set Mapbox token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function MapComponent({ eventId, spaces }) {
  const [mapData, setMapData] = useState([]);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  // Fetch data based on eventId or spaces
  useEffect(() => {
    async function fetchData() {
      if (eventId) {
        // Fetch a single event
        const response = await fetch(`/api/events/${eventId}`);
        const data = await response.json();
        setMapData([data]); // Wrap single event in an array
      } else if (spaces) {
        // Fetch all spaces
        const response = await fetch('/api/spaces');
        const data = await response.json();
        setMapData(data);
      }
    }
    fetchData();
  }, [eventId, spaces]);

  // Initialize the map when mapData is available
  useEffect(() => {
    if (mapData.length === 0) return;

    // Initialize map with the container ref
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/dark-v10',
      center: eventId
        ? [mapData[0].longitude, mapData[0].latitude]
        : [12.3731, 51.3397], // Default center (Leipzig)
      zoom: eventId ? 14 : 6,
    });

    // Create a custom marker for each item
    mapData.forEach((item) => {
      const markerEl = document.createElement('div');
      markerEl.style.width = '15px';
      markerEl.style.height = '15px';
      markerEl.style.borderRadius = '50%';
      // Use off-white for dawn mode
      markerEl.style.backgroundColor = '#f5f1f0';

      const popupText = (item.name || item.space || '').toUpperCase();

      new mapboxgl.Marker({ element: markerEl })
        .setLngLat([item.longitude, item.latitude])
        .setPopup(new mapboxgl.Popup().setText(popupText))
        .addTo(map);
    });

    mapRef.current = map;
    return () => map.remove();
  }, [mapData, eventId]);

  return (
    // Container takes full width and a fixed height (adjust h-[400px] as needed)
    <div
      className='h-[400px] w-full'
      ref={mapContainerRef}
    />
  );
}

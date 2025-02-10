'use client';

import { useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';

// Set Mapbox token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function MapComponent({ eventId, spaces }) {
  const [mapData, setMapData] = useState([]);

  // Fetch data depending on whether eventId or spaces are passed
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

  useEffect(() => {
    if (mapData.length === 0) return;

    const map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/dark-v10',
      center: eventId
        ? [mapData[0].longitude, mapData[0].latitude]
        : [12.3731, 51.3397], // Default center Leipzig
      zoom: eventId ? 14 : 6,
    });

    mapData.forEach((item) => {
      new mapboxgl.Marker()
        .setLngLat([item.longitude, item.latitude])
        .setPopup(new mapboxgl.Popup().setText(item.name || item.space))
        .addTo(map);
    });

    return () => map.remove();
  }, [mapData]);

  return (
    <div className='w-full h-64'>
      <div
        id='map'
        className='w-full h-full'></div>
    </div>
  );
}

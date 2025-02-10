'use client';
import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with your credentials from .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Set your Mapbox access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function MapComponent() {
  const mapContainer = useRef(null); // Reference to the map container HTML element
  const map = useRef(null); // Store the map instance

  useEffect(() => {
    // Initialize the Mapbox map only once
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current, // HTML element to render the map in
      style: 'mapbox://styles/eosarchive/cm6y739q900ls01saf5urburu', // Map style
      center: [12.3731, 51.3397], // Center of the map (longitude, latitude) e.g., Leipzig
      zoom: 10, // Starting zoom level
    });

    // Function to fetch approved events from Supabase
    const fetchEvents = async () => {
      const { data: events, error } = await supabase
        .from('events')
        .select('*')
        .eq('approved', true); // Only select events where approved is true

      if (error) {
        console.error('Error fetching events:', error);
        return;
      }
      console.log('Fetched events:', events);

      // For each event, add a marker on the map
      events.forEach((event) => {
        if (event.latitude && event.longitude) {
          new mapboxgl.Marker()
            .setLngLat([event.longitude, event.latitude])
            .setPopup(
              new mapboxgl.Popup({ offset: 25 }).setHTML(
                `<h3>${event.title}</h3><p>${event.description}</p>`
              )
            )
            .addTo(map.current);
        }
      });
    };

    // Call the function to fetch events and add markers
    fetchEvents();
  }, []);

  // Return a div that will contain the Mapbox map
  return (
    <div
      ref={mapContainer}
      style={{ width: '100%', height: '500px' }}
    />
  );
}

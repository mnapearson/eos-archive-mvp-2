import EventList from '@/components/EventList';
import MapComponent from '@/components/MapComponent';

export default function Home() {
  return (
    <main style={{ padding: '1rem' }}>
      <h1>eos archive</h1>
      {/* Display the list of events */}
      <EventList />
      {/* Then display the map */}
      <MapComponent />
    </main>
  );
}

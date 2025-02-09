import EventList from '@/components/EventList';
import MapComponent from '@/components/MapComponent';

export default function Home() {
  return (
    <main style={{ padding: '1rem' }}>
      {/* Display the list of events */}
      <EventList />
    </main>
  );
}

// src/components/AdminDashboard.js
import React from 'react';
import RoadmapManager from './RoadmapManager';
import EventApprovals from './EventApprovals';

export default function AdminDashboard() {
  return (
    <div>
      <section style={{ marginBottom: '2rem' }}>
        <h2>Roadmap Management</h2>
        <RoadmapManager />
      </section>
      <section>
        <h2>Event Approvals</h2>
        <EventApprovals />
      </section>
    </div>
  );
}

// app/admin/page.js
'use client'; // Required if you're using client-side interactivity

import React from 'react';
import RoadmapManager from '@/components/RoadmapManager';
import EventApprovals from '@/components/EventApprovals';

export default function AdminPage() {
  return (
    <main>
      <RoadmapManager />
    </main>
  );
}

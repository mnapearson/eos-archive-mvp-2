// app/admin/page.js
'use client'; // Required if you're using client-side interactivity

import React from 'react';
import AdminDashboard from '@/components/AdminDashboard';

export default function AdminPage() {
  return (
    <main>
      <h1>Admin Dashboard</h1>
      <AdminDashboard />
    </main>
  );
}

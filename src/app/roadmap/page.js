// src/app/roadmap/page.js
'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function RoadmapPage() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    async function fetchTasks() {
      const { data, error } = await supabase.from('roadmap_items').select('*');
      if (error) {
        console.error('Error fetching roadmap items:', error);
      } else {
        setTasks(data);
      }
    }
    fetchTasks();
  }, []);

  const activeTasks = tasks
    .filter(
      (task) => task.status === 'upcoming' || task.status === 'in_progress'
    )
    .sort((a, b) => {
      if (a.status === 'in_progress' && b.status === 'upcoming') return -1;
      if (a.status === 'upcoming' && b.status === 'in_progress') return 1;
      return 0;
    });
  const completedTasks = tasks.filter((task) => task.status === 'completed');

  return (
    <div className='max-w-3xl mx-auto py-8 px-4'>
      <h1 className='font-light mb-8'>Product Roadmap</h1>

      <section className='mb-8'>
        <h2 className='font-light border-b border-gray-300 pb-2 mb-4'>
          In progress and upcoming
        </h2>
        {activeTasks.length === 0 ? (
          <p className='italic text-gray-400'>No active tasks.</p>
        ) : (
          <div className='space-y-4'>
            {activeTasks.map((task) => (
              <div
                key={task.id}
                className='py-2'>
                <h3 className='font-normal'>{task.title}</h3>
                <p className='text-sm text-gray-400'>{task.description}</p>
                <small className='text-xs text-gray-500'>{task.status}</small>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className='font-light border-b border-gray-300 pb-2 mb-4'>
          Completed
        </h2>
        {completedTasks.length === 0 ? (
          <p className='italic text-gray-400'>No completed tasks.</p>
        ) : (
          <div className='space-y-4'>
            {completedTasks.map((task) => (
              <div
                key={task.id}
                className='py-2'>
                <h3 className='font-normal'>{task.title}</h3>
                <p className='text-sm text-gray-400'>{task.description}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// src/components/RoadmapManager.js
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function RoadmapManager() {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    status: 'upcoming',
  });

  // Fetch roadmap items when component mounts
  useEffect(() => {
    async function fetchItems() {
      const { data, error } = await supabase.from('roadmap_items').select('*');
      if (error) {
        console.error('Error fetching roadmap items:', error);
      } else {
        setItems(data);
      }
    }
    fetchItems();
  }, []);

  // Handle adding a new roadmap item
  async function handleAddItem(e) {
    e.preventDefault();
    const { data, error } = await supabase
      .from('roadmap_items')
      .insert(newItem);
    if (error) {
      console.error('Error adding roadmap item:', error);
    } else {
      // Append the new item (assume data[0] is the inserted item)
      setItems([...items, data[0]]);
      // Reset form fields
      setNewItem({ title: '', description: '', status: 'upcoming' });
    }
  }

  return (
    <div>
      <form
        onSubmit={handleAddItem}
        style={{ marginBottom: '1rem' }}>
        <input
          type='text'
          placeholder='Title'
          value={newItem.title}
          onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
          required
        />
        <br />
        <textarea
          placeholder='Description'
          value={newItem.description}
          onChange={(e) =>
            setNewItem({ ...newItem, description: e.target.value })
          }
        />
        <br />
        <select
          value={newItem.status}
          onChange={(e) => setNewItem({ ...newItem, status: e.target.value })}>
          <option value='upcoming'>Upcoming</option>
          <option value='in_progress'>In Progress</option>
          <option value='completed'>Completed</option>
          <option value='archived'>Archived</option>
        </select>
        <br />
        <button type='submit'>Add Roadmap Item</button>
      </form>

      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <strong>{item.title}</strong> - <em>{item.status}</em>
            <p>{item.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

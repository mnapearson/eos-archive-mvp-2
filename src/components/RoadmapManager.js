// src/components/RoadmapManager.js
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function RoadmapManager() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    status: "upcoming",
  });

  // New state for editing
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingTaskValues, setEditingTaskValues] = useState({
    title: "",
    description: "",
    status: "upcoming",
  });

  useEffect(() => {
    async function fetchTasks() {
      const { data, error } = await supabase.from("roadmap_items").select("*");
      if (error) {
        console.error("Error fetching roadmap items:", error);
      } else {
        setTasks(data);
      }
    }
    fetchTasks();
  }, []);

  async function handleAddTask(e) {
    e.preventDefault();
    const { data, error } = await supabase
      .from("roadmap_items")
      .insert(newTask)
      .select();
    if (error) {
      console.error("Error adding roadmap item:", error);
    } else if (data && data.length > 0) {
      setTasks([...tasks, data[0]]);
      setNewTask({ title: "", description: "", status: "upcoming" });
    }
  }

  async function handleDeleteTask(id) {
    const { error } = await supabase
      .from("roadmap_items")
      .delete()
      .eq("id", id);
    if (error) {
      console.error("Error deleting roadmap item:", error);
    } else {
      setTasks(tasks.filter((task) => task.id !== id));
    }
  }

  async function handleUpdateStatus(id, newStatus) {
    const { data, error } = await supabase
      .from("roadmap_items")
      .update({ status: newStatus })
      .eq("id", id)
      .select();
    if (error) {
      console.error("Error updating status:", error);
    } else if (data && data.length > 0) {
      setTasks(tasks.map((task) => (task.id === id ? data[0] : task)));
    }
  }

  // New function to enter edit mode
  function handleEditTask(task) {
    setEditingTaskId(task.id);
    setEditingTaskValues({
      title: task.title,
      description: task.description,
      status: task.status,
    });
  }

  function handleCancelEdit() {
    setEditingTaskId(null);
    setEditingTaskValues({ title: "", description: "", status: "upcoming" });
  }

  async function handleSaveEdit(id) {
    const { data, error } = await supabase
      .from("roadmap_items")
      .update({
        title: editingTaskValues.title,
        description: editingTaskValues.description,
        status: editingTaskValues.status,
      })
      .eq("id", id)
      .select();
    if (error) {
      console.error("Error updating roadmap item:", error);
    } else if (data && data.length > 0) {
      setTasks(tasks.map((task) => (task.id === id ? data[0] : task)));
      handleCancelEdit();
    } else {
      console.error("No data returned from update");
    }
  }

  const activeTasks = tasks.filter(
    (task) => task.status === "upcoming" || task.status === "in_progress"
  );
  const completedTasks = tasks.filter((task) => task.status === "completed");

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="font-light mb-8">Roadmap Management</h1>

      <form onSubmit={handleAddTask} className="mb-8">
        <input
          type="text"
          placeholder="Title"
          value={newTask.title}
          onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
          required
          className="w-full border-b border-gray-300 bg-transparent py-2 mb-4 focus:outline-none"
        />
        <textarea
          placeholder="Description"
          value={newTask.description}
          onChange={(e) =>
            setNewTask({ ...newTask, description: e.target.value })
          }
          rows={3}
          className="w-full border-b border-gray-300 bg-transparent py-2 mb-4 focus:outline-none"
        ></textarea>
        <select
          value={newTask.status}
          onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
          className="w-full border-b text-gray-400 border-gray-300 bg-transparent py-2 mb-4 focus:outline-none"
        >
          <option value="upcoming">Upcoming</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="archived">Archived</option>
        </select>
        <button type="submit" className="mt-4 text-sm border py-2 px-4">
          Add Roadmap Item
        </button>
      </form>

      <section className="mb-8">
        <h2 className="font-light border-b border-gray-300 pb-2 mb-4">
          Upcoming
        </h2>
        {activeTasks.length === 0 ? (
          <p className="italic text-gray-400">No active tasks.</p>
        ) : (
          <div className="space-y-4">
            {activeTasks.map((task) => (
              <div key={task.id} className="py-2">
                {editingTaskId === task.id ? (
                  <div>
                    <input
                      type="text"
                      value={editingTaskValues.title}
                      onChange={(e) =>
                        setEditingTaskValues({
                          ...editingTaskValues,
                          title: e.target.value,
                        })
                      }
                      className="w-full border-b border-gray-300 bg-transparent py-2 mb-2 focus:outline-none"
                    />
                    <textarea
                      value={editingTaskValues.description}
                      onChange={(e) =>
                        setEditingTaskValues({
                          ...editingTaskValues,
                          description: e.target.value,
                        })
                      }
                      rows={2}
                      className="w-full border-b border-gray-300 bg-transparent py-2 mb-2 focus:outline-none"
                    ></textarea>
                    <select
                      value={editingTaskValues.status}
                      onChange={(e) =>
                        setEditingTaskValues({
                          ...editingTaskValues,
                          status: e.target.value,
                        })
                      }
                      className="w-full border-b border-gray-300 bg-transparent py-2 mb-2 focus:outline-none"
                    >
                      <option value="upcoming">Upcoming</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="archived">Archived</option>
                    </select>
                    <div className="flex items-center space-x-4 mt-2">
                      <button
                        onClick={() => handleSaveEdit(task.id)}
                        className="text-sm border py-2 px-4"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="text-sm text-gray-600 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="font-normal">{task.title}</h3>
                    <p className="text-sm text-gray-400">{task.description}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <select
                        value={task.status}
                        onChange={(e) =>
                          handleUpdateStatus(task.id, e.target.value)
                        }
                        className="text-sm border-b border-gray-300 bg-transparent focus:outline-none"
                      >
                        <option value="upcoming">Upcoming</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="archived">Archived</option>
                      </select>
                      <button
                        onClick={() => handleEditTask(task)}
                        className="text-sm text-gray-600 hover:text-gray-800"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-sm text-gray-600 hover:text-gray-800"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-light border-b border-gray-300 pb-2 mb-4">
          Completed
        </h2>
        {completedTasks.length === 0 ? (
          <p className="italic text-gray-400">No completed tasks.</p>
        ) : (
          <div className="space-y-4">
            {completedTasks.map((task) => (
              <div key={task.id} className="py-2">
                <h3 className="font-normal">{task.title}</h3>
                <p className="text-sm text-gray-400">{task.description}</p>
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

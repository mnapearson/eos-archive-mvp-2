// src/app/roadmap/page.js
"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function RoadmapPage() {
  const [tasks, setTasks] = useState([]);

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

  const activeTasks = tasks
    .filter(
      (task) => task.status === "upcoming" || task.status === "in_progress"
    )
    .sort((a, b) => {
      if (a.status === "in_progress" && b.status === "upcoming") return -1;
      if (a.status === "upcoming" && b.status === "in_progress") return 1;
      return 0;
    });
  const completedTasks = tasks.filter((task) => task.status === "completed");

  return (
    <div>
      <h1 className="font-light mb-8">Roadmap</h1>
      <p className="mb-8 text-sm text-gray-400">
        This roadmap displays our ongoing and completed milestones that shape
        the future of eos archive. The left panel shows what we're actively
        working on and planning for the near future, while the right panel
        highlights our completed achievements. Stay tuned for updates as we
        progress. Have an idea for a feature? Write to us,{" "}
        <a href="mailto:hello@eosarchive.app" className="hover:underline">
          hello@eosarchive.app
        </a>
        .
      </p>
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Active Tasks Box */}
        <section
          className="flex-1 p-4"
          style={{
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: "8px",
            boxShadow: "0 0 15px rgba(255,255,255,0.2)",
          }}
        >
          <h2 className="font-light border-b border-gray-300 pb-2 mb-4">
            In progress and upcoming
          </h2>
          <div className="max-h-96 overflow-y-auto">
            {activeTasks.length === 0 ? (
              <p className="italic text-gray-400">No active tasks.</p>
            ) : (
              <div className="space-y-4">
                {activeTasks.map((task) => (
                  <div key={task.id} className="py-2">
                    <h3 className="font-normal">{task.title}</h3>
                    <p className="text-sm text-gray-400">{task.description}</p>
                    <small className="text-xs text-gray-500">
                      {task.status}
                    </small>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Completed Tasks Box */}
        <section
          className="flex-1 p-4"
          style={{
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: "8px",
            boxShadow: "0 0 15px rgba(255,255,255,0.2)",
          }}
        >
          <h2 className="font-light border-b border-gray-300 pb-2 mb-4">
            Completed
          </h2>
          <div className="max-h-96 overflow-y-auto">
            {completedTasks.length === 0 ? (
              <p className="italic text-gray-400">No completed tasks.</p>
            ) : (
              <div className="space-y-4">
                {completedTasks.map((task) => (
                  <div key={task.id} className="py-2">
                    <h3 className="font-normal">{task.title}</h3>
                    <p className="text-sm text-gray-400">{task.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

"use server";

import { createClient, getSpacesById } from "@/utils/supabase/client";

const supabaseClient = createClient();

export async function GET(_req, { params }) {
  const { id } = await params;
  if (!id) {
    return new Response(JSON.stringify({ error: "Space ID is required" }), {
      status: 400,
    });
  }

  const { data, error } = await getSpacesById(supabaseClient, id);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

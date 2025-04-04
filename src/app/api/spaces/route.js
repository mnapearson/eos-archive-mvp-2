import { createClient, getAll } from "@utils/supabase/client";

const supabaseClient = createClient();

export async function GET() {
  const { data, error } = await getAll(supabaseClient, "spaces");

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }

  return new Response(JSON.stringify(data), { status: 200 });
}

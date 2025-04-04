import { getAll } from "@/lib/supabaseClient";

export async function GET() {
  const { data, error } = await getAll("spaces");

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }

  return new Response(JSON.stringify(data), { status: 200 });
}

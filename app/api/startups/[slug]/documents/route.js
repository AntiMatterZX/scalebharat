import { createClient } from "@supabase/supabase-js";

export async function GET(request, { params }) {
  try {
    const { slug } = params;
    const url = new URL(request.url);
    const visibility = url.searchParams.get("visibility") || "public";
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Resolve slug to startup ID
    const { data: startupData, error: startupError } = await supabase
      .from("startups")
      .select("id")
      .eq("slug", slug)
      .single();

    if (startupError || !startupData) {
      console.error("Startup not found for slug:", slug, startupError);
      return Response.json({ error: "Startup not found" }, { status: 404 });
    }

    // Get documents based on startup ID (no visibility filter for testing)
    const query = supabase
      .from("startup_documents")
      .select("*")
      .eq("startup_id", startupData.id);

    // Remove visibility filtering for testing
    // if (visibility === "public") {
    //   query.eq("visibility", "public");
    // } else if (visibility === "investors_only") {
    //   query.in("visibility", ["public", "investors_only"]);
    // }

    const { data: documents, error } = await query;

    if (error) {
      console.error("Error fetching documents:", error);
      return Response.json({ error: "Failed to fetch documents" }, { status: 500 });
    }

    return Response.json({ documents });
  } catch (error) {
    console.error("Unexpected error:", error);
    return Response.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}

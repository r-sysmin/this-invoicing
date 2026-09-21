import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_clients",
  title: "List clients",
  description: "List the signed-in user's saved clients, optionally filtered by a name or company search.",
  inputSchema: {
    search: z.string().trim().min(1).optional().describe("Match client name or company."),
    limit: z.number().int().min(1).max(100).default(50).describe("Maximum number of clients to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ search, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("clients")
      .select("id,name,company,email,address,tax_id,created_at")
      .order("created_at", { ascending: false })
      .limit(limit ?? 50);
    if (search) query = query.or(`name.ilike.%${search}%,company.ilike.%${search}%`);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const clients = (data ?? []).map((row) => ({
      id: String(row.id),
      name: String(row.name),
      company: row.company ? String(row.company) : "",
      email: row.email ? String(row.email) : "",
      address: row.address ? String(row.address) : "",
      tax_id: row.tax_id ? String(row.tax_id) : "",
    }));
    return {
      content: [{ type: "text", text: JSON.stringify(clients, null, 2) }],
      structuredContent: { clients },
    };
  },
});

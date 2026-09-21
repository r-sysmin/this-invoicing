import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "create_client",
  title: "Create client",
  description: "Save a new client to the signed-in user's client list.",
  inputSchema: {
    name: z.string().trim().min(1).describe("Client name."),
    company: z.string().trim().optional().describe("Company name."),
    email: z.string().trim().email().optional().describe("Client email."),
    address: z.string().trim().optional().describe("Billing address."),
    tax_id: z.string().trim().optional().describe("Tax or VAT identifier."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("clients")
      .insert({
        user_id: ctx.getUserId(),
        name: input.name,
        company: input.company ?? null,
        email: input.email ?? null,
        address: input.address ?? null,
        tax_id: input.tax_id ?? null,
      })
      .select("id,name,company,email,address,tax_id")
      .single();

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const client = {
      id: String(data.id),
      name: String(data.name),
      company: data.company ? String(data.company) : "",
      email: data.email ? String(data.email) : "",
      address: data.address ? String(data.address) : "",
      tax_id: data.tax_id ? String(data.tax_id) : "",
    };
    return {
      content: [{ type: "text", text: `Saved client ${client.name} (${client.id}).` }],
      structuredContent: { client },
    };
  },
});

import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

const toInvoiceSummary = (row: Record<string, unknown>) => ({
  id: String(row.id),
  invoice_number: String(row.invoice_number),
  status: String(row.status),
  currency: String(row.currency),
  total_amount: Number(row.total_amount),
  issue_date: String(row.issue_date),
  due_date: String(row.due_date),
  client_name:
    row.client_details && typeof row.client_details === "object"
      ? String((row.client_details as Record<string, unknown>).name ?? "")
      : "",
});

export default defineTool({
  name: "list_invoices",
  title: "List invoices",
  description: "List the signed-in user's invoices, newest first, optionally filtered by status.",
  inputSchema: {
    status: z
      .enum(["draft", "pending", "paid", "overdue"])
      .optional()
      .describe("Only return invoices with this status."),
    limit: z.number().int().min(1).max(100).default(20).describe("Maximum number of invoices to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("invoices")
      .select("id,invoice_number,status,currency,total_amount,issue_date,due_date,client_details")
      .order("created_at", { ascending: false })
      .limit(limit ?? 20);
    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const invoices = (data ?? []).map((row) => toInvoiceSummary(row as Record<string, unknown>));
    return {
      content: [{ type: "text", text: JSON.stringify(invoices, null, 2) }],
      structuredContent: { invoices },
    };
  },
});

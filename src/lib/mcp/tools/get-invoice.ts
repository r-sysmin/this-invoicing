import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

const toInvoiceJson = (row: Record<string, unknown>) => ({
  id: String(row.id),
  invoice_number: String(row.invoice_number),
  status: String(row.status),
  currency: String(row.currency),
  issue_date: String(row.issue_date),
  due_date: String(row.due_date),
  subtotal: Number(row.subtotal),
  tax_rate: Number(row.tax_rate),
  discount_rate: Number(row.discount_rate),
  total_amount: Number(row.total_amount),
  notes: row.notes ? String(row.notes) : "",
  payment_terms: row.payment_terms ? String(row.payment_terms) : "",
  template: String(row.template),
  client_id: row.client_id ? String(row.client_id) : null,
  client_details: JSON.parse(JSON.stringify(row.client_details ?? {})) as Record<string, string>,
  business_details: JSON.parse(JSON.stringify(row.business_details ?? {})) as Record<string, string>,
  items: (Array.isArray(row.items) ? row.items : []).map((item) => {
    const line = item as Record<string, unknown>;
    return {
      description: String(line.description ?? ""),
      quantity: Number(line.quantity ?? 0),
      rate: Number(line.rate ?? 0),
    };
  }),
});

export default defineTool({
  name: "get_invoice",
  title: "Get invoice",
  description: "Fetch one of the signed-in user's invoices in full, by id or invoice number.",
  inputSchema: {
    id: z.string().uuid().optional().describe("The invoice id."),
    invoice_number: z.string().trim().min(1).optional().describe("The invoice number, e.g. INV-001."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ id, invoice_number }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    if (!id && !invoice_number) throw new ToolError("Provide either id or invoice_number.");

    const supabase = supabaseForUser(ctx);
    let query = supabase.from("invoices").select("*").limit(1);
    query = id ? query.eq("id", id) : query.eq("invoice_number", invoice_number!);

    const { data, error } = await query.maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data) throw new ToolError("No matching invoice found.");

    const invoice = toJson(data) as Record<string, unknown>;
    return {
      content: [{ type: "text", text: JSON.stringify(invoice, null, 2) }],
      structuredContent: { invoice },
    };
  },
});

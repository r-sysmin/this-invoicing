import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

const lineItem = z.object({
  description: z.string().trim().min(1),
  quantity: z.number().positive(),
  rate: z.number().min(0),
});

export default defineTool({
  name: "create_invoice",
  title: "Create invoice",
  description: "Create a new invoice for the signed-in user with line items, tax and discount.",
  inputSchema: {
    invoice_number: z.string().trim().min(1).describe("Invoice number, e.g. INV-001."),
    issue_date: z.string().describe("Issue date, YYYY-MM-DD."),
    due_date: z.string().describe("Due date, YYYY-MM-DD."),
    currency: z.string().trim().length(3).default("USD").describe("3-letter currency code."),
    status: z.enum(["draft", "pending", "paid", "overdue"]).default("draft"),
    client_name: z.string().trim().min(1).describe("Client name shown on the invoice."),
    client_company: z.string().trim().default("").describe("Client company."),
    client_email: z.string().trim().default("").describe("Client email."),
    client_address: z.string().trim().default("").describe("Client address."),
    items: z.array(lineItem).min(1).describe("Line items on the invoice."),
    tax_rate: z.number().min(0).max(100).default(0).describe("Tax rate as a percentage."),
    discount_rate: z.number().min(0).max(100).default(0).describe("Discount rate as a percentage."),
    notes: z.string().trim().default("").describe("Notes shown on the invoice."),
    payment_terms: z.string().trim().default("").describe("Payment terms text."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const taxRate = input.tax_rate ?? 0;
    const discountRate = input.discount_rate ?? 0;
    const subtotal = input.items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
    const total = subtotal - (subtotal * discountRate) / 100 + (subtotal * taxRate) / 100;

    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("invoices")
      .insert({
        user_id: ctx.getUserId(),
        invoice_number: input.invoice_number,
        issue_date: input.issue_date,
        due_date: input.due_date,
        currency: input.currency ?? "USD",
        status: input.status ?? "draft",
        client_details: {
          name: input.client_name,
          company: input.client_company ?? "",
          email: input.client_email ?? "",
          address: input.client_address ?? "",
        },
        items: input.items.map((item, index) => ({
          id: `item-${index + 1}`,
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
        })),
        tax_rate: taxRate,
        discount_rate: discountRate,
        notes: input.notes ?? "",
        payment_terms: input.payment_terms ?? "",
        subtotal,
        total_amount: total,
      })
      .select("id,invoice_number,status,currency,subtotal,total_amount,issue_date,due_date")
      .single();

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const invoice = {
      id: String(data.id),
      invoice_number: String(data.invoice_number),
      status: String(data.status),
      currency: String(data.currency),
      subtotal: Number(data.subtotal),
      total_amount: Number(data.total_amount),
      issue_date: String(data.issue_date),
      due_date: String(data.due_date),
    };
    return {
      content: [{ type: "text", text: `Created invoice ${invoice.invoice_number} (${invoice.id}).` }],
      structuredContent: { invoice },
    };
  },
});

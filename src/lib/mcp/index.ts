import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listInvoicesTool from "./tools/list-invoices";
import getInvoiceTool from "./tools/get-invoice";
import createInvoiceTool from "./tools/create-invoice";
import listClientsTool from "./tools/list-clients";
import createClientTool from "./tools/create-client";

// Must be the direct Supabase host, built from the project ref (inlined at build time).
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "this-invoicing",
  title: "THIS Invoicing",
  version: "0.1.0",
  instructions:
    "Tools for the Invofy invoicing app. Read and create invoices and clients for the signed-in user. Use `list_invoices` to browse, `get_invoice` for full detail, `create_invoice` to draft a new invoice, and `list_clients` / `create_client` to manage the client list.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listInvoicesTool, getInvoiceTool, createInvoiceTool, listClientsTool, createClientTool],
});

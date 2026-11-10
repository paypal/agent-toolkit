/**
 * Mesh — N-party atomic fan-out quoting tool for the PayPal Agent Toolkit.
 *
 * DRAFT (2026-11-10, for discussion). This file is a single-module proposal
 * for the 43rd tool: a bridge that lets an agent request the projected
 * split of a PayPal order's proceeds across multiple payees (merchant +
 * agent + affiliate + …) before the on-chain settlement happens.
 *
 * Why it belongs in the catalogue
 * -------------------------------
 * The Agent Toolkit currently exposes 42 tools — invoicing, orders,
 * subscriptions, disputes, catalogue, shipment tracking, reporting. None
 * of them pay an agent. An AI agent that discovers a product, closes the
 * sale through `create_order` + `capture_order`, and then has to wait for
 * a human to reconcile its commission is not autonomous.
 *
 * Mesh is the primitive that lets the agent get paid at the same block
 * as the merchant. This tool does NOT perform the on-chain settlement
 * itself — it calls an external Mesh orchestrator endpoint which signs,
 * registers the listing, deposits the stablecoin, and triggers an atomic
 * `release()`. See docs/MESH_FANOUT_DESIGN.md for the design rationale,
 * the AP2 Payment Mandate binding, and the HARD_PARTS appendix.
 *
 * Related ecosystem work
 * ----------------------
 * - `#107 Add Payouts tools (Python and TypeScript)` by @rushabhT3 opens
 *   the same lane (agent-initiated proceeds distribution) but targets
 *   PayPal Payouts v2, which is batch disbursement — no atomicity, no
 *   mandate binding, no per-recipient on-chain settlement. Mesh and
 *   Payouts v2 are complementary: Payouts for fiat batch rails, Mesh
 *   for agent-settled stablecoin rails bound to AP2 Mandates.
 * - `google-agentic-commerce/AP2#255` tracks on-chain settlement-side
 *   mandate binding more broadly — this tool is one implementation of
 *   that pattern.
 *
 * This is a DRAFT PR for discussion. Happy to pare scope (parameters-only
 * schema, docs-only PR, or merge behind a feature flag). Maintainers:
 * please leave review comments naming the piece that makes sense for the
 * Nov 2026 roadmap.
 */
import axios from "axios";
import { z } from "zod";

import type { Context } from "./configuration";

// ---------------------------------------------------------------------
// Parameters — zod schema for `request_mesh_fanout_quote`
// ---------------------------------------------------------------------

const BPS_DENOMINATOR = 10_000;

const meshRecipient = () =>
  z.object({
    role: z
      .enum(["merchant", "agent", "affiliate", "platform", "referrer"])
      .describe(
        "Semantic role this payee plays in the cart. The orchestrator uses role to construct a stable role → address binding for the dashboard + the leaderboard.",
      ),
    address: z
      .string()
      .regex(
        /^0x[0-9a-fA-F]{40}$/,
        "address must be a 20-byte hex address (checksum normalised by the orchestrator)",
      )
      .describe("Payee's on-chain address — must receive the stablecoin."),
    share_bps: z
      .number()
      .int()
      .min(1)
      .max(BPS_DENOMINATOR - 1)
      .describe(
        "Share in basis points. The recipient array's share_bps MUST sum to exactly 10_000 (= 100%).",
      ),
  });

export const requestMeshFanoutQuoteParameters = (
  _context: Context = {},
) =>
  z.object({
    payment_mandate_id: z
      .string()
      .min(1)
      .describe(
        "AP2 Payment Mandate id (e.g. from `paypal-ai-order/payment_mandate.payment_mandate_contents.payment_mandate_id`). Server-authored; the orchestrator derives the idempotency key from the canonical Mandate contents + a CRE tick bucket, so a client-authored replay inside the TTL window routes to `duplicate-routed` rather than auto-settling.",
      ),
    cart_total_minor_units: z
      .string()
      .regex(/^[0-9]+$/, "cart_total_minor_units must be a decimal string")
      .describe(
        "Cart total in the token's minor units (6 decimals for PYUSD/USDC/USDG, 18 for ETH). Decimal string so BigInt values round-trip.",
      ),
    currency: z
      .string()
      .length(3)
      .describe(
        "ISO-4217 currency code of the Cart Mandate total (e.g. 'USD').",
      ),
    recipients: z
      .array(meshRecipient())
      .min(2)
      .max(16)
      .describe(
        "2–16 payees. share_bps MUST sum to exactly 10 000 (enforced in the function body before the orchestrator call). Duplicate addresses are rejected. The on-chain `release(bytes32 depositId)` cannot override this — the split is frozen at listing registration.",
      ),
    settlement_token: z
      .enum(["pyusd", "usdc", "usdg"])
      .default("pyusd")
      .describe(
        "Stablecoin to settle in. Escrow is `IERC20`-polymorphic; the orchestrator picks the deployed address for the chain.",
      ),
    chain_id: z
      .number()
      .int()
      .default(421614)
      .describe(
        "Chain id for the Mesh orchestrator to target. Defaults to Arbitrum Sepolia (421614). Mainnet chain ids are refused by the orchestrator's KNOWN_MAINNET_IDS guardrail.",
      ),
    mesh_endpoint_url: z
      .string()
      .url()
      .optional()
      .describe(
        "Override the Mesh orchestrator base URL. Defaults to the MESH_ENDPOINT_URL env var; caller-supplied value wins for per-tenant routing.",
      ),
  });

// ---------------------------------------------------------------------
// Prompt — the LLM-facing description, mirrored in the tool's description
// ---------------------------------------------------------------------

export const requestMeshFanoutQuotePrompt = (_context: Context) => `
Quote an atomic N-party fan-out of a PayPal order's proceeds through the
Kajota Mesh settlement primitive.

Use this tool after a PayPal order has been created + captured and the
agent needs to know how the proceeds will be split across the merchant,
the agent itself, and any affiliates — before the on-chain settlement
fires. The orchestrator returns the deterministic per-recipient payout
in the token's minor units, the preimage of the on-chain listing id
that will be registered, and the estimated chain tx count.

Required inputs:
- payment_mandate_id: the AP2 Payment Mandate id this quote binds to
- cart_total_minor_units: cart total in the settlement token's minor units
- currency: ISO-4217 code of the Cart Mandate total
- recipients: 2–16 payees with roles, addresses, and share_bps summing to 10 000

Returns:
- per_recipient_payout: [{ role, address, share_bps, payout_minor_units }]
- listing_id_preimage: the data the orchestrator will hash to form the
  on-chain listing id — lets the agent precompute the Mesh dashboard link
- estimated_chain_tx_count: 4 (register + approve + deposit + release)
- settlement_token_options: list of tokens the orchestrator has deployed

The quote is deterministic given the inputs — the agent can re-request
it idempotently. The orchestrator does NOT write on-chain until a separate
'fanout_release' call lands (not in this PR).
`;

// ---------------------------------------------------------------------
// Function — calls the Mesh orchestrator's /api/mesh/quote endpoint
// ---------------------------------------------------------------------

type MeshQuoteResponse = {
  ok: boolean;
  payment_mandate_id: string;
  listing_id_preimage: string;
  per_recipient_payout: {
    role: string;
    address: string;
    share_bps: number;
    payout_minor_units: string;
  }[];
  estimated_chain_tx_count: number;
  settlement_token_options: string[];
  chain_id: number;
};

export async function requestMeshFanoutQuote(
  // Mirrors the signature of existing tools: (client, context, params).
  // The PayPalClient is passed for header-reuse but the quote endpoint
  // is external to PayPal — we do not call PayPal APIs from here.
  _client: unknown,
  _context: Context,
  params: z.infer<ReturnType<typeof requestMeshFanoutQuoteParameters>>,
): Promise<MeshQuoteResponse> {
  const base =
    params.mesh_endpoint_url ??
    process.env.MESH_ENDPOINT_URL ??
    "https://kajota-paypal.vercel.app";
  const url = `${base.replace(/\/$/, "")}/api/mesh/quote`;

  // Validate the two cross-field invariants the schema can't express
  // alone (ZodObject rather than ZodEffects so the tools.ts type binding
  // stays compatible with the registry).
  const totalBps = params.recipients.reduce((acc, r) => acc + r.share_bps, 0);
  if (totalBps !== BPS_DENOMINATOR) {
    throw new Error(
      `recipients.share_bps must sum to exactly ${BPS_DENOMINATOR} bps; got ${totalBps}`,
    );
  }
  const seen = new Set<string>();
  for (const r of params.recipients) {
    const k = r.address.toLowerCase();
    if (seen.has(k)) {
      throw new Error(`recipients.address values must be distinct (saw ${k} twice)`);
    }
    seen.add(k);
  }

  const payload = {
    payment_mandate_id: params.payment_mandate_id,
    cart_total_minor_units: params.cart_total_minor_units,
    currency: params.currency,
    recipients: params.recipients,
    settlement_token: params.settlement_token,
    chain_id: params.chain_id,
  };

  try {
    const response = await axios.post(url, payload, {
      headers: {
        "Content-Type": "application/json",
        // The Mesh orchestrator accepts anonymous quote requests. Tenancy
        // scoping happens via the `payment_mandate_id` which is already
        // bound to a signing merchant.
      },
      timeout: 15_000,
    });
    return response.data as MeshQuoteResponse;
  } catch (error) {
    const axiosErr = error as { message?: string; response?: { status?: number; data?: unknown } };
    throw new Error(
      `Mesh fan-out quote failed (${url}): ${axiosErr.response?.status ?? "no-status"} — ${axiosErr.message ?? String(error)}`,
    );
  }
}

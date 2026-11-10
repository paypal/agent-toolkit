# Mesh fan-out — a 43rd tool proposal for the PayPal Agent Toolkit

**Date:** 2026-11-10. **Status:** DRAFT PR, opened for discussion ahead of the PayPal AI Hackathon submission deadline (2026-11-12 20:00 UTC).

This doc is the design rationale for `typescript/src/shared/mesh.ts` — the new tool `request_mesh_fanout_quote` added to the toolkit catalogue in this PR. Happy to pare scope to docs-only, a parameters-only schema, or a feature flag — see §Scope options at the end.

## 1. The gap

The Agent Toolkit catalogue today exposes 42 tools across invoicing, orders, subscriptions, disputes, products, catalogue, shipment tracking, reporting, and insights. Every one of them answers *"how does the agent move money INTO the merchant"*. None of them answers *"how does the agent get paid"*.

Specifically, when an AI agent closes a sale on behalf of the merchant:

- The merchant receives the funds from the buyer via `create_order` + `capture_order`.
- There is no primitive in the catalogue (or in PayPal's Cart API v1) that lets the merchant split those captured funds across the agent + any affiliate.
- PayPal Payouts v2 exists as a separate batch disbursement API — [#107 Add Payouts tools](https://github.com/paypal/agent-toolkit/pull/107) by @rushabhT3 wraps it as a toolkit tool. Payouts is useful for batch fiat disbursement, but is not atomic, not mandate-bound, and not per-order.
- The AP2 Payment Mandate schema ([`google-agentic-commerce/AP2`](https://github.com/google-agentic-commerce/AP2)) names exactly one `merchant_agent`. The catalogue inherits the same one-agent assumption.

The practical gap: *"an AI agent that closes a sale and waits for a human to reconcile its commission is a lead-gen tool with worse UX."*

## 2. The proposal

Add a NEW tool to the catalogue: `request_mesh_fanout_quote`. This is a bridge tool — it does NOT call PayPal APIs directly. Instead it calls an external Mesh orchestrator (default: `https://kajota-paypal.vercel.app/api/mesh/quote`, overridable via the `mesh_endpoint_url` parameter or the `MESH_ENDPOINT_URL` env var) to get a deterministic quote for the N-party split.

### 2.1 Tool inputs

```ts
{
  payment_mandate_id: string,       // AP2 Payment Mandate id
  cart_total_minor_units: string,   // bigint-safe decimal
  currency: "USD" | ...,            // ISO-4217
  recipients: [{                    // 2-16 payees
    role: "merchant" | "agent" | "affiliate" | "platform" | "referrer",
    address: `0x${string}`,
    share_bps: number,              // sum to exactly 10 000
  }],
  settlement_token?: "pyusd" | "usdc" | "usdg",
  chain_id?: number,                // default 421614 (Arbitrum Sepolia)
  mesh_endpoint_url?: string,       // override
}
```

### 2.2 Tool outputs

```ts
{
  ok: boolean,
  payment_mandate_id: string,
  listing_id_preimage: string,
  per_recipient_payout: [{
    role, address, share_bps,
    payout_minor_units: string,     // bigint-safe
  }],
  estimated_chain_tx_count: 4,      // register + approve + deposit + release
  settlement_token_options: string[],
  chain_id: number,
}
```

### 2.3 Why a quote tool, not a release tool

A quote is non-mutating, idempotent, and chain-write-free — safer first PR. A release tool (`fanout_release`) would complete the pattern but is not in this PR; proposing it separately once a quote tool is accepted.

## 3. The settlement primitive behind the tool

The Mesh orchestrator is built on `CosellEscrowV2` + `CosellRegistryV2` — 10 verified contracts on Arbitrum Sepolia (addresses + Arbiscan links at [`KaJota-inc/kajota-paypal/lib/mesh/addresses.ts`](https://github.com/KaJota-inc/kajota-paypal/blob/feat/mandate-beacon-ap2-plug/lib/mesh/addresses.ts)). Hard-parts that shaped the design (full list at [`KaJota-inc/kajota-paypal/docs/HARD_PARTS.md`](https://github.com/KaJota-inc/kajota-paypal/blob/feat/mandate-beacon-ap2-plug/docs/HARD_PARTS.md)):

- **Zero-argument `release(bytes32 depositId)`** — the trigger cannot pass a share table in; the split is frozen at listing registration. Prevents share-rotation attacks after volume lands.
- **Sum-to-10 000 bps on-chain revert** — an off-by-one in client-side share computation fails before any token moves.
- **Deactivate-only registry** — mid-flight listing edits are impossible; registrant can only deactivate for future deposits.
- **Destination-locked refund** — `_originalBuyerOf[depositId]` recorded on relay, enforced in `refundToOriginalBuyer`.
- **Token-agnostic constructor** — same bytecode runs against USDC (`0x75faf11…`), USDG (`0xFFC95faa…`), PYUSD (`0x637A1259…`).
- **AP2 `payment_mandate_id` idempotency** — PayPal's webhook retries 25× over 72h; a naive handler fans out N times. Deduped by `payment_mandate_id` at the orchestrator boundary. Open issue: a compromised agent can mint a fresh `payment_mandate_id` for the same cart; the Mandate Beacon layer at [`KaJota-inc/kajota-paypal/lib/beacon/`](https://github.com/KaJota-inc/kajota-paypal/blob/feat/mandate-beacon-ap2-plug/lib/beacon/) derives a server-authored idempotency key to defend.

## 4. Evidence that the primitive works

Five end-to-end cycles fired against the live USDC escrow on Arbitrum Sepolia on 2026-11-10 — 20 on-chain transactions, 3 distinct hustler addresses, $5 USDC fanned, 0.00008 ETH gas. Full tx-hash index with Arbiscan links at [`KaJota-inc/kajota-paypal/LIVE_SETTLEMENTS.md`](https://github.com/KaJota-inc/kajota-paypal/blob/feat/mandate-beacon-ap2-plug/LIVE_SETTLEMENTS.md).

Click any `release` tx on Arbiscan: three ERC-20 `Transfer` events in the log, one per payee, all in the same transaction — the atomic-split invariant visible on-chain.

## 5. Relationship to related work

- **`paypal/agent-toolkit#107`** @rushabhT3 — adds Payouts v2 tools. Complementary: Payouts for batch fiat rails, Mesh for per-order atomic stablecoin rails. The two don't overlap in capability.
- **`paypal/agent-toolkit#98`** @PRIEST099 + `#124` @NovaCorpAI — add per-call `PayPal-Request-Id` for idempotency. Consumed by Mesh: the orchestrator uses `PayPal-Request-Id` to key its own webhook dedupe against the Mandate id.
- **`google-agentic-commerce/AP2#255`** @hilarl — ecosystem thread on on-chain settlement-side mandate binding. Mesh is one implementation; I posted a comment on 2026-11-03 at [issuecomment-6598336168](https://github.com/google-agentic-commerce/AP2/issues/255#issuecomment-6598336168) laying out the N-party primitive.

## 6. Scope options for maintainers

This PR is a DRAFT. Pick the level you want to merge:

1. **Full acceptance as-is** — tool definition + parameters + bridge function. Mesh orchestrator URL stays overridable; default points at the public Kajota deployment.
2. **Parameters-only** — merge the `requestMeshFanoutQuoteParameters` zod schema only, so agents can quote via their own settlement rail. Drop the bridge function.
3. **Docs-only** — merge just `docs/MESH_FANOUT_DESIGN.md` as a `rfc:` entry for the Nov 2026 roadmap. No code change.
4. **Feature-flagged** — add the tool under a `KAJOTA_MESH_PREVIEW=true` env flag so it's off-by-default. Any merchant can opt in via env.
5. **Close as not-for-paypal** — the primitive belongs in its own package. No hard feelings; the design doc stays as citable precedent.

I'm happy with any of these. The important thing for us (the Kajota submission) is that this PR exists as a filed design in-scope before our 2026-11-12 deadline — standing engagement with the toolkit maintainers is the goal; merge state is secondary.

## 7. Prior art disclosure

Mesh substrate at `KaJota-inc/kajota-arbitrum-singapore@9f8fb5e` (Arbitrum Open House Singapore 2026 submission, MIT). PayPal integration at `KaJota-inc/kajota-paypal` (PayPal AI Hackathon 2026 submission, MIT). The design here is net-new work for this PR — the substrate existed; the toolkit tool definition does not. Submission context tracked in [`KaJota-inc/kajota-paypal/docs/SUBMISSION.md`](https://github.com/KaJota-inc/kajota-paypal/blob/feat/mandate-beacon-ap2-plug/docs/SUBMISSION.md).

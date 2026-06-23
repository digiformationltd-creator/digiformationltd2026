// Digiformation AI Assistant — streaming chat via Lovable AI Gateway
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are the "Digiformation AI Assistant" — the official 24/7 website agent for Digiformation Ltd (https://digiformation.uk). You must behave like a real human sales consultant, NOT a chatbot or menu selector.

═══════════════════════════════════════════════
🧠 CONVERSATION STYLE — STRICTLY ENFORCE
═══════════════════════════════════════════════
- Keep replies SHORT. Aim for 2–3 lines. Use up to 4–5 lines only when truly needed (e.g. explaining a package).
- Send AT MOST 2 messages per turn. Prefer 1 message when possible.
- If you genuinely need to split, use the delimiter "<<<SPLIT>>>" on its own line between the 2 messages.
- One idea per message. Ask ONE question at a time.
- NEVER dump full service lists, package tables, or multiple options at the start.
- NEVER behave like a selector menu ("Choose 1, 2, 3…").
- Talk like a real human assistant — warm, casual, professional. Use "Sir" / "Please" naturally.
- Match the user's language (English, Urdu, Roman Urdu, Hindi). Mirror their tone.
- Use light emojis sparingly (👍 👋 ✅) — not in every message.

EXAMPLE (max 2 messages, 3 lines each):
Got it 👍 Sounds good.
<<<SPLIT>>>
UK company chahiye ya USA LLC?

═══════════════════════════════════════════════
🎯 ENGAGEMENT FLOW — STEP BY STEP
═══════════════════════════════════════════════
1. FIRST MESSAGE: short greeting + ONE simple intent question. Example:
   "Hi! 👋 What would you like to start today?"
   Nothing else. No service list. No pricing. No links.

2. FOLLOW-UPS: ask ONE short question at a time to narrow down need:
   - UK or USA?
   - Business type? (e-commerce / freelancing / agency / etc.)
   - Already have a company or starting fresh?
   - Need banking / payments too?
   Adapt each question based on the previous answer.

3. Only AFTER you fully understand the requirement, give a FINAL recommendation:
   - One relevant service/package only
   - Short reason why it suits them (1–2 lines)
   - Then ask for confirmation: "Shall I share the checkout link?"

4. Share links ONLY after the user confirms interest or explicitly asks.

═══════════════════════════════════════════════
🚫 HARD RULES — NEVER DO
═══════════════════════════════════════════════
- ❌ No full package lists at the start
- ❌ No multiple options dumped in one message
- ❌ No long paragraphs
- ❌ No menu-style numbered lists at greeting
- ❌ No links until user shows clear intent
- ❌ No discounts (prices are fixed)
- ❌ No invented services/prices/timelines

═══════════════════════════════════════════════
📋 INTERNAL KNOWLEDGE (use only when relevant, never dump)
═══════════════════════════════════════════════
Channel: You are the WEBSITE AI — always 24/7. Don't mention WhatsApp scheduling.
Company: Digiformation Ltd — UK company formation & global banking. Contact: WhatsApp +92 316 4467464.

SERVICES & FIXED PRICING (reveal one at a time, only when relevant):

1. UK LTD Formation — /uk-services/uk-ltd-formation
   Starter £140 | Silver £170 ⭐ (recommended) | Gold £180 | Platinum £200
   Silver checkout: /uk-services/uk-ltd-formation/checkout?jurisdiction=EW&package=Silver
   Silver includes: Companies House registration, Certificate, Memorandum & Articles, Registered Office, Auth Code, UTR assistance, ID Verification.

2. Company Formation only (no ID verification) — £160
3. ID Verification — £20 — /uk-services/ltd-id-verification (24h turnaround)
4. Address Services: Director Service £20/yr | Registered Office £40/yr | Business £60/yr | All-in-One £80/yr — /uk-services/registered-office-address
5. UK Compliance — /uk-compliance/... (name/address change, annual accounts, confirmation statement, AD01, UTR, Auth Code, Activation Code, VAT, annual filing)
6. Banks & Payments — /banks-payment-solutions (PayPal, Stripe, Wise, Payoneer, Airwallex, Tide, Sunrate, Mollie, Grey, Nsave, etc., £20–£70)
   Match by need: Freelancing/P2P → Wise, Nsave | E-commerce → Sunrate, Stripe | Merchant → Airwallex, Stripe | Startup → Grey, Payoneer
7. USA Services — /usa-services/... (LLC in Wyoming/Delaware/New Mexico/Florida, EIN, ITIN, Annual Tax, BOI)
8. Web Development — /web-development (business sites, e-commerce, Shopify)

You have FULL access to all Digiformation services — no topic restrictions. But REVEAL information gradually, only what's relevant to the current step.

═══════════════════════════════════════════════
💡 EXAMPLE FLOW (follow this style)
═══════════════════════════════════════════════
Bot: "Hi! 👋 What would you like to start today?"
User: "Company formation"
Bot: "Great 👍 UK or USA?"
User: "UK"
Bot: "Perfect 👍 What's the business — e-commerce, freelancing, or something else?"
User: "E-commerce"
Bot: "Got it. Do you also need a payment gateway like Stripe or PayPal?"
User: "Yes Stripe"
Bot: "Then I'd suggest our Silver UK LTD package (£170) — it includes everything needed for Stripe approval. Shall I share the checkout link?"
User: "Yes"
Bot: "Here you go 👉 /uk-services/uk-ltd-formation/checkout?jurisdiction=EW&package=Silver"

═══════════════════════════════════════════════
PAYMENT NOTE (only when asked)
═══════════════════════════════════════════════
"Sir, we require advance payment due to service-based processing. You can also visit our office if preferred."

For complex/legal/unrelated queries: "Sir, I'll forward this to our support team." Then suggest: https://wa.me/923164467464

GOAL: Feel like a real human consultant — one short question at a time, gradually guide the user to the right service.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Cap input size to prevent credit abuse via oversized prompts.
    const MAX_MESSAGES = 20;
    const MAX_CHARS_PER_MSG = 2000;
    const MAX_TOTAL_CHARS = 12000;
    if (messages.length > MAX_MESSAGES) {
      return new Response(JSON.stringify({ error: "Too many messages" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    let totalChars = 0;
    const safeMessages = [] as Array<{ role: string; content: string }>;
    for (const m of messages) {
      if (!m || typeof m.role !== "string" || typeof m.content !== "string") {
        return new Response(JSON.stringify({ error: "Invalid message format" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (!["system", "user", "assistant"].includes(m.role)) {
        return new Response(JSON.stringify({ error: "Invalid role" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const content = m.content.slice(0, MAX_CHARS_PER_MSG);
      totalChars += content.length;
      if (totalChars > MAX_TOTAL_CHARS) {
        return new Response(JSON.stringify({ error: "Conversation too long" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      safeMessages.push({ role: m.role, content });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        stream: true,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...safeMessages],
      }),
    });

    if (!upstream.ok) {
      if (upstream.status === 429) {
        return new Response(
          JSON.stringify({ error: "Bahut zyada requests aa rahi hain — thori der baad try karein." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (upstream.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits khatam ho gaye. Please contact admin." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const t = await upstream.text();
      console.error("AI gateway error:", upstream.status, t);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(upstream.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

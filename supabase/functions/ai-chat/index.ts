// Digiformation AI Assistant — streaming chat via Lovable AI Gateway
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are the "Digiformation AI Assistant" — the official 24/7 website support agent for Digiformation Ltd (https://digiformation.uk).
You act like a professional, friendly human sales consultant — NOT a robotic chatbot.

TONE & STYLE:
- Professional but warm. Use "Sir" / "Please" / "Kindly" where natural.
- Short replies (1–5 lines preferred). No bullet spam.
- Match the user's language (English, Urdu, Roman Urdu, Hindi).
- Ask follow-up questions like a real sales agent before recommending.
- Never sound forceful or pushy.

CHANNEL CONTEXT:
- You are the WEBSITE AI — always online, 24/7, instant replies. No time restrictions apply to you.
- WhatsApp bot runs on a separate schedule; do not mention WhatsApp scheduling to users.

COMPANY: Digiformation Ltd — UK-based company formation & global banking solutions, trusted by 300+ entrepreneurs.
Contact: WhatsApp +92 316 4467464.

SERVICES & FIXED PRICING (never negotiate, never discount):

1. UK LTD Formation — /uk-services/uk-ltd-formation
   Packages:
   - Starter — £140
   - Silver — £170  ⭐ RECOMMENDED (Companies House registration, Certificate of Incorporation, Memorandum & Articles, Registered Office Address, Authentication Code, UTR assistance, ID Verification included)
   - Gold — £180
   - Platinum — £200
   Checkout (Silver): /uk-services/uk-ltd-formation/checkout?jurisdiction=EW&package=Silver

2. Company Formation ONLY (no ID verification) — £160
   Requires: 3 company name options, address details, email, basic compliance info.

3. ID Verification — £20 (fixed) — /uk-services/ltd-id-verification
   Requires: passport/ID, live selfie, home address, bank statement or utility bill, email. Turnaround: 24 hours.

4. Address Services:
   - Director Service Address — £20/year
   - Registered Office Address — £40/year — /uk-services/registered-office-address
   - Business Address — £60/year
   - All-in-One — £80/year

5. UK Compliance — /uk-compliance/...
   Name change, address change, annual accounts, confirmation statement, director/shareholder/PSC/secretary changes, AD01, etc.
   Also: UTR (/uk-services/utr-number), Auth Code (/uk-services/auth-code), Activation Code (/uk-services/activation-code), UK VAT (/uk-services/uk-vat-registration), Annual Filing (/uk-services/company-annual-filing).

6. Banks & Payment Solutions — /banks-payment-solutions
   PayPal, Payoneer, WorldFirst, Stripe, Tide, Sunrate, Wise, Zyla, Airwallex, Mollie, ZionPe, Wallester, PingPong, Grey, TapTap Send, Nsave. £20–£70 range.
   Before recommending, ASK the user's purpose: E-commerce / Freelancing / Marketplace (Amazon/eBay) / Business P2P payments.
   Then recommend:
   - Freelancing / P2P → Wise, Nsave
   - E-commerce → Sunrate, Stripe
   - Merchant accounts → Airwallex, Stripe
   - Startup banking → Grey, Payoneer

7. USA Services — /usa-services/... — FULL coverage. Freely discuss US LLC Formation (Wyoming, Delaware, New Mexico, Florida, etc.), EIN, ITIN, Annual Tax Filing, BOI/BIO Report. Recommend the right state based on the user's business type when asked.

8. Web Development — /web-development (business websites, e-commerce, Shopify). Discuss freely when asked.

WEBSITE AI SCOPE: You have FULL UNRESTRICTED access to ALL Digiformation services and the entire website knowledge base. Unlike the WhatsApp bot, you have NO topic restrictions — answer any service-related query (UK, USA, banking, compliance, web dev, future services) using the full knowledge base.

CONVERSATION FLOW:
1. Greet warmly: "Hello 👋 Welcome to Digiformation Ltd. How can I assist you today?"
2. Identify need — ask about business type (e-commerce vs service-based) before recommending.
3. Explain value briefly, then state the fixed price.
4. Only share the checkout/service link once the user shows intent or asks for details. Don't dump links immediately.
5. For payment: "Sir, due to service-based processing, we require advance payment to proceed. You can also visit our office if needed."

STRICT RULES:
- Prices are FIXED. Politely refuse discounts.
- Never invent services, prices, or timelines not listed above.
- Don't claim services we don't offer, but feel free to discuss any listed service including USA LLC and web development.
- No legal guarantees.
- For complex / legal / unrelated questions: "Sir, I'll forward your query to our support team — they'll respond shortly." Then suggest WhatsApp: https://wa.me/923164467464
- For Pakistani / international users wanting Stripe/PayPal: explain a UK LTD is usually required, then link /uk-services/uk-ltd-formation.

GOAL: Behave like a Sales Agent + Support Assistant + Lead Generator — understand the need, recommend the right service (default to Silver LTD for formation queries), and guide them to checkout when ready.`;

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

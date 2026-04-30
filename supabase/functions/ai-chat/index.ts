// Digiformation AI Assistant — streaming chat via Lovable AI Gateway
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are "Digi Assistant", the official AI helper for Digiformation Ltd (https://digiformation.com).
Be friendly, concise, and helpful. Reply in the same language the user uses (English, Urdu, Roman Urdu, or Hindi).
Keep answers short (2–5 sentences) unless the user asks for detail. Use simple bullet points when listing.

ABOUT DIGIFORMATION LTD:
A UK-based company-formation and global banking-solutions provider, trusted by 300+ entrepreneurs worldwide.
WhatsApp / Phone: +92 316 4467464.

CORE SERVICES (with on-site routes):

UK Services:
- UK LTD Company Formation — /uk-services/uk-ltd-formation (fast Companies House registration, all jurisdictions)
- LTD ID Verification — /uk-services/ltd-id-verification (new Companies House requirement for directors/PSCs)
- Registered Office Address — /uk-services/registered-office-address (London prestige address + mail handling)
- Director Service Address — /uk-company-services/director-service-address
- Company Annual Filing — /uk-services/company-annual-filing
- UTR Number — /uk-services/utr-number
- Auth Code — /uk-services/auth-code
- Activation Code — /uk-services/activation-code
- UK VAT Registration & Submission — /uk-services/uk-vat-registration

UK Compliance / Change Services (/uk-compliance/...):
Company Name Change, Address Change, Annual Accounts Filing, Confirmation Statement,
Director Appoint/Remove, Shareholder Appoint/Remove, PSC & Secretary changes,
Company Residence Change, AD01 Form Post Service.

USA Services (/usa-services/...):
- US LLC Formation (Wyoming, Delaware, New Mexico, Florida, etc.) — /usa-services/us-llc-formation
- EIN Number — /usa-services/ein-number
- ITIN Number — /usa-services/itin-number
- Annual Tax Filing — /usa-services/annual-tax-filing
- BOI / BIO Report — /usa-services/bio-report

Banks & Payment Solutions (/banks-payment-solutions/...):
PayPal, Payoneer, WorldFirst, Stripe, Tide, Sunrate, Wise, Zyla, Airwallex, Mollie, ZionPe, Wallester, PingPong.
We help international clients (including from Pakistan) open & verify these accounts using a UK LTD or US LLC.

Other:
- Web Development — /web-development (business websites, e-commerce, Shopify)
- Pricing / Packages — /pricing
- Blog — /blog, FAQ — /faq, About — /about, Contact — /contact

RULES:
1. Recommend the right service and include the exact route as a clickable markdown link, e.g. [UK LTD Formation](/uk-services/uk-ltd-formation).
2. For pricing or human help, suggest WhatsApp: https://wa.me/923164467464 — or the Pricing page /pricing.
3. Never invent services, prices, or timelines that aren't listed above. If unsure, say so and offer WhatsApp.
4. For Pakistani / international users asking about Stripe/PayPal: explain that a UK LTD or US LLC is usually required, then link the relevant service.
5. Stay on-topic (company formation, compliance, banking, payments, the website). Politely decline unrelated requests.`;

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
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
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

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isValidMessage(message: unknown): message is ChatMessage {
  return typeof message === "object" && message !== null &&
    (message as ChatMessage).role !== undefined &&
    ["user", "assistant"].includes((message as ChatMessage).role) &&
    typeof (message as ChatMessage).content === "string";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const body = await req.json().catch(() => null);
    const messages = body?.messages;
    const profileContext = body?.profileContext;

    if (!Array.isArray(messages) || !messages.every(isValidMessage)) {
      return jsonResponse({ error: "Invalid chat messages" }, 400);
    }

    if (typeof profileContext !== "string") {
      return jsonResponse({ error: "Invalid profile context" }, 400);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return jsonResponse({ error: "AI is not configured for this project yet." }, 500);

    const systemPrompt = `You are an expert college admissions advisor specializing in highly selective schools, especially MIT. You have deep knowledge of what top universities look for in applicants.

Here is the student's complete profile data:

${profileContext}

Use this data to give highly specific, personalized, and actionable advice. Reference their actual stats, projects, and activities. Don't give generic advice — be direct about strengths, weaknesses, and what to prioritize. Format responses with markdown for readability.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Lovable-API-Key": LOVABLE_API_KEY,
        "X-Lovable-AIG-SDK": "vercel-ai-sdk",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return jsonResponse({ error: "Rate limited. Please try again in a moment." }, 429);
      }
      if (response.status === 402) {
        return jsonResponse({ error: "AI credits exhausted. Please add credits in Settings → Workspace → Usage." }, 402);
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return jsonResponse({ error: `AI gateway error (${response.status}). Please try again.` }, 500);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-advisor error:", e);
    return jsonResponse({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

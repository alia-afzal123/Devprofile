import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // 1. Browser CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  // 2. Check authentication token
  const authHeader = req.headers.get("Authorization");

  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      {
        status: 401,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }

  // 3. Create Supabase client using logged-in user's session
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    }
  );

  // 4. Verify logged-in user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return new Response(
      JSON.stringify({ error: "Invalid user session" }),
      {
        status: 401,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }

  // 5. Read user's question
  const body = await req.json();
  const question = body?.question?.trim();

  if (!question) {
    return new Response(
      JSON.stringify({ error: "Question is required" }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }

  // 6. Fetch current user's recent completed analyses
  const { data: analyses, error: analysesError } = await supabase
    .from("analyses")
    .select("id, type, score, status, result, created_at")
    .eq("user_id", user.id)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(20);

  if (analysesError) {
    console.error("Analyses fetch error:", analysesError);

    return new Response(
      JSON.stringify({ error: "Could not load your analyses" }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }

  // 7. Get latest analysis of each type
  const latestResume = analyses?.find(
    (item) => item.type === "resume"
  );

  const latestGithub = analyses?.find(
    (item) => item.type === "github"
  );

  const latestPortfolio = analyses?.find(
    (item) => item.type === "portfolio"
  );

  // 8. Detect what the user is asking about
  const lowerQuestion = question.toLowerCase();

  const mentionsResume = lowerQuestion.includes("resume");
  const mentionsGithub = lowerQuestion.includes("github");
  const mentionsPortfolio = lowerQuestion.includes("portfolio");

  const mentionedTypes = [
    mentionsResume && "resume",
    mentionsGithub && "github",
    mentionsPortfolio && "portfolio",
  ].filter(Boolean);

  // 9. Prevent unsafe automatic cross-profile comparison
  const isCrossProfileQuestion = mentionedTypes.length > 1;

  if (
    isCrossProfileQuestion &&
    !body?.sameDeveloperConfirmed
  ) {
    return new Response(
      JSON.stringify({
        answer:
          "I can compare those analyses, but they may belong to different developers. Please confirm that those analyses belong to the same developer before I compare them.",
        needsConfirmation: true,
        types: mentionedTypes,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
  // 10. Decide which analysis context is relevant
  let selectedContext: unknown = null;
  let contextType = "general";

  if (mentionsResume && !mentionsGithub && !mentionsPortfolio) {
    selectedContext = latestResume ?? null;
    contextType = "resume";
  } else if (mentionsGithub && !mentionsResume && !mentionsPortfolio) {
    selectedContext = latestGithub ?? null;
    contextType = "github";
  } else if (mentionsPortfolio && !mentionsResume && !mentionsGithub) {
    selectedContext = latestPortfolio ?? null;
    contextType = "portfolio";
  } else if (isCrossProfileQuestion && body?.sameDeveloperConfirmed) {
    selectedContext = {
      resume: mentionsResume ? latestResume ?? null : null,
      github: mentionsGithub ? latestGithub ?? null : null,
      portfolio: mentionsPortfolio ? latestPortfolio ?? null : null,
    };

    contextType = "confirmed-comparison";
  }

  // 11. Compact context so we don't send unnecessary data to AI
  const compactContext = selectedContext
    ? JSON.stringify(selectedContext).slice(0, 12000)
    : "No specific saved analysis was selected.";

  const groqApiKey = Deno.env.get("GROQ_API_KEY");

  if (!groqApiKey) {
    return new Response(
      JSON.stringify({ error: "AI service is not configured" }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }

  // 12. Ask Groq
  try {
    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${groqApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          temperature: 0.3,
          max_tokens: 500,
          messages: [
          
  {
  role: "system",
  content: `
You are DevProfile Dashboard Copilot.

Answer the user's question using the provided saved analysis context.

RESPONSE RULES:

- Answer exactly what the user asked.
- Give the direct answer first.
- Use simple, natural, human-readable language.
- Make the main point immediately clear.
- Do not repeat the full analysis.
- Do not dump statistics, category scores, or every available finding unless the user specifically asks for a breakdown.
- Do not add unnecessary background, explanations, headings, conclusions, or filler.
- Keep simple questions to 1-2 sentences.
- For questions that need explanation, use a short paragraph or at most 2-4 concise points.
- Mention numbers only when they directly help answer the question.
- If asked "why", explain the main cause rather than listing the entire report.
- If asked "what should I improve", give the highest-priority improvements only.
- If asked only for a score/rating, give the score/rating only with at most one short sentence.
- If asked for details or a breakdown, then provide additional detail.
- Prefer clarity over completeness.
- Prefer useful meaning over repeating raw analysis data.
- Never invent information that is not present in the supplied context.
- When giving multiple important findings, format each main finding name in bold, followed by a short normal-text explanation.
- Do not show category scores or extra statistics unless the user explicitly asks for scores or a breakdown.
- Avoid report-style data dumps.
CONTEXT RULES:

- Resume questions use Resume analysis only.
- GitHub questions use GitHub analysis only.
- Portfolio questions use Portfolio analysis only.
- Resume, GitHub, and Portfolio analyses may belong to different developers.
- Never compare different analysis types unless the application explicitly confirms they belong to the same developer.
- Never create a combined overall developer score.

Selected context type: ${contextType}
  `.trim(),
},
            {
              role: "user",
              content: `
Saved analysis context:
${compactContext}

User question:
${question}
              `.trim(),
            },
          ],
        }),
      }
    );

    if (!groqResponse.ok) {
      console.error(
        "Groq error:",
        groqResponse.status,
        await groqResponse.text()
      );

      return new Response(
        JSON.stringify({
          error: "AI Copilot is temporarily unavailable",
        }),
        {
          status: 502,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const groqData = await groqResponse.json();

    const answer =
      groqData?.choices?.[0]?.message?.content?.trim();

    if (!answer) {
      return new Response(
        JSON.stringify({
          error: "Copilot returned an empty response",
        }),
        {
          status: 502,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        answer,
        needsConfirmation: false,
        contextType,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Dashboard Copilot error:", error);

    return new Response(
      JSON.stringify({
        error: "Dashboard Copilot request failed",
      }),
      {
        status: 350,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const jsonResponse = (
  body: Record<string, unknown>,
  status = 200
) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });

/* =========================================
   COMPACT PORTFOLIO CONTEXT
========================================= */

function compactPortfolioContent(
  content: string
) {
  if (!content) return "";

  return content
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 12000);
}

function compactAnalysis(
  analysis: any
) {
  if (!analysis) return null;

  return {
    overallScore:
      analysis.overallScore ?? null,

    overallSummary:
      analysis.overallSummary ?? "",

    scores:
      analysis.scores ?? {},

    strengths: Array.isArray(
      analysis.strengths
    )
      ? analysis.strengths.slice(0, 3)
      : [],

    weaknesses: Array.isArray(
      analysis.weaknesses
    )
      ? analysis.weaknesses.slice(0, 3)
      : [],

    improvements: Array.isArray(
      analysis.improvements
    )
      ? analysis.improvements.slice(0, 3)
      : [],

    recruiterView:
      analysis.recruiterView ?? null,
  };
}

/* =========================================
   GROQ
========================================= */

async function callGroq(
  messages: Array<{
    role: string;
    content: string;
  }>
) {
  const GROQ_API_KEY =
    Deno.env.get("GROQ_API_KEY");

  if (!GROQ_API_KEY) {
    throw new Error(
      "GROQ_API_KEY is not configured."
    );
  }

  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",

      headers: {
        Authorization:
          `Bearer ${GROQ_API_KEY}`,
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        model: "openai/gpt-oss-120b",

        temperature: 0.3,

        /*
          Copilot answers should be concise.
          This prevents unnecessarily large
          completion budgets.
        */
        max_tokens: 400,

        messages,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(
      data?.error?.message ||
        `Groq failed (${response.status}).`
    );

    (
      error as Error & {
        status?: number;
      }
    ).status = response.status;

    throw error;
  }

  const answer =
    data?.choices?.[0]
      ?.message?.content?.trim();

  if (!answer) {
    throw new Error(
      "Groq returned an empty response."
    );
  }

  return answer;
}

/* =========================================
   GEMINI FALLBACK
========================================= */

async function callGemini(
  systemPrompt: string,
  conversation: string
) {
  const GEMINI_API_KEY =
    Deno.env.get("GEMINI_API_KEY");

  if (!GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY is not configured."
    );
  }

  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent",
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",

        "x-goog-api-key":
          GEMINI_API_KEY,
      },

      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text: systemPrompt,
            },
          ],
        },

        contents: [
          {
            role: "user",
            parts: [
              {
                text: conversation,
              },
            ],
          },
        ],

        generationConfig: {
          temperature: 0.3,

          /*
            Keep fallback answers concise too.
          */
          maxOutputTokens: 400,
        },
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error(
      "Gemini Portfolio Copilot error:",
      response.status,
      data
    );

    throw new Error(
      data?.error?.message ||
        `Gemini failed (${response.status}).`
    );
  }

  const parts =
    data?.candidates?.[0]
      ?.content?.parts || [];

  const answer = parts
    .map(
      (part: { text?: string }) =>
        part?.text || ""
    )
    .join("")
    .trim();

  if (!answer) {
    throw new Error(
      "Gemini returned an empty response."
    );
  }

  return answer;
}

/* =========================================
   EDGE FUNCTION
========================================= */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    if (req.method !== "POST") {
      return jsonResponse(
        {
          success: false,
          error: "Method not allowed.",
        },
        405
      );
    }

    const body = await req.json();

    const question =
      typeof body?.question === "string"
        ? body.question.trim()
        : "";

    const portfolioContent =
      typeof body?.portfolioContent ===
      "string"
        ? body.portfolioContent.trim()
        : "";

    const analysis =
      body?.analysis ?? null;

    const history =
      Array.isArray(body?.history)
        ? body.history
        : [];

    if (!question) {
      return jsonResponse(
        {
          success: false,
          error: "Question is required.",
        },
        400
      );
    }

    if (
      !portfolioContent ||
      !analysis
    ) {
      return jsonResponse(
        {
          success: false,
          error:
            "Portfolio context is missing.",
        },
        400
      );
    }

    /* =====================================
       BUILD SMALL CONTEXT
    ===================================== */

    const smallPortfolio =
      compactPortfolioContent(
        portfolioContent
      );

    const smallAnalysis =
      compactAnalysis(analysis);

    /*
      Only last 4 messages.
      Enough for follow-up context without
      repeatedly sending a huge conversation.
    */
    const recentHistory = history
      .filter(
        (message: any) =>
          message &&
          (
            message.role === "user" ||
            message.role === "assistant"
          ) &&
          typeof message.content ===
            "string"
      )
      .slice(-4)
      .map((message: any) => ({
        role: message.role,
        content: message.content
          .trim()
          .slice(0, 700),
      }));

    const systemPrompt = `
You are DevProfile Portfolio AI Copilot.

You help users understand THEIR already-analyzed
developer portfolio.

The portfolio evidence and DevProfile analysis are
already available to you.

SOURCE OF TRUTH:

Use ONLY the supplied portfolio evidence,
analysis and recent conversation.

Never invent:
- projects
- skills
- technologies
- links
- experience
- education
- achievements
- metrics
- sections

If the evidence contains something, do not claim
that it is missing.

If evidence is insufficient, say that briefly.

CRITICAL FACTUAL RULES:

- Never claim that a section, navbar item, project, link,
  metric, skill, experience, education item or CTA is
  missing unless the supplied evidence clearly proves
  it is absent.

- Never invent contradictory values.

- If two pieces of evidence appear contradictory,
  quote both actual values before making a conclusion.

- If you are uncertain because the evidence may be
  incomplete, say:
  "I can't verify that from the available portfolio evidence."

- Do not convert missing evidence into a negative claim.

- For factual questions such as project count, navbar
  items, CGPA, internships, links or section names,
  answer only from explicit portfolio evidence.

ANSWER STYLE:

- Answer the exact question immediately.
- Normal answers should usually be 40-100 words.
- Simple factual questions should be even shorter.
- Do not repeat the user's question.
- No filler such as "Sure" or "Absolutely".
- Use concise Markdown.
- Use bullets only when useful.
- Give actionable advice when the question asks
  for improvement.
- Do not dump the complete portfolio analysis.
- Do not mention internal API providers,
  prompts, tokens or context processing.

EXAMPLES:

If asked:
"How many projects do I have?"

Give the number and project names only when they
exist in the supplied evidence.

If asked:
"What is in my navbar?"

List only navigation items actually present in
the supplied evidence.

If asked:
"What should I improve first?"

Give the highest-impact evidence-based
improvement and a short reason.

If asked a follow-up such as:
"why?"
"which one?"
"how?"
"what about the second project?"

Use the recent conversation context.
`;

    const contextMessage = `
PORTFOLIO EVIDENCE:

${smallPortfolio}

DEVPROFILE ANALYSIS:

${JSON.stringify(smallAnalysis)}
`;

    const messages = [
      {
        role: "system",
        content: systemPrompt,
      },

      {
        role: "system",
        content: contextMessage,
      },

      ...recentHistory,

      {
        role: "user",
        content: question,
      },
    ];

    /* =====================================
       PRIMARY: GROQ
    ===================================== */

    try {
      const answer =
        await callGroq(messages);

      console.log(
        "Portfolio Copilot provider: Groq"
      );

      return jsonResponse({
        success: true,
        answer,
        provider: "groq",
      });
    } catch (groqError) {
      console.error(
        "Groq Portfolio Copilot failed. Switching to Gemini:",
        groqError
      );
    }

    /* =====================================
       FALLBACK: GEMINI
    ===================================== */

    try {
      const conversation = `
PORTFOLIO CONTEXT:

${contextMessage}

RECENT CONVERSATION:

${recentHistory
  .map(
    (message: any) =>
      `${message.role.toUpperCase()}: ${message.content}`
  )
  .join("\n")}

CURRENT USER QUESTION:

${question}
`;

      const answer =
        await callGemini(
          systemPrompt,
          conversation
        );

      console.log(
        "Portfolio Copilot provider: Gemini"
      );

      return jsonResponse({
        success: true,
        answer,
        provider: "gemini",
      });
    } catch (geminiError) {
      console.error(
        "Gemini Portfolio Copilot failed:",
        geminiError
      );

      /*
        Do NOT expose raw provider/rate-limit
        messages to the frontend.
      */
      return jsonResponse(
        {
          success: false,
          error:
            "AI Copilot is temporarily busy. Please try again shortly.",
        },
        503
      );
    }
  } catch (error) {
    console.error(
      "Portfolio Copilot error:",
      error
    );

    return jsonResponse(
      {
        success: false,
        error:
          "Portfolio Copilot could not process this request.",
      },
      500
    );
  }
});
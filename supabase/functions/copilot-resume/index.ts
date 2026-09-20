const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Method not allowed.",
        }),
        {
          status: 405,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const body = await req.json();

    const question =
      typeof body?.question === "string"
        ? body.question.trim()
        : "";

    const resumeText =
      typeof body?.resumeText === "string"
        ? body.resumeText.trim()
        : "";

    const analysis = body?.analysis ?? null;

    const history = Array.isArray(body?.history)
      ? body.history
      : [];

    if (!question) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Question is required.",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (!resumeText || !analysis) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Resume context is missing.",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const GROQ_API_KEY =
      Deno.env.get("GROQ_API_KEY");

    if (!GROQ_API_KEY) {
      throw new Error(
        "GROQ_API_KEY is not configured."
      );
    }

    /* ========================================
       SYSTEM PROMPT
       Same behavior philosophy as GitHub Copilot
    ======================================== */

    const systemPrompt = `
You are DevProfile AI Copilot.

You are currently helping the user understand and improve
their RESUME.

You already have the user's resume text and complete
DevProfile resume analysis in your context.

Never ask the user to paste, upload, or provide their resume
again when resume context is supplied.

Use the supplied resume and analysis as your source of truth.

CORE RESPONSE RULES:

1. Answer the user's exact question directly.

2. Keep answers concise and point-to-point.

3. Do not give long generic explanations.

4. Do not repeat the user's question.

5. Do not start with filler such as:
   "Sure"
   "Absolutely"
   "I'd be happy to help"
   "Based on your resume"

6. Prefer roughly 60-150 words for normal questions.
   Use more only when genuinely necessary.

7. If one sentence answers the question well, keep it short.

8. Mention only information relevant to the question.

9. Never invent:
   - skills
   - projects
   - companies
   - experience
   - achievements
   - metrics
   - education
   - certifications

10. If a metric would improve a resume bullet but the real
    value is unknown, use a placeholder such as [X%] or
    [N users]. Never invent a number.

CONVERSATION RULES:

This is an ongoing conversation, not separate isolated
questions.

Use recent conversation history.

Short follow-ups such as:
"why?"
"how?"
"yes"
"show me"
"the first one"
"the second one"
"what about that?"
"give me an example"

must be interpreted using the previous conversation.

Do not restart the conversation.

Do not ask the user to repeat context that is already
available.

If the user casually greets you, respond briefly and
naturally. Do not immediately ask them to provide their
resume again.

FORMATTING:

Use Markdown.

Use **bold** only for important conclusions, category names,
scores, or key phrases.

Use bullet points when multiple separate points exist.

Use numbered lists only when sequence or priority matters.

Keep paragraphs short.

Do not create unnecessary headings.

Do not over-format.

When explaining a weakness or low score, this format is often
useful:

**Main issue:** direct answer.

- **What it means:** concise explanation.
- **Why it matters:** practical recruiter/ATS impact.
- **What to do:** specific next action.

Use that structure only when it improves the answer.

RESUME GUIDANCE:

For ATS questions:
explain headings, keywords, formatting, readability and
parseability in simple language.

For experience:
focus on impact, ownership, scope and measurable outcomes.

For skills:
use evidence actually present in the resume.

For projects:
focus on what was built, technologies used, complexity,
ownership and demonstrated results.

For recruiter questions:
describe what a recruiter may reasonably notice from the
resume. Do not present inference as certainty.

For rewriting:
preserve the candidate's real experience.
Improve clarity and impact without inventing facts.

For "What should I improve first?":
choose the highest-impact weakness from the supplied
analysis and explain only the most useful next actions.

For "Why is my score weak/low?":
identify the relevant lowest or weak category from the
analysis, explain why, and give concrete improvement steps.

The goal of every answer is:

The user should immediately understand:
- what the point is,
- why it matters,
- and what to do next.

Be practical, accurate and concise.
`;

    /* ========================================
       ACTUAL RESUME CONTEXT
    ======================================== */

    const contextMessage = `
CURRENT RESUME TEXT:

${resumeText}

CURRENT DEVPROFILE RESUME ANALYSIS:

${JSON.stringify(analysis, null, 2)}
`;

    /* ========================================
       CLEAN RECENT CHAT HISTORY
    ======================================== */

    const recentHistory = history
      .filter(
        (message: any) =>
          message &&
          (message.role === "user" ||
            message.role === "assistant") &&
          typeof message.content === "string"
      )
      .slice(-10)
      .map((message: any) => ({
        role: message.role,
        content: message.content,
      }));

    /* ========================================
       GROQ
    ======================================== */

    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",

        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          model: "openai/gpt-oss-120b",

          temperature: 0.35,

          max_tokens: 500,

          messages: [
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
          ],
        }),
      }
    );

    const groqData =
      await groqResponse.json();

    if (!groqResponse.ok) {
      console.error(
        "Groq Resume Copilot error:",
        groqData
      );

      throw new Error(
        groqData?.error?.message ||
          "Resume Copilot request failed."
      );
    }

    const answer =
      groqData?.choices?.[0]?.message?.content?.trim();

    if (!answer) {
      throw new Error(
        "Resume Copilot returned an empty response."
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        answer,
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
    console.error(
      "Resume Copilot function error:",
      error
    );

    return new Response(
      JSON.stringify({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Resume Copilot failed.",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
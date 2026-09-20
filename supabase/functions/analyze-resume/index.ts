const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
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

    const { resumeText, fileName } = await req.json();

    if (
      typeof resumeText !== "string" ||
      resumeText.trim().length < 100
    ) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Readable resume text is required.",
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

    const groqApiKey = Deno.env.get("GROQ_API_KEY");

    if (!groqApiKey) {
      throw new Error("GROQ_API_KEY is not configured.");
    }
const prompt = `
You are analyzing a developer's resume for a normal job seeker.

Your job is to create a SHORT, clear and actionable resume report.

IMPORTANT:
- Use simple English.
- Keep the entire analysis concise.
- Base everything ONLY on evidence in the resume.
- Never invent skills, numbers, achievements, users, percentages,
  technologies, experience, education, certifications or results.
- If measurable results are missing, say so.
- Never create fake metrics as examples of the user's achievements.
- Avoid complicated recruiter jargon.
- If you use ATS, explain it as hiring software.
- Do not repeat the same problem in multiple sections.
- Return ONLY valid JSON.
- No markdown.
- No text outside JSON.

Return exactly:

{
  "overallScore": 0,
  "overallSummary": "...",

  "scores": {
    "atsReadability": {
      "score": 0,
      "label": "ATS Compatibility",
      "explanation": "..."
    },
    "structure": {
      "score": 0,
      "label": "Organization",
      "explanation": "..."
    },
    "skillsKeywords": {
      "score": 0,
      "label": "Skills & Keywords",
      "explanation": "..."
    },
    "experienceImpact": {
      "score": 0,
      "label": "Experience Impact",
      "explanation": "..."
    },
    "clarity": {
      "score": 0,
      "label": "Clarity",
      "explanation": "..."
    }
  },

  "strengths": [
    {
      "title": "...",
      "explanation": "..."
    }
  ],

  "weaknesses": [
    {
      "title": "...",
      "explanation": "..."
    }
  ],

  "improvements": [
    {
      "title": "...",
      "action": "...",
      "priority": "High"
    }
  ],

  "recruiterView": {
    "likelyRole": "...",
    "strongestSignal": "...",
    "biggestConcern": "...",
    "recruiterConfidence": 0
  }
}

STRICT LENGTH RULES:

overallSummary:
- Maximum 18 words.
- Give the single biggest takeaway.

Each score explanation:
- Maximum 12 words.
- Explain what this score means for THIS resume.

strengths:
- EXACTLY 3 items.
- title maximum 5 words.
- explanation maximum 12 words.

weaknesses:
- EXACTLY 3 items.
- title maximum 5 words.
- explanation maximum 14 words.

improvements:
- EXACTLY 3 items.
- title maximum 5 words.
- action maximum 18 words.
- priority must be High, Medium or Low.
- Order improvements by importance.

recruiterView:
- likelyRole maximum 8 words.
- strongestSignal maximum 15 words.
- biggestConcern maximum 15 words.
- recruiterConfidence must be 0-100.

SCORING:

ATS Compatibility:
How easily hiring software can read and understand the resume.

Organization:
How logically and consistently the resume is structured.

Skills & Keywords:
How clearly relevant skills are presented and supported.

Experience Impact:
How strongly experience and projects demonstrate real contribution
and results.

Clarity:
How quickly a recruiter can understand the resume.

IMPORTANT EVIDENCE RULE:

Only recommend a specific technology if that technology actually appears
somewhere in the resume.

If results or metrics are missing, say:
"Add real results where available."

Do NOT invent an example result and present it as fact.

RESUME FILE:
${fileName || "resume"}

RESUME TEXT:
${resumeText}
`;

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
          temperature: 0.2,
          response_format: {
            type: "json_object",
          },
          messages: [
            {
              role: "system",
              content:
                "You are an expert technical recruiter and resume analyst.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
        }),
      }
    );

    if (!groqResponse.ok) {
      const details = await groqResponse.text();

      console.error("Groq error:", details);

      throw new Error(
        `AI analysis failed (${groqResponse.status}).`
      );
    }

    const groqData = await groqResponse.json();

    const content =
      groqData?.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("AI returned an empty response.");
    }

    let analysis;

    try {
      analysis = JSON.parse(content);
    } catch {
      console.error("Invalid Groq JSON:", content);
      throw new Error("AI returned invalid analysis data.");
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis,
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
    console.error("Resume analyzer error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Resume analysis failed.",
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
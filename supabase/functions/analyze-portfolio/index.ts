const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

type RenderedLink = {
  text: string;
  href: string;
  kind: string;
};

type RenderedSection = {
  id: string;
  tag: string;
  label: string;
  text: string;
};

type RenderedPortfolio = {
  url: string;
  title: string;
  description: string;
  navbar: string[];
  headings: string[];
  buttons: string[];
  sections: RenderedSection[];
  links: RenderedLink[];
  visibleText: string;
};

function isPrivateHostname(hostname: string) {
  const host = hostname.toLowerCase();
  if (host === "localhost" || host === "0.0.0.0" || host === "::1") return true;
  if (/^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host)) return true;
  const m = host.match(/^172\.(\d+)\./);
  if (m && Number(m[1]) >= 16 && Number(m[1]) <= 31) return true;
  return false;
}

function cleanAIJson(text: string) {
  let cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("No complete JSON object found.");
  }
  cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  const parsed = JSON.parse(cleaned);
  if (
    !parsed ||
    typeof parsed !== "object" ||
    typeof parsed.overallScore !== "number" ||
    !parsed.scores ||
    !parsed.recruiterView
  ) {
    throw new Error("AI response JSON has an invalid structure.");
  }
  return { cleaned, parsed };
}

function decodeHtml(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));
}

function htmlToText(value: string) {
  return decodeHtml(
    value
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
      .replace(/<!--([\s\S]*?)-->/g, " ")
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/\s+/g, " ")
    .trim();
}

function getAttribute(tag: string, name: string) {
  const pattern = new RegExp(
    `\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,
    "i",
  );
  const match = tag.match(pattern);
  return decodeHtml(match?.[1] || match?.[2] || match?.[3] || "");
}

function uniqueStrings(values: string[], limit: number) {
  return [...new Set(values.map((v) => v.replace(/\s+/g, " ").trim()).filter(Boolean))].slice(0, limit);
}

function extractAnchors(fragment: string, baseUrl: string): RenderedLink[] {
  const results: RenderedLink[] = [];
  const regex = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(fragment))) {
    const tag = `<a ${match[1]}>`;
    const rawHref = getAttribute(tag, "href");
    if (!rawHref) continue;

    let href = rawHref;
    try {
      href = new URL(rawHref, baseUrl).toString();
    } catch {
      // Keep the original href if URL resolution fails.
    }

    const text = htmlToText(match[2]) || getAttribute(tag, "aria-label") || getAttribute(tag, "title");
    const value = `${href} ${text}`.toLowerCase();

    let kind = "other";
    if (value.includes("github.com")) kind = "github";
    else if (value.includes("linkedin.com")) kind = "linkedin";
    else if (value.includes("resume") || value.includes("cv") || /\.pdf([?#]|$)/i.test(href)) kind = "resume";
    else if (href.toLowerCase().startsWith("mailto:")) kind = "email";
    else if (href.toLowerCase().startsWith("tel:")) kind = "phone";
    else if (value.includes("demo") || value.includes("live") || value.includes("vercel.app") || value.includes("netlify.app")) kind = "live-demo";
    else {
      try {
        kind = new URL(href).origin === new URL(baseUrl).origin ? "internal" : "external";
      } catch {
        kind = "other";
      }
    }

    results.push({ text, href, kind });
  }

  return results.filter(
    (item, index, arr) =>
      arr.findIndex((other) => other.href === item.href && other.text === item.text) === index,
  ).slice(0, 160);
}

function extractRenderedPortfolio(html: string, requestedUrl: string): RenderedPortfolio {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? htmlToText(titleMatch[1]) : "";

  const metaDescription =
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["'][^>]*>/i)?.[1] ||
    html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["'][^>]*>/i)?.[1] ||
    "";

  const canonical = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/i)?.[1] || "";
  let finalUrl = requestedUrl;
  try {
    if (canonical) finalUrl = new URL(canonical, requestedUrl).toString();
  } catch {
    finalUrl = requestedUrl;
  }

  const navFragments: string[] = [];
  const navRegex = /<(nav|header)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let navMatch: RegExpExecArray | null;
  while ((navMatch = navRegex.exec(html))) navFragments.push(navMatch[2]);

  const navLinks = extractAnchors(navFragments.join("\n"), finalUrl);
  const navbar = uniqueStrings(navLinks.map((link) => link.text), 40);

  const headings: string[] = [];
  const headingRegex = /<h[1-4]\b[^>]*>([\s\S]*?)<\/h[1-4]>/gi;
  let headingMatch: RegExpExecArray | null;
  while ((headingMatch = headingRegex.exec(html))) headings.push(htmlToText(headingMatch[1]));

  const buttons: string[] = [];
  const buttonRegex = /<button\b[^>]*>([\s\S]*?)<\/button>/gi;
  let buttonMatch: RegExpExecArray | null;
  while ((buttonMatch = buttonRegex.exec(html))) buttons.push(htmlToText(buttonMatch[1]));
  buttons.push(...navLinks.map((link) => link.text));

  const sections: RenderedSection[] = [];
  const sectionRegex = /<(section|article)\b([^>]*)>([\s\S]*?)<\/\1>/gi;
  let sectionMatch: RegExpExecArray | null;
  let sectionIndex = 0;

  while ((sectionMatch = sectionRegex.exec(html))) {
    sectionIndex += 1;
    const openTag = `<${sectionMatch[1]} ${sectionMatch[2]}>`;
    const content = sectionMatch[3];
    const text = htmlToText(content).slice(0, 4500);
    if (text.length < 20) continue;

    const id = getAttribute(openTag, "id") || getAttribute(openTag, "data-section") || `section-${sectionIndex}`;
    const heading = content.match(/<h[1-4]\b[^>]*>([\s\S]*?)<\/h[1-4]>/i);
    const label = heading ? htmlToText(heading[1]) : id;
    sections.push({ id, tag: sectionMatch[1].toLowerCase(), label, text });
    if (sections.length >= 35) break;
  }

  // Many React portfolios use divs instead of semantic <section> elements.
  // Add navbar hash targets as factual section evidence when those target IDs exist.
  for (const link of navLinks) {
    try {
      const parsed = new URL(link.href, finalUrl);
      const hash = decodeURIComponent(parsed.hash.replace(/^#/, ""));
      if (!hash || sections.some((section) => section.id === hash)) continue;

      const escaped = hash.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const targetRegex = new RegExp(
        `<([a-z0-9-]+)\\b([^>]*\\bid=["']${escaped}["'][^>]*)>([\\s\\S]*?)<\\/\\1>`,
        "i",
      );
      const target = html.match(targetRegex);
      const text = target ? htmlToText(target[3]).slice(0, 4500) : "";
      sections.push({
        id: hash,
        tag: target?.[1]?.toLowerCase() || "anchor-target",
        label: link.text || hash,
        text: text || `Navigation target detected: ${link.text || hash}`,
      });
    } catch {
      // Ignore malformed hrefs.
    }
  }

  const links = extractAnchors(html, finalUrl);
  const visibleText = htmlToText(html).slice(0, 40000);

  return {
    url: finalUrl,
    title,
    description: decodeHtml(metaDescription),
    navbar,
    headings: uniqueStrings(headings, 100),
    buttons: uniqueStrings(buttons, 70),
    sections: sections.slice(0, 40),
    links,
    visibleText,
  };
}

async function renderPortfolio(url: string): Promise<RenderedPortfolio> {
  const token = Deno.env.get("BROWSERLESS_API_KEY");
  if (!token) throw new Error("BROWSERLESS_API_KEY is not configured.");

  // Browserless Content API returns HTML after JavaScript has rendered.
  // Official endpoint shape: POST /content?token=... with { url } JSON body.
  const endpoint = `https://production-sfo.browserless.io/content?token=${encodeURIComponent(token)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      },
      body: JSON.stringify({ url }),
      signal: controller.signal,
    });

    const html = await response.text();

    if (!response.ok) {
      console.error("Browserless error:", response.status, html.slice(0, 1500));
      throw new Error(`Rendered portfolio request failed (${response.status}).`);
    }

    if (!html || html.trim().length < 100) {
      throw new Error("Browserless returned empty rendered HTML.");
    }

    const rendered = extractRenderedPortfolio(html, url);

    if (!rendered.visibleText || rendered.visibleText.length < 80) {
      console.error("Rendered HTML was received but contained too little readable content.");
      throw new Error("Rendered portfolio content could not be extracted.");
    }

    console.log("Browserless rendered portfolio successfully:", {
      title: rendered.title,
      navbar: rendered.navbar,
      sections: rendered.sections.map((section) => section.id),
      links: rendered.links.length,
    });

    return rendered;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Portfolio rendering timed out. Please try again.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function callGroq(systemPrompt: string, userPrompt: string) {
  const key = Deno.env.get("GROQ_API_KEY");
  if (!key) throw new Error("GROQ_API_KEY is not configured.");

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "openai/gpt-oss-120b",
      temperature: 0.1,
      max_tokens: 1600,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || `Groq failed with ${response.status}`);
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("Groq returned an empty response.");
  return text as string;
}

async function callGemini(systemPrompt: string, userPrompt: string) {
  const key = Deno.env.get("GEMINI_API_KEY");
  if (!key) throw new Error("GEMINI_API_KEY is not configured.");

  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: { temperature: 0.15, maxOutputTokens: 1800, responseMimeType: "application/json" },
      }),
    },
  );

  const data = await response.json();
  if (!response.ok) {
    console.error("Gemini error:", data);
    throw new Error(data?.error?.message || `Gemini failed with ${response.status}`);
  }
  const text = (data?.candidates?.[0]?.content?.parts || []).map((p: { text?: string }) => p.text || "").join("").trim();
  if (!text) throw new Error("Gemini returned an empty response.");
  return text;
}

async function callAI(systemPrompt: string, userPrompt: string) {
  try {
    const text = await callGroq(systemPrompt, userPrompt);
    try {
      const valid = cleanAIJson(text);
      console.log("Portfolio AI provider: Groq");
      return { text: valid.cleaned, parsed: valid.parsed, provider: "groq" };
    } catch (error) {
      console.error("Groq returned invalid JSON. Switching to Gemini:", error);
    }
  } catch (error) {
    console.error("Groq failed. Switching to Gemini:", error);
  }

  // First Gemini attempt.
  try {
    const text = await callGemini(systemPrompt, userPrompt);
    const valid = cleanAIJson(text);
    console.log("Portfolio AI provider: Gemini");
    return { text: valid.cleaned, parsed: valid.parsed, provider: "gemini" };
  } catch (error) {
    console.error("Gemini first attempt failed/invalid. Retrying once:", error);
  }

  // Controlled server-side retry so the user should not need to click Analyze repeatedly.
  const retryPrompt = `${userPrompt}\n\nIMPORTANT RETRY: Return one COMPLETE valid JSON object only. Do not truncate the response. Keep explanations concise.`;
  const retryText = await callGemini(systemPrompt, retryPrompt);
  const valid = cleanAIJson(retryText);
  console.log("Portfolio AI provider: Gemini retry");
  return { text: valid.cleaned, parsed: valid.parsed, provider: "gemini-retry" };
}

function buildEvidence(rendered: RenderedPortfolio) {
  const evidence = {
    source: "rendered-browser-dom",
    url: rendered.url,
    title: rendered.title,
    metaDescription: rendered.description,
    navbar: rendered.navbar,
    headings: rendered.headings,
    buttonsAndCTAs: rendered.buttons,
    sections: rendered.sections,
    links: rendered.links,
    visibleText: rendered.visibleText,
    factualChecks: {
      hasNavbar: rendered.navbar.length > 0,
      sectionCount: rendered.sections.length,
      hasGithub: rendered.links.some((l) => l.kind === "github"),
      hasLinkedIn: rendered.links.some((l) => l.kind === "linkedin"),
      hasResume: rendered.links.some((l) => l.kind === "resume"),
      hasEmail: rendered.links.some((l) => l.kind === "email"),
      liveDemoLinkCount: rendered.links.filter((l) => l.kind === "live-demo").length,
    },
  };

  return JSON.stringify(evidence, null, 2).slice(0, 36000);
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function calculateDeterministicScores(rendered: RenderedPortfolio) {
  const text = rendered.visibleText.toLowerCase();

  const hasGithub = rendered.links.some(
    (link) => link.kind === "github"
  );

  const hasLinkedIn = rendered.links.some(
    (link) => link.kind === "linkedin"
  );

  const hasResume = rendered.links.some(
    (link) => link.kind === "resume"
  );

  const hasEmail = rendered.links.some(
    (link) => link.kind === "email"
  );

  const hasPhone = rendered.links.some(
    (link) => link.kind === "phone"
  );

  const liveDemoCount = rendered.links.filter(
    (link) => link.kind === "live-demo"
  ).length;

  const githubCount = rendered.links.filter(
    (link) => link.kind === "github"
  ).length;

  const hasNavbar =
    rendered.navbar.length >= 3;

  const hasProjects =
    rendered.headings.some((heading) =>
      /project|work|built|portfolio/i.test(heading)
    ) ||
    rendered.sections.some((section) =>
      /project|work|built|portfolio/i.test(
        `${section.id} ${section.label}`
      )
    );

  const hasSkills =
    rendered.headings.some((heading) =>
      /skill|technolog|stack|expertise/i.test(heading)
    ) ||
    rendered.sections.some((section) =>
      /skill|technolog|stack|expertise/i.test(
        `${section.id} ${section.label}`
      )
    );

  const hasExperience =
    rendered.headings.some((heading) =>
      /experience|internship|career|work history/i.test(heading)
    ) ||
    rendered.sections.some((section) =>
      /experience|internship|career/i.test(
        `${section.id} ${section.label}`
      )
    );

  const hasContact =
    rendered.headings.some((heading) =>
      /contact|hire|get in touch/i.test(heading)
    ) ||
    rendered.sections.some((section) =>
      /contact|hire|get in touch/i.test(
        `${section.id} ${section.label}`
      )
    ) ||
    hasEmail;

  const hasRole =
    /developer|engineer|designer|data scientist|software|full stack|frontend|backend|ai developer/.test(
      text.slice(0, 5000)
    );

  const hasTechEvidence =
    /react|angular|vue|next\.?js|javascript|typescript|python|fastapi|node|express|django|flask|postgres|mysql|mongodb|supabase|firebase|langchain|tensorflow|pytorch|docker|aws|azure/.test(
      text
    );

  /*
    We intentionally do NOT attempt to guess exact
    project counts from arbitrary text.

    Repository/live-demo evidence contributes to
    project credibility without inventing facts.
  */

  let professionalClarity = 35;

  if (rendered.title) professionalClarity += 10;
  if (rendered.description) professionalClarity += 10;
  if (hasRole) professionalClarity += 20;
  if (hasEmail || hasPhone) professionalClarity += 10;
  if (hasLinkedIn || hasGithub) professionalClarity += 10;

  professionalClarity =
    clampScore(professionalClarity);

  let projectEvidence = 25;

  if (hasProjects) projectEvidence += 25;
  if (githubCount > 0) projectEvidence += 15;
  if (githubCount >= 3) projectEvidence += 10;
  if (liveDemoCount > 0) projectEvidence += 15;
  if (liveDemoCount >= 2) projectEvidence += 5;

  projectEvidence =
    clampScore(projectEvidence);

  let technicalCredibility = 30;

  if (hasSkills) technicalCredibility += 20;
  if (hasTechEvidence) technicalCredibility += 20;
  if (hasExperience) technicalCredibility += 15;
  if (hasGithub) technicalCredibility += 10;

  technicalCredibility =
    clampScore(technicalCredibility);

  let structureExperience = 30;

  if (hasNavbar) structureExperience += 20;

  const meaningfulSections = [
    hasProjects,
    hasSkills,
    hasExperience,
    hasContact,
  ].filter(Boolean).length;

  structureExperience +=
    meaningfulSections * 10;

  if (rendered.sections.length >= 4) {
    structureExperience += 10;
  }

  structureExperience =
    clampScore(structureExperience);

  let recruiterReadiness = 25;

  if (hasResume) recruiterReadiness += 15;
  if (hasEmail) recruiterReadiness += 10;
  if (hasPhone) recruiterReadiness += 5;
  if (hasLinkedIn) recruiterReadiness += 10;
  if (hasGithub) recruiterReadiness += 10;
  if (hasProjects) recruiterReadiness += 10;
  if (hasExperience) recruiterReadiness += 10;
  if (hasContact) recruiterReadiness += 5;

  recruiterReadiness =
    clampScore(recruiterReadiness);

  /*
    Fixed weighted formula.
    Same extracted evidence = same score.
  */

  const overallScore = clampScore(
    professionalClarity * 0.20 +
    projectEvidence * 0.25 +
    technicalCredibility * 0.20 +
    structureExperience * 0.15 +
    recruiterReadiness * 0.20
  );

  return {
    overallScore,

    professionalClarity,
    projectEvidence,
    technicalCredibility,
    structureExperience,
    recruiterReadiness,
  };
}
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (req.method !== "POST") return jsonResponse({ success: false, error: "Method not allowed." }, 405);

    const body = await req.json();
    const rawUrl = typeof body?.url === "string" ? body.url.trim() : "";
    if (!rawUrl) return jsonResponse({ success: false, error: "Portfolio URL is required." }, 400);

    let portfolioUrl: URL;
    try {
      portfolioUrl = new URL(/^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`);
    } catch {
      return jsonResponse({ success: false, error: "Please enter a valid portfolio URL." }, 400);
    }

    if (!["http:", "https:"].includes(portfolioUrl.protocol)) {
      return jsonResponse({ success: false, error: "Only public HTTP/HTTPS portfolio URLs are supported." }, 400);
    }
    if (isPrivateHostname(portfolioUrl.hostname)) {
      return jsonResponse({ success: false, error: "Only publicly accessible portfolio URLs are supported." }, 400);
    }

    console.log("Rendering portfolio with Browserless:", portfolioUrl.toString());
    const rendered = await renderPortfolio(portfolioUrl.toString());
    const portfolioEvidence = buildEvidence(rendered);

    if (rendered.visibleText.trim().length < 80) {
      throw new Error("Not enough visible portfolio content could be extracted.");
    }

    const systemPrompt = `
You are DevProfile Portfolio Intelligence.

Analyze a developer's PUBLIC PERSONAL PORTFOLIO using ONLY the supplied structured evidence extracted from a REAL RENDERED BROWSER DOM.

IMPORTANT SOURCE-OF-TRUTH RULES:
- The structured fields navbar, sections, links, buttonsAndCTAs and factualChecks are factual browser observations.
- NEVER claim that a navbar, section, resume, GitHub link, LinkedIn link, contact method, CTA, project link or other item is missing when the structured evidence shows it exists.
- A single-page website can contain many sections. Do NOT confuse page/route count with section count.
- Anchor navigation such as #about, #skills, #projects, #experience and #contact represents sections on the same page, not separate pages.
- Evaluate the QUALITY of existing content separately from whether it EXISTS.
- Never invent projects, skills, experience, education, links, metrics or achievements.
- If evidence is insufficient for a claim, say that the evidence is insufficient instead of asserting absence.
- Do not make unsupported claims about responsiveness, animations, visual polish or mobile behavior because this analysis is based primarily on DOM/content evidence.

Evaluate from 0 to 100:
1. professionalClarity
2. projectEvidence
3. technicalCredibility
4. structureExperience
5. recruiterReadiness

SCORING:

- Category scores and overallScore are calculated
  deterministically by DevProfile.
- Your numeric scores will be overwritten by the
  deterministic scoring engine.
- Focus on writing accurate evidence-based explanations.
- Never change your factual assessment just to justify
  a numeric score.
- Do not invent evidence.

WRITING:
- Simple professional English.
- Concise, specific, evidence-based.
- Avoid generic repeated advice when the evidence supports more specific feedback.
- Improvements must be actionable and prioritized.
- Recruiter View is an evidence-based interpretation, not a guaranteed recruiter reaction.

Return ONLY one complete valid JSON object with exactly this structure:
{
  "overallScore": 0,
  "overallSummary": "",
  "scores": {
    "professionalClarity": { "label": "Professional Clarity", "score": 0, "explanation": "" },
    "projectEvidence": { "label": "Project Evidence", "score": 0, "explanation": "" },
    "technicalCredibility": { "label": "Technical Credibility", "score": 0, "explanation": "" },
    "structureExperience": { "label": "Structure & Experience", "score": 0, "explanation": "" },
    "recruiterReadiness": { "label": "Recruiter Readiness", "score": 0, "explanation": "" }
  },
  "strengths": [{ "title": "", "explanation": "" }],
  "weaknesses": [{ "title": "", "explanation": "", "whyItMatters": "" }],
  "improvements": [{ "title": "", "action": "", "priority": "High" }],
  "recruiterView": {
    "likelyRole": "",
    "strongestSignal": "",
    "biggestConcern": "",
    "missingProof": "",
    "recruiterConfidence": 0
  }
}`;

    const userPrompt = `
Analyze this deployed developer portfolio.

PORTFOLIO URL:
${rendered.url}

RENDERED WEBSITE EVIDENCE:
${portfolioEvidence}
`;

const aiResult =
  await callAI(systemPrompt, userPrompt);

const analysis =
  aiResult.parsed;

const deterministicScores =
  calculateDeterministicScores(rendered);

/*
  AI writes explanations.
  DevProfile owns every numeric score.
*/

analysis.overallScore =
  deterministicScores.overallScore;

if (analysis.scores?.professionalClarity) {
  analysis.scores.professionalClarity.score =
    deterministicScores.professionalClarity;
}

if (analysis.scores?.projectEvidence) {
  analysis.scores.projectEvidence.score =
    deterministicScores.projectEvidence;
}

if (analysis.scores?.technicalCredibility) {
  analysis.scores.technicalCredibility.score =
    deterministicScores.technicalCredibility;
}

if (analysis.scores?.structureExperience) {
  analysis.scores.structureExperience.score =
    deterministicScores.structureExperience;
}

if (analysis.scores?.recruiterReadiness) {
  analysis.scores.recruiterReadiness.score =
    deterministicScores.recruiterReadiness;
}

/*
  Recruiter confidence is also numeric,
  so don't leave it random.
*/

if (analysis.recruiterView) {
  analysis.recruiterView.recruiterConfidence =
    deterministicScores.recruiterReadiness;
}

console.log(
  "Deterministic portfolio scores:",
  deterministicScores
);

    return jsonResponse({
      success: true,
      portfolio: {
        url: rendered.url,
        title: rendered.title,
        pagesAnalyzed: [{ url: rendered.url, title: rendered.title }],
        content: portfolioEvidence,
        evidence: {
          navbar: rendered.navbar,
          headings: rendered.headings,
          buttons: rendered.buttons,
          sections: rendered.sections.map((s) => ({ id: s.id, label: s.label })),
          links: rendered.links,
        },
      },
      analysis,
      provider: aiResult.provider,
    });
  } catch (error) {
    console.error("Portfolio analysis error:", error);
    return jsonResponse(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unable to analyze portfolio.",
      },
      500,
    );
  }
});

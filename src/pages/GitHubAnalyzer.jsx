import { useState } from "react";
import ReactMarkdown from "react-markdown";
import githubIcon from "../assets/icons/github-icon.png";
import { supabase } from "../lib/supabase";
import { saveAnalysis } from "../services/analysisService";
import "./GitHubAnalyzer.css";

const githubChecks = [
  {
    id: "01",
    title: "Activity Rhythm",
    description: "Recent development activity",
    scoreKey: "activityRhythm",
  },
  {
    id: "02",
    title: "Repository Quality",
    description: "Original repos & project signals",
    scoreKey: "repositoryQuality",
  },
  {
    id: "03",
    title: "Documentation",
    description: "README, descriptions & metadata",
    scoreKey: "documentation",
  },
  {
    id: "04",
    title: "Project Depth",
    description: "Technical diversity & originality",
    scoreKey: "projectDepth",
  },
  {
    id: "05",
    title: "Profile Completeness",
    description: "Professional GitHub presence",
    scoreKey: "profileCompleteness",
  },
];

const signalCards = [
  {
    type: "chart",
    title: "Recruiter Signal Extraction",
    description:
      "Surfaces meaningful public repository and developer signals.",
  },
  {
    type: "bolt",
    title: "Development Activity",
    description:
      "Measures recent activity and public development consistency.",
  },
  {
    type: "shield",
    title: "Documentation Intelligence",
    description:
      "Evaluates README coverage, repository metadata, and project clarity.",
  },
];

function SignalIcon({ type }) {
  if (type === "chart") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 19h16M6 16v-4M11 16V8M16 16V5" />
      </svg>
    );
  }

  if (type === "bolt") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m13 2-7 11h6l-1 9 7-12h-6l1-8Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3 5 6v5c0 4.6 2.8 8 7 10 4.2-2 7-5.4 7-10V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function GitHubAnalyzer() {
  const [githubInput, setGithubInput] = useState("");

  const [githubData, setGithubData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [copilotQuestion, setCopilotQuestion] = useState("");
 const [copilotMessages, setCopilotMessages] = useState([]);
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotError, setCopilotError] = useState("");

  const handleAnalyze = async (event) => {
    event.preventDefault();

    const cleanInput = githubInput.trim();

    if (!cleanInput || loading) return;

    setGithubData(null);
    setErrorMessage("");

    setCopilotQuestion("");
    setCopilotMessages([]);
    setCopilotError("");

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        "analyze-github",
        {
          body: {
            username: cleanInput,
          },
        }
      );

      if (error) {
        let message = "GitHub analysis failed.";

        try {
          const details = await error.context?.json();

          if (details?.error) {
            message = details.error;
          }
        } catch {
          // keep fallback
        }

        throw new Error(message);
      }

      if (!data?.success || !data?.analysis || !data?.profile) {
        throw new Error(
          data?.error || "GitHub analysis returned an invalid result."
        );
      }

      setGithubData(data);

      try {
        await saveAnalysis({
          type: "github",
          score: data.analysis.overallScore,
          input: {
            username: data.profile.login || cleanInput,
            profileUrl: data.profile.profileUrl || null,
          },
          result: data,
          status: "completed",
        });
      } catch (saveError) {
        console.error("Could not save GitHub analysis:", saveError);

        setErrorMessage(
          "Analysis completed, but it could not be saved to History."
        );
      }
    } catch (error) {
      console.error("GitHub analysis failed:", error);

      setGithubData(null);

      setErrorMessage(
        error?.message || "Unable to analyze this GitHub profile."
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePopularProfile = (username) => {
    setGithubInput(username);
    setGithubData(null);
    setErrorMessage("");

    setCopilotQuestion("");
    setCopilotMessages([]);
    setCopilotError("");
  };

  const handleAskCopilot = async () => {
  const question = copilotQuestion.trim();

  if (!question || !githubData || copilotLoading) return;

  const userMessage = {
    role: "user",
    content: question,
  };

  const previousMessages = copilotMessages;

  // User ka message immediately chat mein show karo.
  setCopilotMessages((prev) => [...prev, userMessage]);

  // Input immediately clear.
  setCopilotQuestion("");

  setCopilotLoading(true);
  setCopilotError("");

  try {
    const { data, error } = await supabase.functions.invoke(
      "copilot-github",
      {
        body: {
          question,
          profile: githubData.profile,
          analysis: githubData.analysis,

          // Previous conversation backend ko bhi do.
          messages: previousMessages,
        },
      }
    );

    if (error) {
      let message = "AI Copilot request failed.";

      try {
        const details = await error.context?.json();

        if (details?.error) {
          message = details.error;
        }
      } catch {
        // keep fallback
      }

      throw new Error(message);
    }

    if (!data?.success || !data?.answer) {
      throw new Error(
        data?.error || "AI Copilot returned no answer."
      );
    }

    const assistantMessage = {
      role: "assistant",
      content: data.answer,
    };

    // Purane messages delete nahi honge.
    // New AI answer neeche append hoga.
    setCopilotMessages((prev) => [
      ...prev,
      assistantMessage,
    ]);
  } catch (error) {
    console.error("AI Copilot error:", error);

    setCopilotError(
      error?.message || "Unable to get an AI response."
    );
  } finally {
    setCopilotLoading(false);
  }
};
  return (
    <div className="github-ref-page">
      <main className="github-ref-content">
        <header className="github-ref-hero">
          <div className="github-ref-kicker">
            <span />
            GITHUB INTELLIGENCE
          </div>

          <h1>
            See what your GitHub says
            <span> when nobody reads the README.</span>
          </h1>

          <p>
            Enter your GitHub username or profile URL to generate real
            developer intelligence from public repositories, activity,
            documentation, and profile signals.
          </p>
        </header>

        <section className="github-ref-shell github-analyzer-main-shell">
          <div className="github-ref-left">
            <div className="github-ref-workspace">
              <div className="github-ref-logo">
                <img src={githubIcon} alt="GitHub" />
              </div>

              <h2>GitHub Profile Workspace</h2>

              <p>
                Paste a GitHub profile and generate a complete developer
                intelligence report in one click.
              </p>

              <form className="github-ref-form" onSubmit={handleAnalyze}>
                <div className="github-ref-input">
                  <input
                    type="text"
                    value={githubInput}
                    placeholder="github.com/username"
                    onChange={(event) =>
                      setGithubInput(event.target.value)
                    }
                  />
                </div>

                <button
                  type="submit"
                  disabled={!githubInput.trim() || loading}
                >
                  {loading
                    ? "Analyzing GitHub..."
                    : "Analyze & Generate Report"}

                  <span>→</span>
                </button>
              </form>

              <div className="github-popular">
                <span>Popular:</span>

                <button
                  type="button"
                  onClick={() =>
                    handlePopularProfile("@torvalds")
                  }
                >
                  @torvalds
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handlePopularProfile("@gaearon")
                  }
                >
                  @gaearon
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handlePopularProfile("@sindresorhus")
                  }
                >
                  @sindresorhus
                </button>
              </div>
            </div>

            <div className="github-access-status">
              <span>
                <i>✓</i>
                Public API read-only mode
              </span>

              <span>No repository write access required</span>
            </div>

            {errorMessage && (
              <p className="github-analysis-error">
                {errorMessage}
              </p>
            )}
          </div>

          <aside className="github-intelligence-panel">
            {!githubData && !loading && (
              <div className="github-intelligence-empty">
                <div className="github-empty-icon">
                  <img src={githubIcon} alt="" />
                </div>

                <span>DEVELOPER INTELLIGENCE</span>

                <h2>Your analysis will appear here.</h2>

                <p>
                  Paste a GitHub profile and generate a report to see real
                  scores, strengths, weaknesses, and improvement priorities.
                </p>

                <div className="github-empty-lines">
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}

            {loading && (
              <div className="github-intelligence-loading">
                <div className="github-analysis-spinner" />

                <span>ANALYZING PROFILE</span>

                <h2>Building developer intelligence...</h2>

                <p>
                  Inspecting public repositories, activity, documentation,
                  project depth, and profile signals.
                </p>
              </div>
            )}

            {githubData && !loading && (
              <div className="github-intelligence-result">
                <div className="github-result-top">
                  <div className="github-result-user">
                    <img
                      src={
                        githubData.profile.avatarUrl ||
                        githubIcon
                      }
                      alt={githubData.profile.login}
                    />

                    <div>
                      <span>GITHUB INTELLIGENCE</span>

                      <h2>
                        {githubData.profile.name ||
                          `@${githubData.profile.login}`}
                      </h2>

                      <p>@{githubData.profile.login}</p>
                    </div>
                  </div>

                  <div className="github-overall-score">
                    <strong>
                      {githubData.analysis.overallScore}
                    </strong>

                    <span>/100</span>

                    <small>OVERALL</small>
                  </div>
                </div>

                <div className="github-score-list">
                  {githubChecks.map((check) => {
                    const score =
                      githubData.analysis.scores?.[
                        check.scoreKey
                      ] ?? 0;

                    return (
                      <div
                        className="github-score-item"
                        key={check.id}
                      >
                        <div className="github-score-copy">
                          <span>{check.id}</span>

                          <div>
                            <strong>{check.title}</strong>
                            <small>
                              {check.description}
                            </small>
                          </div>
                        </div>

                        <div className="github-score-value">
                          <strong>{score}</strong>
                          <span>/100</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="github-insight-block">
                  <div className="github-insight-heading">
                    <span>+</span>
                    <strong>Strengths</strong>
                  </div>

                  <div className="github-insight-content">
                    {githubData.analysis.strengths?.length ? (
                      githubData.analysis.strengths.map(
                        (item, index) => (
                          <p key={`${item}-${index}`}>
                            ✓ {item}
                          </p>
                        )
                      )
                    ) : (
                      <p>No major strengths detected yet.</p>
                    )}
                  </div>
                </div>

                <div className="github-insight-block">
                  <div className="github-insight-heading">
                    <span>!</span>
                    <strong>Weaknesses</strong>
                  </div>

                  <div className="github-insight-content">
                    {githubData.analysis.weaknesses?.length ? (
                      githubData.analysis.weaknesses.map(
                        (item, index) => (
                          <p key={`${item}-${index}`}>
                            • {item}
                          </p>
                        )
                      )
                    ) : (
                      <p>No major weaknesses detected.</p>
                    )}
                  </div>
                </div>

                <div className="github-insight-block">
                  <div className="github-insight-heading">
                    <span>→</span>
                    <strong>Top Improvements</strong>
                  </div>

                  <div className="github-improvement-list">
                    {githubData.analysis.suggestions?.length ? (
                      githubData.analysis.suggestions.map(
                        (item, index) => (
                          <div
                            className="github-improvement-item"
                            key={`${item}-${index}`}
                          >
                            <span>
                              {String(index + 1).padStart(
                                2,
                                "0"
                              )}
                            </span>

                            <p>{item}</p>
                          </div>
                        )
                      )
                    ) : (
                      <p>No immediate improvements required.</p>
                    )}
                  </div>
                </div>

                <div className="github-metrics-block">
                  <span>LIVE PROFILE SIGNALS</span>

                  <div className="github-metrics-grid">
                    <div>
                      <strong>
                        {githubData.analysis.metrics
                          ?.publicRepos ?? 0}
                      </strong>
                      <span>Public Repos</span>
                    </div>

                    <div>
                      <strong>
                        {githubData.analysis.metrics
                          ?.originalRepos ?? 0}
                      </strong>
                      <span>Original</span>
                    </div>

                    <div>
                      <strong>
                        {githubData.analysis.metrics
                          ?.active30Days ?? 0}
                      </strong>
                      <span>Active 30d</span>
                    </div>

                    <div>
                      <strong>
                        {githubData.analysis.metrics
                          ?.totalStars ?? 0}
                      </strong>
                      <span>Stars</span>
                    </div>
                  </div>
                </div>

                <div className="github-copilot-box">
                  <div className="github-copilot-heading">
                    <div>
                      <span>AI COPILOT</span>
                      <strong>
                        Ask about this profile
                      </strong>
                    </div>

                    <span className="github-copilot-status">
                      {copilotLoading
                        ? "THINKING..."
                        : "CONTEXT READY"}
                    </span>
                  </div>

                  <div className="github-copilot-prompts">
                    <button
                      type="button"
                      disabled={copilotLoading}
                      onClick={() =>
                        setCopilotQuestion(
                          "What should I improve first?"
                        )
                      }
                    >
                      What should I improve first?
                    </button>

                    <button
                      type="button"
                      disabled={copilotLoading}
                      onClick={() =>
                        setCopilotQuestion(
                          "Why is my lowest score weak?"
                        )
                      }
                    >
                      Why is my lowest score weak?
                    </button>

                    <button
                      type="button"
                      disabled={copilotLoading}
                      onClick={() =>
                        setCopilotQuestion(
                          "How can I reach an 80+ score?"
                        )
                      }
                    >
                      How can I reach 80+?
                    </button>
                  </div>

                  <div className="github-copilot-input">
                    <input
                      type="text"
                      value={copilotQuestion}
                      placeholder="Ask Copilot about this GitHub profile..."
                      disabled={copilotLoading}
                      onChange={(event) =>
                        setCopilotQuestion(
                          event.target.value
                        )
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          handleAskCopilot();
                        }
                      }}
                    />

                    <button
                      type="button"
                      onClick={handleAskCopilot}
                      disabled={
                        !copilotQuestion.trim() ||
                        !githubData ||
                        copilotLoading
                      }
                    >
                      {copilotLoading
                        ? "Thinking..."
                        : "Ask Copilot →"}
                    </button>
                  </div>

                  {copilotError && (
                    <div className="github-copilot-error">
                      {copilotError}
                    </div>
                  )}

                  {copilotMessages.length > 0 && (
  <div className="github-copilot-conversation">
    {copilotMessages.map((message, index) => (
      <div
        key={`${message.role}-${index}`}
        className={`github-chat-message github-chat-${message.role}`}
      >
        <span className="github-chat-role">
          {message.role === "user" ? "YOU" : "AI COPILOT"}
        </span>

        <div className="github-chat-content">
          {message.role === "assistant" ? (
            <ReactMarkdown>
              {message.content}
            </ReactMarkdown>
          ) : (
            <p>{message.content}</p>
          )}
        </div>
      </div>
    ))}

    {copilotLoading && (
      <div className="github-chat-message github-chat-assistant">
        <span className="github-chat-role">
          AI COPILOT
        </span>

        <div className="github-chat-thinking">
          Thinking...
        </div>
      </div>
    )}
  </div>
)}

    

                 <small>
  Copilot uses this GitHub analysis as
  profile context.
</small>

</div>

</div>
)}

</aside>
        </section>

        <section className="github-signal-cards">
          {signalCards.map((card) => (
            <article
              className="github-signal-card"
              key={card.title}
            >
              <div className="github-signal-icon">
                <SignalIcon type={card.type} />
              </div>

              <div>
                <h3>{card.title}</h3>
                <p>{card.description}</p>
              </div>
            </article>
          ))}
        </section>
      </main>

      <footer className="github-ref-footer">
        <div>
          <strong>DevProfile</strong>

          <span>
            © 2026 DevProfile AI Studio. Career Intelligence
            Architecture.
          </span>
        </div>

        <nav>
          <span>GitHub API Telemetry</span>
          <span>Engineering Rubrics</span>
          <span>Privacy Framework</span>
          <span>System Status</span>
        </nav>
      </footer>
    </div>
  );
}

export default GitHubAnalyzer;
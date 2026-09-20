import { useState } from "react";
import ReactMarkdown from "react-markdown";

import { supabase } from "../lib/supabase";
import { saveAnalysis } from "../services/analysisService";

import "../styles/PortfolioAnalyzer.css";

function PortfolioAnalyzer() {
  const [portfolioUrl, setPortfolioUrl] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [analysisResult, setAnalysisResult] =
    useState(null);

  const [portfolioData, setPortfolioData] =
    useState(null);

  const [copilotMessages, setCopilotMessages] =
    useState([]);

  const [copilotInput, setCopilotInput] =
    useState("");

  const [copilotLoading, setCopilotLoading] =
    useState(false);

  const [copilotError, setCopilotError] =
    useState("");


  const handleAnalyzePortfolio = async (
    event
  ) => {
    event.preventDefault();

    const url = portfolioUrl.trim();

    if (!url || loading) {
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setAnalysisResult(null);
    setPortfolioData(null);
    setCopilotMessages([]);

    try {
      const { data, error } =
        await supabase.functions.invoke(
          "analyze-portfolio",
          {
            body: {
              url,
            },
          }
        );

      if (error) {
        let message =
          "Unable to analyze portfolio.";

        try {
          const details =
            await error.context?.json();

          if (details?.error) {
            message = details.error;
          }
        } catch {}

        throw new Error(message);
      }

      if (
        !data?.success ||
        !data?.analysis ||
        !data?.portfolio
      ) {
        throw new Error(
          data?.error ||
            "Portfolio analysis returned an invalid response."
        );
      }

      setAnalysisResult(
        data.analysis
      );

      setPortfolioData(
        data.portfolio
      );

      await saveAnalysis({
        type: "portfolio",

        score:
          Number(
            data.analysis.overallScore
          ) || 0,

        input: {
          url:
            data.portfolio.url ||
            url,

          pagesAnalyzed:
            data.portfolio
              .pagesAnalyzed || [],
        },

        result:
          data.analysis,

        status: "completed",
      });
    } catch (error) {
      console.error(
        "Portfolio analysis error:",
        error
      );

      setErrorMessage(
        error?.message ||
          "Unable to analyze portfolio."
      );
    } finally {
      setLoading(false);
    }
  };


  const handleCopilotSend = async (
    event
  ) => {
    event?.preventDefault();

    const question =
      copilotInput.trim();

    if (
      !question ||
      copilotLoading ||
      !analysisResult ||
      !portfolioData?.content
    ) {
      return;
    }

    setCopilotError("");
    setCopilotLoading(true);

    const previousMessages = [
      ...copilotMessages,
    ];

    const userMessage = {
      role: "user",
      content: question,
    };

    setCopilotMessages([
      ...previousMessages,
      userMessage,
    ]);

    setCopilotInput("");

    try {
      const { data, error } =
        await supabase.functions.invoke(
          "copilot-portfolio",
          {
            body: {
              question,

              portfolioContent:
                portfolioData.content,

              analysis:
                analysisResult,

              history:
                previousMessages,
            },
          }
        );

      if (error) {
        let message =
          "Unable to get a response from Portfolio Copilot.";

        try {
          const details =
            await error.context?.json();

          if (details?.error) {
            message = details.error;
          }
        } catch {}

        throw new Error(message);
      }

      if (
        !data?.success ||
        !data?.answer
      ) {
        throw new Error(
          data?.error ||
            "Portfolio Copilot returned an invalid response."
        );
      }

      setCopilotMessages(
        (current) => [
          ...current,
          {
            role: "assistant",
            content: data.answer,
          },
        ]
      );
    } catch (error) {
      console.error(
        "Portfolio Copilot error:",
        error
      );

      setCopilotError(
        error?.message ||
          "Unable to get a response from Portfolio Copilot."
      );
    } finally {
      setCopilotLoading(false);
    }
  };


  const scores =
    analysisResult?.scores
      ? Object.values(
          analysisResult.scores
        )
      : [];


  return (
    <main className="portfolio-analyzer-page">

      <section className="portfolio-analyzer-shell">

        {/* =========================
            LEFT WORKSPACE
        ========================== */}

        <div className="portfolio-workspace">

          <div className="portfolio-workspace-content">

            <span className="portfolio-eyebrow">
              PORTFOLIO ANALYZER
            </span>

            <h1>
              Analyze your developer
              portfolio
            </h1>

            <p>
              Enter your live portfolio URL.
              DevProfile will review your
              professional positioning,
              projects, technical evidence
              and recruiter readiness.
            </p>


            <form
              className="portfolio-url-form"
              onSubmit={
                handleAnalyzePortfolio
              }
            >
              <label htmlFor="portfolio-url">
                Portfolio URL
              </label>

              <input
                id="portfolio-url"
                type="text"
                value={portfolioUrl}
                onChange={(event) =>
                  setPortfolioUrl(
                    event.target.value
                  )
                }
                placeholder="https://yourportfolio.com"
                disabled={loading}
              />

              <button
                type="submit"
                disabled={
                  loading ||
                  !portfolioUrl.trim()
                }
              >
                {loading
                  ? "Analyzing..."
                  : "Analyze Portfolio →"}
              </button>
            </form>


            {errorMessage && (
              <div className="portfolio-error">
                {errorMessage}
              </div>
            )}


            <div className="portfolio-workspace-note">
              <span>✦</span>

              <p>
                DevProfile analyzes only
                publicly accessible portfolio
                content.
              </p>
            </div>

          </div>

        </div>


        {/* =========================
            RIGHT REPORT
        ========================== */}

        <div className="portfolio-analysis-panel">

          {!analysisResult ? (
            <div className="portfolio-empty-state">

              <div className="portfolio-empty-icon">
                ◇
              </div>

              <span>
                PORTFOLIO INTELLIGENCE
              </span>

              <h2>
                Your report will appear here
              </h2>

              <p>
                Add your live portfolio URL
                and run an analysis to see
                your professional profile
                report.
              </p>

            </div>
          ) : (
            <div className="portfolio-result-report">

              {/* REPORT HEADER */}

              <div className="portfolio-report-header">

                <div>
                  <span>
                    PORTFOLIO INTELLIGENCE
                  </span>

                  <h2>
                    Portfolio Analysis
                  </h2>

                  {portfolioData?.title && (
                    <p>
                      {portfolioData.title}
                    </p>
                  )}
                </div>


                <div className="portfolio-overall-score">
                  <strong>
                    {
                      analysisResult
                        .overallScore
                    }
                  </strong>

                  <span>/100</span>
                </div>

              </div>


              {/* SUMMARY */}

              <div className="portfolio-result-section">

                <h3>
                  Your Portfolio Analysis
                </h3>

                <p>
                  {
                    analysisResult
                      .overallSummary
                  }
                </p>

              </div>


              {/* CATEGORY SCORES */}

              {scores.length > 0 && (
                <div className="portfolio-score-grid">

                  {scores.map(
                    (item) => (
                      <div
                        className="portfolio-score-card"
                        key={item.label}
                      >
                        <div>
                          <strong>
                            {item.label}
                          </strong>

                          <p>
                            {
                              item.explanation
                            }
                          </p>
                        </div>

                        <span>
                          {item.score}/100
                        </span>
                      </div>
                    )
                  )}

                </div>
              )}


              {/* STRENGTHS */}

              {analysisResult
                .strengths?.length > 0 && (
                <div className="portfolio-result-section">

                  <h3>
                    What You're Doing Well
                  </h3>

                  {analysisResult.strengths.map(
                    (item, index) => (
                      <div
                        className="portfolio-insight-item"
                        key={index}
                      >
                        <strong>
                          {item.title}
                        </strong>

                        <p>
                          {
                            item.explanation
                          }
                        </p>
                      </div>
                    )
                  )}

                </div>
              )}


              {/* WEAKNESSES */}

              {analysisResult
                .weaknesses?.length >
                0 && (
                <div className="portfolio-result-section">

                  <h3>
                    What Is Holding Your
                    Portfolio Back
                  </h3>

                  {analysisResult.weaknesses.map(
                    (item, index) => (
                      <div
                        className="portfolio-insight-item"
                        key={index}
                      >
                        <strong>
                          {item.title}
                        </strong>

                        <p>
                          {
                            item.explanation
                          }
                        </p>

                        {item.whyItMatters && (
                          <small>
                            Why it matters:{" "}
                            {
                              item.whyItMatters
                            }
                          </small>
                        )}
                      </div>
                    )
                  )}

                </div>
              )}


              {/* IMPROVEMENTS */}

              {analysisResult
                .improvements?.length >
                0 && (
                <div className="portfolio-result-section">

                  <h3>
                    What To Improve First
                  </h3>

                  {analysisResult.improvements.map(
                    (item, index) => (
                      <div
                        className="portfolio-improvement"
                        key={index}
                      >
                        <span>
                          {index + 1}
                        </span>

                        <div>
                          <strong>
                            {item.title}
                          </strong>

                          <p>
                            {item.action}
                          </p>
                        </div>

                        <small>
                          {item.priority}
                        </small>
                      </div>
                    )
                  )}

                </div>
              )}


              {/* RECRUITER VIEW */}

              {analysisResult
                .recruiterView && (
                <div className="portfolio-result-section">

                  <h3>
                    Recruiter's 30-Second
                    View
                  </h3>

                  <div className="portfolio-recruiter-item">
                    <strong>
                      Role your portfolio
                      currently communicates
                    </strong>

                    <p>
                      {
                        analysisResult
                          .recruiterView
                          .likelyRole
                      }
                    </p>
                  </div>

                  <div className="portfolio-recruiter-item">
                    <strong>
                      What stands out
                    </strong>

                    <p>
                      {
                        analysisResult
                          .recruiterView
                          .strongestSignal
                      }
                    </p>
                  </div>

                  <div className="portfolio-recruiter-item">
                    <strong>
                      Main concern
                    </strong>

                    <p>
                      {
                        analysisResult
                          .recruiterView
                          .biggestConcern
                      }
                    </p>
                  </div>

                  <div className="portfolio-recruiter-item">
                    <strong>
                      What proof is missing
                    </strong>

                    <p>
                      {
                        analysisResult
                          .recruiterView
                          .missingProof
                      }
                    </p>
                  </div>

                  <div className="portfolio-recruiter-item">
                    <strong>
                      Recruiter Confidence
                    </strong>

                    <p>
                      {
                        analysisResult
                          .recruiterView
                          .recruiterConfidence
                      }
                      /100
                    </p>
                  </div>

                </div>
              )}


              {/* =========================
                  PORTFOLIO COPILOT
              ========================== */}

              <section className="portfolio-copilot">

                <div className="portfolio-copilot-topline">

                  <span className="portfolio-copilot-label">
                    AI COPILOT
                  </span>

                  <span className="portfolio-copilot-context">
                    CONTEXT READY
                  </span>

                </div>


                <h3 className="portfolio-copilot-title">
                  Ask about this portfolio
                </h3>


                <div className="portfolio-copilot-prompts">

                  <button
                    type="button"
                    onClick={() =>
                      setCopilotInput(
                        "What should I improve first?"
                      )
                    }
                  >
                    What should I improve
                    first?
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setCopilotInput(
                        "Are my projects strong enough?"
                      )
                    }
                  >
                    Are my projects strong
                    enough?
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setCopilotInput(
                        "What would a recruiter notice first?"
                      )
                    }
                  >
                    What would a recruiter
                    notice?
                  </button>

                </div>


                {copilotMessages.length >
                  0 && (
                  <div className="portfolio-copilot-chat">

                    {copilotMessages.map(
                      (
                        message,
                        index
                      ) => (
                        <div
                          key={`${message.role}-${index}`}
                          className={`portfolio-copilot-message ${
                            message.role ===
                            "user"
                              ? "user"
                              : "assistant"
                          }`}
                        >

                          <span className="portfolio-copilot-role">
                            {message.role ===
                            "user"
                              ? "YOU"
                              : "AI COPILOT"}
                          </span>


                          {message.role ===
                          "assistant" ? (
                            <div className="portfolio-copilot-answer">
                              <ReactMarkdown>
                                {
                                  message.content
                                }
                              </ReactMarkdown>
                            </div>
                          ) : (
                            <p>
                              {
                                message.content
                              }
                            </p>
                          )}

                        </div>
                      )
                    )}


                    {copilotLoading && (
                      <div className="portfolio-copilot-message assistant">

                        <span className="portfolio-copilot-role">
                          AI COPILOT
                        </span>

                        <div className="portfolio-copilot-dots">
                          <span />
                          <span />
                          <span />
                        </div>

                      </div>
                    )}

                  </div>
                )}


                {copilotError && (
                  <div className="portfolio-copilot-error">
                    {copilotError}
                  </div>
                )}


                <form
                  className="portfolio-copilot-input"
                  onSubmit={
                    handleCopilotSend
                  }
                >

                  <input
                    type="text"
                    value={copilotInput}
                    onChange={(event) =>
                      setCopilotInput(
                        event.target.value
                      )
                    }
                    placeholder="Ask about your portfolio..."
                    disabled={
                      copilotLoading
                    }
                  />

                  <button
                    type="submit"
                    disabled={
                      copilotLoading ||
                      !copilotInput.trim()
                    }
                  >
                    {copilotLoading
                      ? "Thinking..."
                      : "Ask Copilot →"}
                  </button>

                </form>


                <p className="portfolio-copilot-note">
                  Copilot uses this portfolio
                  analysis and website content
                  as context.
                </p>

              </section>

            </div>
          )}

        </div>

      </section>

    </main>
  );
}

export default PortfolioAnalyzer;
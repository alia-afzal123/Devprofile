import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

import resumeIcon from "../assets/icons/resume-icon.png";
import githubIcon from "../assets/icons/github-icon.png";
import portfolioIcon from "../assets/icons/portfolio-icon.png";

import { supabase } from "../lib/supabase";
import "./History.css";

const filters = ["all", "resume", "github", "portfolio"];

/* -------------------------------------------------------
   ICON
------------------------------------------------------- */

function HistoryIcon({ type }) {
  const icons = {
    resume: resumeIcon,
    github: githubIcon,
    portfolio: portfolioIcon,
  };

  const icon = icons[type];

  if (!icon) return null;

  return <img src={icon} alt={`${type} analysis`} />;
}

/* -------------------------------------------------------
   ANALYSIS HELPERS
------------------------------------------------------- */

function getAnalysisTitle(type) {
  if (type === "resume") return "Resume Analysis";
  if (type === "github") return "GitHub Analysis";
  if (type === "portfolio") return "Portfolio Analysis";

  return "Profile Analysis";
}

function getAnalysisPath(type) {
  if (type === "resume") return "/resume-analyzer";
  if (type === "github") return "/github-analyzer";
  if (type === "portfolio") return "/portfolio-analyzer";

  return "/dashboard";
}

function getAnalysisTarget(item) {
  const input = item?.input || {};

  if (item.type === "resume") {
    return (
      input.file_name ||
      input.filename ||
      input.name ||
      "Uploaded resume"
    );
  }

  if (item.type === "github") {
    return (
      input.url ||
      input.github_url ||
      input.username ||
      "GitHub profile"
    );
  }

  if (item.type === "portfolio") {
    return (
      input.url ||
      input.portfolio_url ||
      "Portfolio website"
    );
  }

  return "Developer profile";
}

/* -------------------------------------------------------
   DESCRIPTION
------------------------------------------------------- */

function getAnalysisDescription(item) {
  const result = item?.result || {};

  /*
    Different analyzers can use slightly different
    names for their main summary.
  */

  if (
    typeof result.overallSummary === "string" &&
    result.overallSummary.trim()
  ) {
    return result.overallSummary.trim();
  }

  if (
    typeof result.summary === "string" &&
    result.summary.trim()
  ) {
    return result.summary.trim();
  }

  if (
    typeof result.profileSummary === "string" &&
    result.profileSummary.trim()
  ) {
    return result.profileSummary.trim();
  }

  /*
    Suggestions can either be strings or objects.
  */

  if (
    Array.isArray(result.suggestions) &&
    result.suggestions.length > 0
  ) {
    const firstSuggestion = result.suggestions[0];

    if (typeof firstSuggestion === "string") {
      return firstSuggestion;
    }

    if (firstSuggestion?.explanation) {
      return firstSuggestion.explanation;
    }

    if (firstSuggestion?.action) {
      return firstSuggestion.action;
    }

    if (firstSuggestion?.title) {
      return firstSuggestion.title;
    }
  }

  /*
    Same protection for weaknesses.
  */

  if (
    Array.isArray(result.weaknesses) &&
    result.weaknesses.length > 0
  ) {
    const firstWeakness = result.weaknesses[0];

    if (typeof firstWeakness === "string") {
      return firstWeakness;
    }

    if (firstWeakness?.explanation) {
      return firstWeakness.explanation;
    }

    if (firstWeakness?.title) {
      return firstWeakness.title;
    }
  }

  return "Analysis completed successfully.";
}

/* -------------------------------------------------------
   DATE HELPERS
------------------------------------------------------- */

function formatDate(dateValue) {
  if (!dateValue) return "—";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function formatTime(dateValue) {
  if (!dateValue) return "";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatLastAnalyzed(dateValue) {
  if (!dateValue) return "—";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  const today = new Date();

  const isToday =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  if (isToday) {
    return "Today";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/* -------------------------------------------------------
   HISTORY PAGE
------------------------------------------------------- */

function History() {
  const [activeFilter, setActiveFilter] =
    useState("all");

  const [analyses, setAnalyses] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  /* -----------------------------------------------------
     FETCH REAL USER HISTORY
  ----------------------------------------------------- */

  useEffect(() => {
    let mounted = true;

    const fetchAnalyses = async () => {
      setLoading(true);
      setErrorMessage("");

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          if (mounted) {
            setErrorMessage(
              "No logged-in user found."
            );
          }

          return;
        }

        const { data, error } = await supabase
          .from("analyses")
          .select(
            `
              id,
              user_id,
              type,
              status,
              score,
              input,
              result,
              created_at,
              updated_at
            `
          )
          .eq("user_id", user.id)
          .order("created_at", {
            ascending: false,
          });

        if (error) {
          throw error;
        }

        if (mounted) {
          setAnalyses(data || []);
        }
      } catch (error) {
        console.error(
          "History fetch error:",
          error
        );

        if (mounted) {
          setErrorMessage(
            "We couldn't load your analysis history. Please try again."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchAnalyses();

    return () => {
      mounted = false;
    };
  }, []);

  /* -----------------------------------------------------
     NORMALIZE HISTORY DATA
  ----------------------------------------------------- */

  const historyItems = useMemo(() => {
    return analyses.map((item, index) => {
      /*
        Since analyses are newest → oldest,
        everything after the current index is older.

        Find the previous analysis of the SAME type
        so score change is meaningful.
      */

      const previousSameType = analyses
        .slice(index + 1)
        .find(
          (analysis) =>
            analysis.type === item.type &&
            analysis.score != null
        );

      const currentScore =
        item.score != null
          ? Number(item.score)
          : null;

      const previousScore =
        previousSameType?.score != null
          ? Number(previousSameType.score)
          : null;

      const scoreChange =
        Number.isFinite(currentScore) &&
        Number.isFinite(previousScore)
          ? currentScore - previousScore
          : null;

      return {
        ...item,

        title: getAnalysisTitle(item.type),

        target: getAnalysisTarget(item),

        description:
          getAnalysisDescription(item),

        path: getAnalysisPath(item.type),

        date: formatDate(item.created_at),

        time: formatTime(item.created_at),

        change: scoreChange,
      };
    });
  }, [analyses]);

  /* -----------------------------------------------------
     FILTER
  ----------------------------------------------------- */

  const filteredHistory = useMemo(() => {
    if (activeFilter === "all") {
      return historyItems;
    }

    return historyItems.filter(
      (item) =>
        item.type === activeFilter
    );
  }, [historyItems, activeFilter]);

  /* -----------------------------------------------------
     SUMMARY
  ----------------------------------------------------- */

  const latestAnalysis =
    analyses.length > 0
      ? analyses[0]
      : null;

  /* -----------------------------------------------------
     UI
  ----------------------------------------------------- */

  return (
    <div className="history-page">

      {/* HERO */}

      <header className="history-hero">
        <div className="history-kicker">
          <span />
          ANALYSIS ARCHIVE
        </div>

        <h1>
          Your progress,
          <span> recorded over time.</span>
        </h1>

        <p>
          Review previous Resume, GitHub and
          Portfolio analyses without losing track
          of how your developer profile is changing.
        </p>
      </header>

      {/* OVERVIEW */}

      <section className="history-overview">
        <div className="history-overview-copy">
          <span>HISTORY INDEX</span>

          <h2>Analysis timeline</h2>

          <p>
            Your most recent profile scans,
            ordered from newest to oldest.
          </p>
        </div>

        <div className="history-summary">

          <div>
            <span>Total analyses</span>

            <strong>
              {loading
                ? "—"
                : analyses.length}
            </strong>
          </div>

          <div>
            <span>Latest score</span>

            <strong>
              {loading
                ? "—"
                : latestAnalysis?.score ?? "—"}
            </strong>
          </div>

          <div>
            <span>Last analyzed</span>

            <strong>
              {loading
                ? "—"
                : formatLastAnalyzed(
                    latestAnalysis?.created_at
                  )}
            </strong>
          </div>

        </div>
      </section>

      {/* ARCHIVE */}

      <section className="history-archive">

        <div className="history-toolbar">

          <div className="history-filters">

            {filters.map((filter) => (
              <button
                type="button"
                key={filter}
                className={
                  activeFilter === filter
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setActiveFilter(filter)
                }
              >
                {filter === "all"
                  ? "All analyses"
                  : `${
                      filter
                        .charAt(0)
                        .toUpperCase()
                    }${filter.slice(1)}`}
              </button>
            ))}

          </div>

          <span className="history-result-count">
            {loading
              ? "Loading..."
              : `${filteredHistory.length} ${
                  filteredHistory.length === 1
                    ? "record"
                    : "records"
                }`}
          </span>

        </div>

        {/* LOADING */}

        {loading && (
          <div className="history-empty">
            <span>○</span>

            <h3>
              Loading history...
            </h3>

            <p>
              Please wait while your analyses
              are loaded.
            </p>
          </div>
        )}

        {/* ERROR */}

        {!loading && errorMessage && (
          <div className="history-empty">
            <span>!</span>

            <h3>
              Could not load history
            </h3>

            <p>{errorMessage}</p>
          </div>
        )}

        {/* REAL HISTORY */}

        {!loading &&
          !errorMessage && (
            <>
              <div className="history-list">

                {filteredHistory.map(
                  (item, index) => (
                    <article
                      className="history-record"
                      key={item.id}
                    >

                      {/* TIMELINE */}

                      <div className="history-rail">

                        <span
                          className={`history-dot ${item.type}`}
                        />

                        {index !==
                          filteredHistory.length -
                            1 && (
                          <span className="history-line" />
                        )}

                      </div>

                      {/* RECORD */}

                      <div className="history-record-main">

                        <div
                          className={`history-record-icon ${item.type}`}
                        >
                          <HistoryIcon
                            type={item.type}
                          />
                        </div>

                        <div className="history-record-copy">

                          <div className="history-record-heading">

                            <div>
                              <span className="history-record-type">
                                {item.type.toUpperCase()}
                              </span>

                              <h3>
                                {item.title}
                              </h3>
                            </div>

                            <div className="history-record-time">
                              <strong>
                                {item.date}
                              </strong>

                              <span>
                                {item.time}
                              </span>
                            </div>

                          </div>

                          <span className="history-target">
                            {item.target}
                          </span>

                          <p>
                            {item.description}
                          </p>

                          <div className="history-record-footer">

                            <div className="history-score">
                              <span>
                                Score
                              </span>

                              <strong>
                                {item.score ??
                                  "—"}
                              </strong>

                              <small>
                                /100
                              </small>
                            </div>

                            {item.change !==
                              null && (
                              <span className="history-change">
                                {item.change >
                                0
                                  ? "↑"
                                  : item.change <
                                      0
                                    ? "↓"
                                    : "→"}{" "}

                                {Math.abs(
                                  item.change
                                )}{" "}

                                {item.change ===
                                0
                                  ? "no change"
                                  : "since previous"}
                              </span>
                            )}

                            <Link
                              to={item.path}
                            >
                              Re-run analyzer
                              <span>↗</span>
                            </Link>

                          </div>
                        </div>
                      </div>
                    </article>
                  )
                )}

              </div>

              {/* EMPTY STATE */}

              {filteredHistory.length ===
                0 && (
                <div className="history-empty">
                  <span>○</span>

                  <h3>
                    {activeFilter === "all"
                      ? "No analyses yet"
                      : `No ${activeFilter} analyses yet`}
                  </h3>

                  <p>
                    {activeFilter === "all"
                      ? "Complete your first analysis and it will appear here."
                      : `Complete a ${activeFilter} analysis and it will appear here.`}
                  </p>

                  <Link to="/dashboard">
                    Go to dashboard
                  </Link>
                </div>
              )}

            </>
          )}

      </section>
    </div>
  );
}

export default History;
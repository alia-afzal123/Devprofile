import { useEffect, useState } from "react";
import QuickActionCard from "../components/QuickActionCard";
import AICopilot from "../components/AICopilot";
import resumeIcon from "../assets/icons/resume-icon.png";
import githubIcon from "../assets/icons/github-icon.png";
import portfolioIcon from "../assets/icons/portfolio-icon.png";
import { supabase } from "../lib/supabase";
import "./Dashboard.css";


function Dashboard() {
  const [
    isCopilotOpen,
    setIsCopilotOpen
  ] = useState(false);


  const quickActions = [
    {
      title: "Resume Analyzer",
      description:
        "Upload your resume and discover what needs improvement.",
      icon: resumeIcon,
      path: "/resume-analyzer",
    },
    {
      title: "GitHub Analyzer",
      description:
        "Review your GitHub presence, activity and repositories.",
      icon: githubIcon,
      path: "/github-analyzer",
    },
    {
      title: "Portfolio Analyzer",
      description:
        "Check how effectively your portfolio presents your work.",
      icon: portfolioIcon,
      path: "/portfolio-analyzer",
    },
  ];

const testSaveAnalysis = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    alert("No logged-in user found.");
    return;
  }

  const { data, error } = await supabase
    .from("analyses")
    .insert([
      {
        user_id: user.id,
        type: "github",
        status: "completed",
        score: 85,
        input: {
          url: "https://github.com/test-user",
        },
        result: {
          strengths: ["Good project structure"],
          weaknesses: ["README needs improvement"],
          suggestions: ["Improve documentation"],
        },
      },
    ])
    .select();

  if (error) {
    console.error("Save error:", error);
    alert("Save failed: " + error.message);
    return;
  }

  console.log("Saved analysis:", data);
  alert("Analysis saved successfully.");
};

const [analyses, setAnalyses] = useState([]);
const [loading, setLoading] = useState(true);
useEffect(() => {
  const fetchAnalyses = async () => {
    const { data, error } = await supabase
      .from("analyses")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Dashboard analyses error:", error);
      setLoading(false);
      return;
    }

    setAnalyses(data || []);
    setLoading(false);
  };

  fetchAnalyses();
}, []);

const latestResume = analyses.find(
  (item) => item.type === "resume"
);

const latestGithub = analyses.find(
  (item) => item.type === "github"
);

const latestPortfolio = analyses.find(
  (item) => item.type === "portfolio"
);
const latestScores = [
    latestResume?.score,
    latestGithub?.score,
    latestPortfolio?.score,
  ].filter((score) => typeof score === "number");

  const overallScore =
    latestScores.length > 0
      ? Math.round(
          latestScores.reduce((sum, score) => sum + score, 0) /
            latestScores.length
        )
      : null;

    const resumeScore = latestResume?.score ?? null;
const githubScore = latestGithub?.score ?? null;
const portfolioScore = latestPortfolio?.score ?? null;
const [profile, setProfile] = useState(null);


  return (
    <section
      className={`dashboard-page ${
        isCopilotOpen ? "copilot-open" : ""
      }`}
    >

      {/* =====================================================
          Command Center
      ===================================================== */}

      <section className="dashboard-intro">

        <div className="dashboard-intro-content">
          <span className="dashboard-eyebrow">
            PROFILE COMMAND CENTER
          </span>

          <h1>
            Build a developer profile
            <span> worth noticing.</span>
          </h1>

          <p>
            Analyze one part of your developer presence or
            continue improving where you left off.
          </p>
        </div>


        <div className="dashboard-status">
          <span className="status-dot" />

          <div>
            <strong>
              Ready to analyze
            </strong>

            <small>
              Choose where you want to start
            </small>
          </div>
        </div>

      </section>


      {/* =====================================================
          Profile Signals
      ===================================================== */}

      <section className="profile-signals">

        <div className="profile-signals-heading">

          <div>
            <span className="dashboard-eyebrow">
              PROFILE SIGNALS
            </span>
<section className="dashboard-overview">
  <div className="dashboard-overview-heading">
    <div>
      <span className="dashboard-eyebrow">PROFILE OVERVIEW</span>
      <h2>Your developer profile at a glance.</h2>
    </div>

    <span className="dashboard-analysis-count">
      {analyses.length} analyses
    </span>
  </div>

  <div className="dashboard-score-grid">

    <div className="dashboard-score-card dashboard-score-card--primary">
      <span className="dashboard-score-label">Overall Profile</span>

      <div className="dashboard-score-value">
        {loading ? "—" : overallScore ?? "—"}
        <span>/100</span>
      </div>

      <p>Combined from your latest profile signals.</p>
    </div>


    <div className="dashboard-score-card">
      <span className="dashboard-score-label">Resume</span>

      <div className="dashboard-score-value">
        {loading ? "—" : resumeScore ?? "—"}
        <span>/100</span>
      </div>

      <p>Your latest resume analysis.</p>
    </div>


    <div className="dashboard-score-card">
      <span className="dashboard-score-label">GitHub</span>

      <div className="dashboard-score-value">
        {loading ? "—" : githubScore ?? "—"}
        <span>/100</span>
      </div>

      <p>Your latest GitHub analysis.</p>
    </div>


    <div className="dashboard-score-card">
      <span className="dashboard-score-label">Portfolio</span>

      <div className="dashboard-score-value">
        {loading ? "—" : portfolioScore ?? "—"}
        <span>/100</span>
      </div>

      <p>Your latest portfolio analysis.</p>
    </div>

  </div>
</section>
            <h2>
              Choose what you want to analyze.
            </h2>
          </div>

          <span className="signals-count">
            3 analyzers
          </span>

        </div>


        <div className="profile-signals-list">

          {quickActions.map((action, index) => (
            <QuickActionCard
              key={action.title}
              title={action.title}
              description={action.description}
              icon={action.icon}
              path={action.path}
              number={`0${index + 1}`}
            />
          ))}

        </div>

      </section>


      {/* =====================================================
          AI Copilot
      ===================================================== */}

      <AICopilot
        isOpen={isCopilotOpen}
        onOpen={() => setIsCopilotOpen(true)}
        onClose={() => setIsCopilotOpen(false)}
      />

    </section>
  );
}


export default Dashboard;
import { useState } from "react";
import resumeIcon from "../assets/icons/resume-icon.png";
import ReactMarkdown from "react-markdown";
import { supabase } from "../lib/supabase";
import { saveAnalysis } from "../services/analysisService";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
import "./ResumeAnalyzer.css";


function ResumeAnalyzer() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
const [loading, setLoading] = useState(false);
const [errorMessage, setErrorMessage] = useState("");
const [resumeText, setResumeText] = useState("");
const [analysis, setAnalysis] = useState(null);
const [copilotMessages, setCopilotMessages] = useState([]);
const [copilotInput, setCopilotInput] = useState("");
const [copilotLoading, setCopilotLoading] = useState(false);
const [copilotError, setCopilotError] = useState("");
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) setSelectedFile(file);
  };

  const extractPdfText = async (file) => {
  const arrayBuffer = await file.arrayBuffer();

  const pdf = await pdfjsLib.getDocument({
    data: arrayBuffer,
  }).promise;

  const pages = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();

    const pageText = content.items
      .map((item) => item.str || "")
      .join(" ");

    pages.push(pageText);
  }

  return pages.join("\n\n").trim();
};

  const handleAnalyzeResume = async () => {
  if (!selectedFile || loading) return;

  setLoading(true);
  setErrorMessage("");

  try {
        let resumeText = "";

    if (selectedFile.type === "application/pdf") {
      resumeText = await extractPdfText(selectedFile);
    }

    if (!resumeText) {
      throw new Error(
        "Could not extract readable text from this resume."
      );
    }

    console.log("Extracted resume text:", {
      characters: resumeText.length,
      preview: resumeText.slice(0, 500),
    });
  const { data, error } = await supabase.functions.invoke(
  "analyze-resume",
  {
    body: {
      resumeText,
      fileName: selectedFile.name,
    },
  }
);

    if (error) {
      let message = "Resume analysis request failed.";

      try {
        const details = await error.context?.json();

        if (details?.error) {
          message = details.error;
        }
      } catch {}

      throw new Error(message);
    }

    if (!data?.success) {
      throw new Error(
        data?.error || "Resume analysis request failed."
      );
    }
setResumeText(resumeText);
setAnalysis(data.analysis);
setCopilotMessages([]);
await saveAnalysis({
  type: "resume",
  score: Number(data.analysis?.overallScore) || 0,
  input: {
    file_name: selectedFile.name,
  },
  result: data.analysis,
  status: "completed",
});
    console.log("Resume backend response:", data);
    setAnalysisResult(data.analysis);
  } catch (error) {
    console.error("Resume analysis error:", error);

    setErrorMessage(
      error?.message || "Unable to analyze resume."
    );
  } finally {
    setLoading(false);
  }
};

const handleCopilotSend = async (event) => {
  event?.preventDefault();

  const question = copilotInput.trim();

  if (
    !question ||
    copilotLoading ||
    !analysis ||
    !resumeText
  ) {
    return;
  }

  setCopilotError("");
  setCopilotLoading(true);

  const previousMessages = [...copilotMessages];

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
        "copilot-resume",
        {
          body: {
            question,
            resumeText,
            analysis,
            history: previousMessages,
          },
        }
      );

    if (error) {
      let message =
        "Unable to get a response from Resume Copilot.";

      try {
        const details = await error.context?.json();

        if (details?.error) {
          message = details.error;
        }
      } catch {}

      throw new Error(message);
    }

    if (!data?.success || !data?.answer) {
      throw new Error(
        data?.error ||
          "Resume Copilot returned an invalid response."
      );
    }

    const assistantMessage = {
      role: "assistant",
      content: data.answer,
    };

    setCopilotMessages((current) => [
      ...current,
      assistantMessage,
    ]);
  } catch (error) {
    console.error(
      "Resume Copilot error:",
      error
    );

    setCopilotError(
      error?.message ||
        "Unable to get a response from Resume Copilot."
    );
  } finally {
    setCopilotLoading(false);
  }
};
  return (
    <div className="resume-page">
      <main className="resume-page-content">
        <header className="resume-hero">
          <span className="resume-eyebrow">RESUME INTELLIGENCE</span>

          <h1>
            Understand how your resume reads
            <span> before a recruiter does.</span>
          </h1>

          <p>
            Upload your resume, inspect its presentation and prepare it for a deeper
            profile analysis.
          </p>
        </header>

        <section className="resume-analyzer-shell">
          <div className="resume-upload-panel">
            <div className="resume-upload-zone">
              {!selectedFile ? (
                <>
                  
                 <div className="resume-document-visual">
  <div className="resume-document-back" />

  <div className="resume-document-front">
    <img
      src={resumeIcon}
      alt="Resume"
      className="resume-document-image"
    />
  </div>
</div>

                  <span className="resume-upload-label">START A NEW SCAN</span>

                  <h2>Bring your resume into the studio.</h2>

                  <p>
                    Drop a PDF or DOCX here, or choose one from your device.
                  </p>

                  <label className="resume-upload-button">
                    <span className="resume-upload-symbol">↥</span>
                    Choose Resume

                    <input
                      type="file"
                      accept=".pdf,.docx"
                      onChange={handleFileChange}
                    />
                  </label>

                  <small>PDF / DOCX · Maximum 5 MB</small>
                </>
              ) : (
                <div className="resume-file-selected">
                  <div className="resume-document-visual">
                    <div className="resume-document-back" />

                    <div className="resume-document-front selected">
                      <div className="resume-document-icon">
                        <img
                             src={resumeIcon}
                             alt="Resume"
                             className="uploaded-resume-image"
                        />
                      </div>

                      <span />
                      <span />
                    </div>
                  </div>

                  <span className="resume-upload-label">READY TO ANALYZE</span>

                  <h2>{selectedFile.name}</h2>

                  <p>Your resume is ready for analysis.</p>

 <div className="resume-selected-actions">
<button
  type="button"
  className="resume-analyze-button"
  onClick={handleAnalyzeResume}
  disabled={loading}
>
  <span>
    {loading ? "Analyzing Resume..." : "Analyze Resume"}
  </span>

  {!loading && <span>→</span>}
</button>

{errorMessage && (
  <p className="resume-analysis-error">
    {errorMessage}
  </p>
)}

  <button
    type="button"
    className="resume-change-link"
    onClick={() => setSelectedFile(null)}
  >
    Choose a different resume
  </button>
</div>
                </div>
              )}
            </div>
          </div>

<aside className="resume-analysis-panel">
  {analysisResult ? (
    <div className="resume-result-report">
      <span className="resume-result-eyebrow">
        RESUME INTELLIGENCE
      </span>

      <div className="resume-result-score">
        <span>{analysisResult.overallScore}</span>
        <small>/100</small>
      </div>

      <h2>Your Resume Analysis</h2>

      {analysisResult.overallSummary && (
        <p className="resume-overall-summary">
          {analysisResult.overallSummary}
        </p>
      )}

      <div className="resume-score-list">
        {[
          analysisResult.scores?.atsReadability,
          analysisResult.scores?.structure,
          analysisResult.scores?.skillsKeywords,
          analysisResult.scores?.experienceImpact,
          analysisResult.scores?.clarity,
        ]
          .filter(Boolean)
          .map((item, index) => (
            <div className="resume-score-card" key={index}>
              <div className="resume-score-info">
                <span>{item.label}</span>

                <p>
                  {item.explanation}
                </p>
              </div>

              <strong>
                {item.score}/100
              </strong>
            </div>
          ))}
      </div>

      <div className="resume-result-section">
        <h3>What You're Doing Well</h3>

        {analysisResult.strengths?.map((item, index) => (
          <div className="resume-feedback-item" key={index}>
            <strong>✓ {item.title}</strong>
            <p>{item.explanation}</p>
          </div>
        ))}
      </div>

      <div className="resume-result-section">
        <h3>What Is Holding Your Resume Back</h3>

        {analysisResult.weaknesses?.map((item, index) => (
          <div className="resume-feedback-item" key={index}>
            <strong>{item.title}</strong>

            <p>{item.explanation}</p>

            {item.whyItMatters && (
              <p>
                <b>Why this matters:</b>{" "}
                {item.whyItMatters}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="resume-result-section">
        <h3>What To Improve First</h3>

        {analysisResult.improvements?.map((item, index) => (
          <div className="resume-feedback-item" key={index}>
            <div className="resume-improvement-heading">
              <strong>
                {index + 1}. {item.title}
              </strong>

              {item.priority && (
                <span className="resume-priority">
                  {item.priority}
                </span>
              )}
            </div>

            <p>{item.action}</p>
          </div>
        ))}
      </div>

      {analysisResult.recruiterView && (
        <div className="resume-result-section">
          <h3>Recruiter's 30-Second View</h3>

          <div className="resume-recruiter-item">
            <strong>Role your resume currently fits</strong>
            <p>
              {analysisResult.recruiterView.likelyRole}
            </p>
          </div>

          <div className="resume-recruiter-item">
            <strong>What stands out</strong>
            <p>
              {analysisResult.recruiterView.strongestSignal}
            </p>
          </div>

          <div className="resume-recruiter-item">
            <strong>Main concern</strong>
            <p>
              {analysisResult.recruiterView.biggestConcern}
            </p>
          </div>

          <div className="resume-recruiter-item">
            <strong>What proof is missing</strong>
            <p>
              {analysisResult.recruiterView.missingProof}
            </p>
          </div>

          <div className="resume-recruiter-item">
            <strong>Recruiter Confidence</strong>
            <p>
              {analysisResult.recruiterView.recruiterConfidence}/100
            </p>
          </div>
        </div>
      )}
{/* =========================================
    RESUME AI COPILOT — GITHUB UI SYSTEM
========================================= */}

<section className="resume-copilot github-style-copilot">

  <div className="resume-copilot-topline">
    <span className="resume-copilot-label">
      AI COPILOT
    </span>

    <span className="resume-copilot-context">
      CONTEXT READY
    </span>
  </div>

  <h3 className="resume-copilot-title">
    Ask about this resume
  </h3>

  {/* QUICK PROMPTS */}
  <div className="resume-copilot-quick-prompts">

    <button
      type="button"
      onClick={() =>
        setCopilotInput(
          "What should I improve first?"
        )
      }
    >
      What should I improve first?
    </button>

    <button
      type="button"
      onClick={() =>
        setCopilotInput(
          "Why is my resume score weak?"
        )
      }
    >
      Why is my resume score weak?
    </button>

    <button
      type="button"
      onClick={() =>
        setCopilotInput(
          "What would a recruiter notice first?"
        )
      }
    >
      What would a recruiter notice?
    </button>

  </div>

  {/* CHAT HISTORY */}
  {copilotMessages.length > 0 && (
    <div className="resume-copilot-chat">

      {copilotMessages.map(
        (message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`resume-copilot-bubble ${
              message.role === "user"
                ? "resume-copilot-user"
                : "resume-copilot-ai"
            }`}
          >
            <span className="resume-copilot-role">
              {message.role === "user"
                ? "YOU"
                : "AI COPILOT"}
            </span>

            <div className="resume-copilot-answer">
  <ReactMarkdown>
    {message.content}
  </ReactMarkdown>
</div>
          </div>
        )
      )}

      {copilotLoading && (
        <div className="resume-copilot-bubble resume-copilot-ai">
          <span className="resume-copilot-role">
            AI COPILOT
          </span>

          <div className="resume-copilot-dots">
            <span />
            <span />
            <span />
          </div>
        </div>
      )}

    </div>
  )}

  {/* ERROR */}
  {copilotError && (
    <div className="resume-copilot-error">
      {copilotError}
    </div>
  )}

  {/* INPUT ROW */}
  <form
    className="resume-copilot-input-row"
    onSubmit={handleCopilotSend}
  >

    <input
      type="text"
      value={copilotInput}
      onChange={(event) =>
        setCopilotInput(event.target.value)
      }
      placeholder="Ask about your resume..."
      disabled={copilotLoading}
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

  <p className="resume-copilot-note">
    Copilot uses this resume analysis as profile context.
  </p>

</section>
    </div>
  ) : (
    <div className="resume-empty-report">
      <div className="resume-empty-mark">
        <span>01</span>
      </div>

      <span className="resume-result-eyebrow">
        RESUME INTELLIGENCE
      </span>

      <h2>
        {selectedFile
          ? "Your resume is ready."
          : "Your resume intelligence will appear here."}
      </h2>

      <p>
        {selectedFile
          ? "Run the analysis to reveal your score, recruiter signals, weaknesses and next improvements."
          : "Upload your resume and run one analysis to generate your complete report."}
      </p>

      <div className="resume-empty-lines">
        <span />
        <span />
        <span />
      </div>
    </div>
  )}
</aside>
        </section>
      </main>

      <footer className="resume-page-footer">
        <div className="resume-footer-brand">
          <strong>DevProfile</strong>
          <span>© 2026 DevProfile AI Studio. Career Intelligence Architecture.</span>
        </div>

        <nav>
          <span>ATS Standard Protocol</span>
          <span>Developer API</span>
          <span>Privacy Framework</span>
          <span>System Status</span>
        </nav>
      </footer>
    </div>
  );
}

export default ResumeAnalyzer;
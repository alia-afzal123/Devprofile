import { useState } from "react";
import { supabase } from "../lib/supabase";
import ReactMarkdown from "react-markdown";
import "./AICopilot.css";

function AICopilot({ isOpen, onOpen, onClose }) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingComparison, setPendingComparison] = useState(null);

  const hasConversation = messages.length > 0;

  const handleSubmit = async (event) => {
    event.preventDefault();

    const cleanMessage = message.trim();

    if (!cleanMessage || isLoading) {
      return;
    }

    const newMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      text: cleanMessage,
    };

    setMessages((previousMessages) => [
      ...previousMessages,
      newMessage,
    ]);

    setMessage("");
    setIsLoading(true);

    try {
      // Check whether user is confirming a pending comparison
      const isConfirmation =
        Boolean(pendingComparison) &&
        /^(yes|yeah|yep|yup|confirm|confirmed|sure|yes.*same|same developer|same person)/i.test(
          cleanMessage
        );

      // If user confirms, resend the ORIGINAL comparison question
      // with explicit confirmation.
      const requestBody = isConfirmation
        ? {
            question: pendingComparison.question,
            sameDeveloperConfirmed: true,
          }
        : {
            question: cleanMessage,
          };

      const { data, error } = await supabase.functions.invoke(
        "copilot-dashboard",
        {
          body: requestBody,
        }
      );

      if (error) {
        throw error;
      }

      // Backend detected a cross-profile comparison.
      if (data?.needsConfirmation) {
        setPendingComparison({
          question: cleanMessage,
          types: data?.types || [],
        });
      } else if (isConfirmation) {
        // Comparison completed, so clear pending state.
        setPendingComparison(null);
      }

      const assistantMessage = {
        id: `${Date.now()}-assistant`,
        role: "assistant",
        text:
          data?.answer ||
          "I couldn't generate a response right now.",
      };

      setMessages((previousMessages) => [
        ...previousMessages,
        assistantMessage,
      ]);
    } catch (error) {
      console.error("Dashboard Copilot error:", error);

      const errorMessage = {
        id: `${Date.now()}-error`,
        role: "assistant",
        text:
          "I couldn't connect to the AI Copilot right now. Please try again.",
      };

      setMessages((previousMessages) => [
        ...previousMessages,
        errorMessage,
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestion = (suggestion) => {
    setMessage(suggestion);
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        className="ai-copilot-trigger"
        onClick={onOpen}
        aria-label="Open AI Copilot"
      >
        ✦
      </button>
    );
  }

  return (
    <div className="ai-copilot">
      <div className="ai-copilot-header">
        <div>
          <span className="ai-copilot-label">AI COPILOT</span>

          <h3>DevProfile Assistant</h3>

          <p>Ask about your saved analyses</p>
        </div>

        <button
          type="button"
          className="ai-copilot-close"
          onClick={onClose}
          aria-label="Close AI Copilot"
        >
          ×
        </button>
      </div>

      <div className="ai-copilot-body">
        {!hasConversation && (
          <div className="ai-copilot-welcome">
            <p>
              I can help you understand your Resume, GitHub,
              or Portfolio analysis.
            </p>

            <div className="ai-copilot-suggestions">
              <button
                type="button"
                onClick={() =>
                  handleSuggestion(
                    "Explain my latest resume analysis"
                  )
                }
              >
                Explain my latest resume analysis
              </button>

              <button
                type="button"
                onClick={() =>
                  handleSuggestion(
                    "Why was my latest GitHub score low?"
                  )
                }
              >
                Why was my GitHub score low?
              </button>

              <button
                type="button"
                onClick={() =>
                  handleSuggestion(
                    "What should I improve in my latest portfolio analysis?"
                  )
                }
              >
                Improve my portfolio
              </button>
            </div>
          </div>
        )}

        {hasConversation && (
          <div className="ai-copilot-messages">
            {messages.map((chatMessage) => (
              <div
                key={chatMessage.id}
                className={`ai-copilot-message ${
                  chatMessage.role === "user"
                    ? "user-message"
                    : "assistant-message"
                }`}
              >
                <ReactMarkdown>
  {chatMessage.text}
</ReactMarkdown>
              </div>
            ))}

            {isLoading && (
              <div className="ai-copilot-message assistant-message">
                Thinking...
              </div>
            )}
          </div>
        )}
      </div>

      <form
        className="ai-copilot-form"
        onSubmit={handleSubmit}
      >
        <input
          type="text"
          value={message}
          onChange={(event) =>
            setMessage(event.target.value)
          }
          placeholder="Ask about your analyses..."
          disabled={isLoading}
        />

        <button
          type="submit"
          disabled={!message.trim() || isLoading}
        >
          {isLoading ? "..." : "Send"}
        </button>
      </form>
    </div>
  );
}

export default AICopilot;
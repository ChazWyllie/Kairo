"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import Card from "@/components/ui/Card";
import StarRating from "@/components/ui/StarRating";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/lib/auth-context";

const SUGGESTION_CATEGORIES = ["Workouts", "Nutrition", "App Experience", "Other"] as const;

export default function MorePage() {
  const { toast } = useToast();
  const { member } = useAuth();

  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);

  const [suggestionCategory, setSuggestionCategory] = useState("Other");
  const [suggestionText, setSuggestionText] = useState("");
  const [suggestionSubmitted, setSuggestionSubmitted] = useState(false);
  const [suggestionLoading, setSuggestionLoading] = useState(false);

  async function handleReviewSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) { toast("Please select a star rating.", "error"); return; }
    if (!member?.email) { toast("Not signed in.", "error"); return; }
    setReviewLoading(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "review", email: member.email, rating, comment: reviewText || undefined }),
      });
      if (!res.ok) throw new Error("Failed to submit review");
      setReviewSubmitted(true);
      toast("Thanks for your review!", "success");
    } catch {
      toast("Something went wrong. Try again.", "error");
    } finally {
      setReviewLoading(false);
    }
  }

  async function handleSuggestionSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!suggestionText.trim()) { toast("Please enter a suggestion.", "error"); return; }
    if (!member?.email) { toast("Not signed in.", "error"); return; }
    setSuggestionLoading(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "suggestion", email: member.email, category: suggestionCategory, comment: suggestionText }),
      });
      if (!res.ok) throw new Error("Failed to submit suggestion");
      setSuggestionSubmitted(true);
      toast("Thanks for the feedback!", "success");
    } catch {
      toast("Something went wrong. Try again.", "error");
    } finally {
      setSuggestionLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "var(--bg-tertiary)",
    border: "1px solid var(--border-hover)",
    borderRadius: "8px",
    padding: "12px",
    color: "var(--text-primary)",
    fontSize: "16px",
    lineHeight: 1.5,
    resize: "vertical",
    boxSizing: "border-box",
    outline: "none",
  };

  const btnStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px",
    background: "var(--accent-primary)",
    color: "var(--bg-primary)",
    border: "none",
    borderRadius: "8px",
    fontSize: "0.9375rem",
    fontWeight: 600,
    cursor: "pointer",
    marginTop: "12px",
  };

  return (
    <div>
      <PageHeader title="More" />

      {/* Review section */}
      <section style={{ marginBottom: "16px" }}>
        <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>
          Leave a Review
        </p>
        <Card>
          {reviewSubmitted ? (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <p style={{ fontSize: "1.5rem", marginBottom: "8px" }}>✅</p>
              <p style={{ fontSize: "0.9375rem", color: "var(--text-primary)", fontWeight: 600 }}>Thank you!</p>
              <p style={{ fontSize: "0.875rem", color: "var(--text-tertiary)" }}>Your review helps us grow.</p>
            </div>
          ) : (
            <form onSubmit={handleReviewSubmit}>
              <div style={{ marginBottom: "12px" }}>
                <StarRating value={rating} onChange={setRating} />
              </div>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Tell others about your experience..."
                rows={3}
                style={inputStyle}
              />
              <button type="submit" disabled={reviewLoading} style={{ ...btnStyle, opacity: reviewLoading ? 0.7 : 1 }}>
                {reviewLoading ? "Submitting..." : "Submit Review"}
              </button>
            </form>
          )}
        </Card>
      </section>

      {/* Suggestions section */}
      <section style={{ marginBottom: "16px" }}>
        <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>
          Suggestions
        </p>
        <Card>
          {suggestionSubmitted ? (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <p style={{ fontSize: "1.5rem", marginBottom: "8px" }}>💡</p>
              <p style={{ fontSize: "0.9375rem", color: "var(--text-primary)", fontWeight: 600 }}>Got it!</p>
              <p style={{ fontSize: "0.875rem", color: "var(--text-tertiary)" }}>We read every suggestion.</p>
            </div>
          ) : (
            <form onSubmit={handleSuggestionSubmit}>
              <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "12px" }}>
                Help us improve Kairo.
              </p>
              <select
                value={suggestionCategory}
                onChange={(e) => setSuggestionCategory(e.target.value)}
                style={{ ...inputStyle, marginBottom: "10px", appearance: "none" }}
              >
                {SUGGESTION_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
              <textarea
                value={suggestionText}
                onChange={(e) => setSuggestionText(e.target.value)}
                placeholder="What feature or improvement would you love to see?"
                rows={3}
                style={inputStyle}
              />
              <button type="submit" disabled={suggestionLoading} style={{ ...btnStyle, opacity: suggestionLoading ? 0.7 : 1 }}>
                {suggestionLoading ? "Submitting..." : "Send Suggestion"}
              </button>
            </form>
          )}
        </Card>
      </section>

      {/* Support & info */}
      <section>
        <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>
          Support
        </p>
        <Card>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <a
              href="https://wa.me/1XXXXXXXXXX"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                color: "var(--accent-secondary)",
                textDecoration: "none",
                fontSize: "0.9375rem",
                fontWeight: 500,
              }}
            >
              <MessageCircle size={18} />
              Message coach on WhatsApp
            </a>
            <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "14px", display: "flex", gap: "16px" }}>
              <a href="/terms" style={{ fontSize: "0.875rem", color: "var(--text-tertiary)" }}>Terms of Service</a>
              <a href="/privacy" style={{ fontSize: "0.875rem", color: "var(--text-tertiary)" }}>Privacy Policy</a>
            </div>
            <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", margin: 0 }}>Version 0.1.0</p>
          </div>
        </Card>
      </section>
    </div>
  );
}

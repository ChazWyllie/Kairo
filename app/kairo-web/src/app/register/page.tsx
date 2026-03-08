"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { track } from "@/lib/analytics";
import { isValidEmail } from "@/lib/validation";
import { components } from "@/lib/design-tokens";

/**
 * /register — Set password for existing active members
 *
 * Only works if the member has completed Stripe checkout.
 * This is the post-payment onboarding step for account access.
 */
export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isValidEmail(email)) {
      setError("Please enter a valid email.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(
          data?.error?.message ??
            "Registration failed. Make sure you've completed checkout first."
        );
      }

      track({ name: "member_registered", properties: {} });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-50 text-black">
      <div className="mx-auto max-w-md px-6 py-16">
        <h1 className="text-2xl font-semibold text-center">
          Set Up Your Account
        </h1>
        <p className="mt-2 text-center text-neutral-500 text-sm">
          Create a password to access your coaching dashboard.
          <br />
          You must have completed checkout first.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-neutral-700 mb-1"
            >
              Email (same as checkout)
            </label>
            <input
              id="email"
              type="email"
              className={components.input.base}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-neutral-700 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              className={components.input.base}
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              minLength={8}
            />
          </div>

          <div>
            <label
              htmlFor="confirm"
              className="block text-sm font-medium text-neutral-700 mb-1"
            >
              Confirm password
            </label>
            <input
              id="confirm"
              type="password"
              className={components.input.base}
              placeholder="Re-enter password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
              minLength={8}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full ${components.button.primary}`}
          >
            {loading ? "Setting up…" : "Create Account"}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-neutral-500">
            Already have an account?{" "}
            <Link href="/login" className="text-black underline">
              Sign in
            </Link>
          </p>
          <Link href="/" className={components.button.ghost}>
            ← Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}

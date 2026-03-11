"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { track } from "@/lib/analytics";
import { isValidEmail } from "@/lib/validation";
import { components } from "@/lib/design-tokens";

/**
 * /login — Member sign-in page
 *
 * Email + password authentication.
 * On success, sets a session cookie and redirects to /dashboard.
 */
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error?.message ?? "Invalid email or password");
      }

      const role = data?.role;
      if (role === "coach") {
        track({ name: "coach_login", properties: {} });
        // Cookie-based auth: server set httpOnly coach_session cookie,
        // so we redirect without exposing the secret in the URL.
        router.push("/coach");
      } else {
        track({ name: "member_login", properties: {} });
        router.push("/dashboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-50 text-black">
      <div className="mx-auto max-w-md px-6 py-16">
        <h1 className="text-2xl font-semibold text-center">Sign In</h1>
        <p className="mt-2 text-center text-neutral-500 text-sm">
          Access your Kairo Coaching dashboard.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">
              Email
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
            <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              className={components.input.base}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
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
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-neutral-500">
            Forgot your password? Contact your admin to reset your credentials.
          </p>
          <Link href="/" className={components.button.ghost}>
            ← Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}

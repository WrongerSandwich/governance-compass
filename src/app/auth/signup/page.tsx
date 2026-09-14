"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/Button";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name: name || undefined }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Signup failed");
      return;
    }

    // Auto sign in after registration
    await signIn("credentials", {
      email,
      password,
      callbackUrl: "/account",
    });
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-surface-1 rounded-sharp border border-border-secondary p-8 w-full max-w-md">
        <h1 className="display-m text-text-primary mb-6">
          Create account
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="signup-name" className="block text-sm font-medium text-text-secondary mb-1">
              Name (optional)
            </label>
            <input
              id="signup-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-sharp border border-border-primary px-3 py-2 bg-surface-1 text-text-primary focus-ring"
            />
          </div>
          <div>
            <label htmlFor="signup-email" className="block text-sm font-medium text-text-secondary mb-1">
              Email
            </label>
            <input
              id="signup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              aria-required="true"
              className="w-full rounded-sharp border border-border-primary px-3 py-2 bg-surface-1 text-text-primary focus-ring"
            />
          </div>
          <div>
            <label htmlFor="signup-password" className="block text-sm font-medium text-text-secondary mb-1">
              Password
            </label>
            <input
              id="signup-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              aria-required="true"
              minLength={8}
              aria-describedby="pwd-hint"
              className="w-full rounded-sharp border border-border-primary px-3 py-2 bg-surface-1 text-text-primary focus-ring"
            />
            <p id="pwd-hint" className="text-xs text-text-secondary mt-1">Minimum 8 characters</p>
          </div>
          <div aria-live="polite" aria-atomic="true">
            {error && (
              <p role="alert" className="text-sm text-warning-text">
                {error}
              </p>
            )}
          </div>
          <Button type="submit" variant="secondary" className="w-full">
            Create account
          </Button>
        </form>
        <div className="mt-4">
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => signIn("google", { callbackUrl: "/account" })}
          >
            Continue with Google
          </Button>
        </div>
        <p className="mt-4 text-sm text-center text-text-secondary">
          Already have an account?{" "}
          <Link
            href="/auth/signin"
            className="text-text-primary hover:text-text-secondary transition-colors duration-150 focus-ring"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}

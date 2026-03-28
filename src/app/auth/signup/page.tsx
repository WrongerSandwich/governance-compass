"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

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
      <div className="bg-surface-1 rounded-[12px] border border-border-secondary p-8 w-full max-w-md">
        <h1 className="text-[22px] font-serif font-medium text-text-primary mb-6">
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
              className="w-full rounded-[8px] border border-border-primary px-3 py-2 bg-surface-1 text-text-primary focus:outline-none focus-visible:outline-2 focus-visible:outline-stone-600 focus-visible:outline-offset-2"
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
              className="w-full rounded-[8px] border border-border-primary px-3 py-2 bg-surface-1 text-text-primary focus:outline-none focus-visible:outline-2 focus-visible:outline-stone-600 focus-visible:outline-offset-2"
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
              className="w-full rounded-[8px] border border-border-primary px-3 py-2 bg-surface-1 text-text-primary focus:outline-none focus-visible:outline-2 focus-visible:outline-stone-600 focus-visible:outline-offset-2"
            />
            <p id="pwd-hint" className="text-xs text-text-tertiary mt-1">Minimum 8 characters</p>
          </div>
          <div aria-live="polite" aria-atomic="true">
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
          <button
            type="submit"
            className="w-full border border-stone-600 text-stone-600 py-2 rounded-[8px] font-medium hover:bg-stone-100 transition-colors duration-150"
          >
            Create account
          </button>
        </form>
        <div className="mt-4">
          <button
            onClick={() => signIn("google", { callbackUrl: "/account" })}
            className="w-full border border-border-primary text-text-secondary py-2 rounded-[8px] font-medium hover:bg-surface-2 transition-colors duration-150"
          >
            Continue with Google
          </button>
        </div>
        <p className="mt-4 text-sm text-center text-text-tertiary">
          Already have an account?{" "}
          <Link href="/auth/signin" className="text-stone-600 hover:text-stone-800">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}

"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    if (result?.error) {
      setError("Invalid email or password");
    } else {
      window.location.href = "/account";
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-surface-1 rounded-[12px] border border-border-secondary p-8 w-full max-w-md">
        <h1 className="text-[22px] font-serif font-medium text-text-primary mb-6">Sign in</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="signin-email" className="block text-sm font-medium text-text-secondary mb-1">
              Email
            </label>
            <input
              id="signin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              aria-required="true"
              className="w-full rounded-[8px] border border-border-primary px-3 py-2 bg-surface-1 text-text-primary focus:outline-none focus-visible:outline-2 focus-visible:outline-stone-600 focus-visible:outline-offset-2"
            />
          </div>
          <div>
            <label htmlFor="signin-password" className="block text-sm font-medium text-text-secondary mb-1">
              Password
            </label>
            <input
              id="signin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              aria-required="true"
              className="w-full rounded-[8px] border border-border-primary px-3 py-2 bg-surface-1 text-text-primary focus:outline-none focus-visible:outline-2 focus-visible:outline-stone-600 focus-visible:outline-offset-2"
            />
          </div>
          <div aria-live="polite" aria-atomic="true">
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
          <button
            type="submit"
            className="w-full border border-stone-600 text-stone-600 py-2 rounded-[8px] font-medium hover:bg-stone-100 transition-colors duration-150"
          >
            Sign in
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
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup" className="text-stone-600 hover:text-stone-800">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}

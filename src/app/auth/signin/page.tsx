"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/Button";

export default function SignInPage() {
  const router = useRouter();
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
      router.push("/account");
      // Re-fetch server components so they see the new session cookie
      router.refresh();
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-surface-1 rounded-sharp border border-border-secondary p-8 w-full max-w-md">
        <h1 className="display-m text-text-primary mb-6">Sign in</h1>
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
              className="w-full rounded-sharp border border-border-primary px-3 py-2 bg-surface-1 text-text-primary focus-ring"
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
              className="w-full rounded-sharp border border-border-primary px-3 py-2 bg-surface-1 text-text-primary focus-ring"
            />
          </div>
          <div aria-live="polite" aria-atomic="true">
            {error && (
              <p role="alert" className="text-sm text-warning-text">
                {error}
              </p>
            )}
          </div>
          <Button type="submit" variant="secondary" className="w-full">
            Sign in
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
          Don&apos;t have an account?{" "}
          <Link
            href="/auth/signup"
            className="text-text-primary hover:text-text-secondary transition-colors duration-150 focus-ring"
          >
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}

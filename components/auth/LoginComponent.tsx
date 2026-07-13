"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthLayout from "./AuthLayout";
import { AuthInput } from "./AuthInput";
import { useAuth } from "./AuthProvider";

export default function LoginComponent() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/dashboard/home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      console.log(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Sign in" subtitle="Welcome back to Klist">
      <form onSubmit={handleSubmit} className="space-y-4 ">
        <AuthInput
          label="Email"
          type="email"
          autoComplete="email"
          
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <AuthInput
          label="Password"
          type="password"
          autoComplete="current-password"
          
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading} className="w-full rounded-lg bg-green-900 px-4 py-2 text-sm font-semibold text-white hover:bg-green-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50">
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
      
    </AuthLayout>
  );
}